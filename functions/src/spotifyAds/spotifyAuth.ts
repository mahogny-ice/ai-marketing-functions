import * as admin from "firebase-admin";
import * as dotenv from "dotenv";
import fetch from "node-fetch";
import * as logger from "firebase-functions/logger";

dotenv.config(); // Load environment variables

const SPOTIFY_ACCOUNT_DOC = "spotifyAuth/admin";

// Define types for the Spotify token response
interface SpotifyTokenResponse {
    access_token: string;
    expires_in: number;
    token_type: string;
}

/**
 * Retrieves the Spotify access token from Firestore.
 * If the token has expired or is invalid, it attempts to refresh it.
 *
 * @return {Promise<string>} The current access token.
 * @throws {Error} If there is an issue retrieving, refreshing, or fetching a new token.
 */
export async function getAccessToken(): Promise<string> {
    try {
        const doc = await admin.firestore().doc(SPOTIFY_ACCOUNT_DOC).get();
        const { access_token, token_expiry } = doc.data() as { access_token: string, token_expiry: number};

        if (Date.now() >= token_expiry) {
            logger.info("Token expired, attempting to refresh.");
            return await refreshSpotifyToken();
        }

        return access_token;
    } catch (error: unknown) {
        logger.error("Error retrieving or refreshing Spotify access token", error);
        throw new Error(`Error retrieving or refreshing Spotify access token: ${(error as Error).message}`);
    }
}

/**
 * Refreshes the Spotify access token using the stored refresh token.
 *
 * @return {Promise<string>} The new access token.
 * @throws {Error} If there is an issue with the token refresh process.
 */
async function refreshSpotifyToken(): Promise<string> {
    console.log("REFRESHING TOKEN");
    const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN as string;
    try {
        const requestOptions = {
            method: "POST",
            headers: {
                "Authorization": `Basic ${process.env.SPOTIFY_CLIENT_CREDENTIALS}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: "grant_type=refresh_token&refresh_token=" + encodeURIComponent(refreshToken),
        };

        const response = await fetch("https://accounts.spotify.com/api/token", requestOptions);
        const data: SpotifyTokenResponse = await response.json();

        if (!response.ok) {
            throw new Error(`Spotify token refresh failed: ${JSON.stringify(data)}`);
        }

        const accessToken = data.access_token;
        const expiresIn = data.expires_in;
        const tokenExpiry = Date.now() + expiresIn * 1000;

        logger.info("New Spotify access token obtained:", accessToken);

        await admin.firestore().doc(SPOTIFY_ACCOUNT_DOC).update({
            accessToken: accessToken,
            tokenExpiry: tokenExpiry,
        });

        return accessToken;
    } catch (error: unknown) {
        logger.error("Error refreshing Spotify access token", error);
        throw new Error(`Error refreshing Spotify access token: ${(error as Error).message}`);
    }
}
