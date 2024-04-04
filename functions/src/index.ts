import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

export const helloWorld = onRequest((request, response) => {
    logger.info("Hello logs!", { structuredData: true });
    response.send("Hello from Firebase!");
});

export const mergeAudio = onRequest(async (request, response) => {
    logger.info("Merge audio logs!", { structuredData: true });

    const mergeAudioUrl = "https://merge-media-dx3v2rbg6q-od.a.run.app/mergeaudio";

    const { track1, track2 } = request.body;

    if (!track1 || !track2) {
        logger.error("Missing track1 or track2", { structuredData: true });
        response.status(400).send("Missing track1 or track2. Please provide both tracks in the request body.");
        return;
    }

    const mergeAudioResponse = await fetch(mergeAudioUrl, {
        method: "POST",
        body: JSON.stringify({ track1, track2 }),
        headers: { "Content-Type": "application/json" }
    });

    if (!mergeAudioResponse.ok) {
        logger.error("Error merging audio", { structuredData: true });
        response.status(500).send("Error merging audio");
        return;
    } else {
        logger.info("Successfully merged audio", { structuredData: true });
        response.send(mergeAudioResponse.body);
    }
});