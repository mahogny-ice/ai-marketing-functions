import { onRequest } from "firebase-functions/v2/https";
import fetch from "node-fetch";
import * as logger from "firebase-functions/logger";
import { getAccessToken } from "./spotifyAuth";
import { enforceRateLimit } from "./enforceRateLimit";
import * as FormData from "form-data";

// Define a TypeScript interface for the asset upload options
interface UploadAssetOptions {
    assetId: string;
    fileUrl: string;
    fileName: string;
    assetType: "IMAGE" | "AUDIO" | "VIDEO"; // Restrict to allowed asset types
}

/**
 * Uploads an asset to the Spotify Ad Account.
 *
 * @param {UploadAssetOptions} options - The options for uploading the asset.
 * @return {Promise<unknown>} The response data from the Spotify API.
 * @throws {Error} If there is an issue making the API request or parsing the response.
 */
async function uploadAsset(options: UploadAssetOptions): Promise<unknown> {
    const spotifyAdsAccountId = process.env.SPOTIFY_USER_ID;

    try {
        await enforceRateLimit(); // Check the rate limit before making the request

        const fileResponse = await fetch(options.fileUrl);
        if (!fileResponse.ok) {
            throw new Error(`Failed to fetch file from ${options.fileUrl}: ${fileResponse.statusText}`);
        }

        const fileBuffer = await fileResponse.buffer();

        const token = await getAccessToken();
        const url = new URL(`https://api-partner.spotify.com/ads/v2/ad_accounts/${spotifyAdsAccountId}/assets/${options.assetId}/upload`);

        const form = new FormData();
        form.append("media", fileBuffer, {
            filename: options.fileName,
            contentType: fileResponse.headers.get("content-type") || undefined, // Ensure the correct content type
        });
        form.append("asset_type", options.assetType);

        const response = await fetch(url.toString(), {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                ...form.getHeaders(), // Get the correct form-data headers
            },
            body: form,
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
        logger.error("Error uploading Spotify asset", error);
        throw new Error(`Error uploading Spotify asset: ${(error as Error).message}`);
    }
}

/**
 * HTTP endpoint to upload a Spotify asset.
 * Exposes the `uploadAsset` function as an API endpoint.
 */
export const uploadSpotifyAsset = onRequest(async (request, response) => {
    try {
        const { assetId, fileUrl, fileName, assetType } = request.body as UploadAssetOptions;

        // Validate input
        if (!assetId || !fileUrl || !fileName || !assetType) {
            response.status(400).json({
                status: "Error",
                message: "Missing required fields: assetId, fileUrl, fileName, and assetType are required.",
            });
            return;
        }

        const data = await uploadAsset({ assetId, fileUrl, fileName, assetType });

        response.status(200).json({
            status: "Success",
            message: "Asset uploaded successfully.",
            data: data,
        });
    } catch (error: unknown) {
        logger.error("Error in uploadSpotifyAsset", error);
        response.status(500).json({
            status: "Error",
            message: "Error uploading asset.",
            error: (error as Error).message,
        });
    }
});
