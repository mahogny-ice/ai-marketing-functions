import { onRequest } from "firebase-functions/v2/https";
import fetch from "node-fetch";
import * as logger from "firebase-functions/logger";
import { getAccessToken } from "./spotifyAuth";
import { enforceRateLimit } from "./enforceRateLimit";

// Define a TypeScript interface for the asset creation options
interface CreateAssetOptions {
    assetType: "IMAGE" | "AUDIO" | "VIDEO"; // Restrict to allowed asset types
    assetSubtype?: string; // Optional subtype for certain asset types (e.g., AUDIO)
    name: string; // Name of the asset
}

/**
 * Creates an asset in the Spotify Ad Account.
 *
 * @param {CreateAssetOptions} options - The asset details.
 * @return {Promise<unknown>} The response data from the Spotify API.
 * @throws {Error} If there is an issue making the API request or parsing the response.
 */
async function createAsset(options: CreateAssetOptions): Promise<unknown> {
    const spotifyAdsAccountId = process.env.SPOTIFY_USER_ID;

    try {
        await enforceRateLimit(); // Check the rate limit before making the request

        const token = await getAccessToken();
        const url = new URL(`https://api-partner.spotify.com/ads/v2/ad_accounts/${spotifyAdsAccountId}/assets`);

        // Prepare the body for the POST request
        const requestBody: any = {
            asset_type: options.assetType,
            name: options.name,
        };

        // Include asset_subtype only if provided
        if (options.assetSubtype) {
            requestBody.asset_subtype = options.assetSubtype;
        }

        const response = await fetch(url.toString(), {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorResponse = await response.json();
            const status = response.status;

            switch (status) {
            case 400:
                throw new Error(`Bad Request: ${JSON.stringify(errorResponse)}`);
            case 403:
                throw new Error(`Forbidden: ${JSON.stringify(errorResponse)}`);
            case 404:
                throw new Error(`Ad Account not found: ${JSON.stringify(errorResponse)}`);
            case 500:
                throw new Error(`Internal Server Error: ${JSON.stringify(errorResponse)}`);
            default:
                throw new Error(`Unexpected error: ${JSON.stringify(errorResponse)}`);
            }
        }

        const data = await response.json();
        return data;
    } catch (error: unknown) {
        logger.error("Error creating Spotify asset", error);
        throw new Error(`Error creating Spotify asset: ${(error as Error).message}`);
    }
}

/**
 * HTTP endpoint to create a Spotify asset.
 * Exposes the `createAsset` function as an API endpoint.
 */
export const createSpotifyAsset = onRequest(async (request, response) => {
    try {
        const { assetType, assetSubtype, name } = request.body as CreateAssetOptions;

        // Validate input
        if (!assetType || !name) {
            response.status(400).json({
                status: "Error",
                message: "Missing required fields: assetType and name are required.",
            });
            return;
        }

        const data = await createAsset({ assetType, assetSubtype, name });

        response.status(200).json({
            status: "Success",
            message: "Asset created successfully.",
            data: data,
        });
    } catch (error: unknown) {
        logger.error("Error in createSpotifyAsset", error);
        response.status(500).json({
            status: "Error",
            message: "Error creating asset.",
            error: (error as Error).message,
        });
    }
});
