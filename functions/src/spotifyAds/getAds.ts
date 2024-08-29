import { onRequest } from "firebase-functions/v2/https";
import fetch from "node-fetch";
import * as logger from "firebase-functions/logger";
import { getAccessToken } from "./spotifyAuth";
import { enforceRateLimit } from "./enforceRateLimit";

/**
 * Fetches the list of Spotify Ad Accounts for the current authenticated user.
 *
 * @return {Promise<unknown>} The response data containing the list of Ad Accounts.
 * @throws {Error} If there is an issue making the API request or parsing the response.
 */
async function getAdAccountsForCurrentUser(): Promise<unknown> {
    const spotifyAdsAccountId = process.env.SPOTIFY_USER_ID;
    try {
        await enforceRateLimit(); // Check the rate limit before making the request

        const token = await getAccessToken();

        console.log("Token:", token);
        const url = new URL(`https://api-partner.spotify.com/ads/v2/ad_accounts/${spotifyAdsAccountId}`);

        const response = await fetch(url.toString(), {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
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
        logger.error("Error making Spotify API request to fetch Ad Account", error);
        throw new Error(`Error fetching Ad Account: ${(error as Error).message}`);
    }
}


/**
 * HTTP endpoint to fetch the list of Spotify Ad Accounts for the current authenticated user.
 * Exposes the `getAdAccountsForCurrentUser` function as an API endpoint.
 */
export const getAds = onRequest(async (request, response) => {
    try {
        const data = await getAdAccountsForCurrentUser();
        response.status(200).json({
            status: "Success",
            message: "Ad accounts retrieved successfully.",
            data: data,
        });
    } catch (error: unknown) {
        logger.error("Error in getAdAccountsEndpoint", error);
        response.status(500).json({
            status: "Error",
            message: "Error retrieving ad accounts.",
            error: (error as Error).message,
        });
    }
});
