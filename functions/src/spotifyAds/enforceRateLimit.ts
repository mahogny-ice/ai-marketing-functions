import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

const RATE_LIMIT_MAX_REQUESTS = 100; // Maximum number of requests allowed
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // Time window in milliseconds (e.g., 1 minute)
const REQUEST_TRACKING_DOC = "spotifyRequestTracking/admin"; // Document to track requests

/**
 * Checks if the request limit has been reached within the defined time window.
 * If the limit is reached, it throws an error. Otherwise, it logs the current request.
 *
 * @return {Promise<void>} Resolves if within the limit, otherwise throws an error.
 * @throws {Error} If the request limit is reached.
 */
export async function enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW_MS;

    try {
        const docRef = admin.firestore().doc(REQUEST_TRACKING_DOC);
        const doc = await docRef.get();

        let requestTimestamps: number[] = [];

        if (doc.exists) {
            const data = doc.data();
            if (data && Array.isArray(data.timestamps)) {
                // Filter out timestamps outside the current window
                requestTimestamps = data.timestamps.filter((timestamp: number) => timestamp >= windowStart);
            }
        }

        if (requestTimestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
            throw new Error("Rate limit exceeded. Please try again later.");
        }

        // Add the current timestamp and update Firestore
        requestTimestamps.push(now);
        await docRef.set({ timestamps: requestTimestamps }, { merge: true });

        logger.info(`Request logged. Total requests in the current window: ${requestTimestamps.length}`);
    } catch (error: unknown) {
        logger.error("Error enforcing rate limit", error);
        throw new Error(`Error enforcing rate limit: ${(error as Error).message}`);
    }
}
