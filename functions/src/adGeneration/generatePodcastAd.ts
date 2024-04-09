import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { generatePodcastComponents } from "./generatePodcastComponents";
import { GradioParams } from "../apiCalls/callGradio";

export const generatePodcastAd = onRequest(async (request, response) => {
    logger.info("Merge audio logs!", { structuredData: true });

    const mergeAudioUrl = "https://merge-media-dx3v2rbg6q-od.a.run.app/mergeaudio";

    type GradioInput = {
        url: string;
        params: GradioParams;
    }

    type LeapInput = {
        music_prompt: string;
        duration_in_seconds: number;
    }

    const gradioInput: GradioInput = request.body.gradioInput;
    const leapInput: LeapInput = request.body.leapInput;

    await generatePodcastComponents(leapInput, gradioInput).then(async (result) => {
        if (!result) {
            logger.error("Error generating podcast components", { structuredData: true });
            response.status(500).send("Error generating podcast components");
            return;
        } else {
            if (!result.leapUrl) {
                logger.error("Error generating podcast ad music", { structuredData: true });
                response.status(500).send("Error generating podcast ad music");
                return;
            } else if (!result.gradioUrl) {
                logger.error("Error generating podcast ad voiceover", { structuredData: true });
                response.status(500).send("Error generating podcast ad voiceover");
                return;
            } else {
                logger.info("Successfully generated podcast components", { structuredData: true });
            }
        }

        //Getting url from Gradio API
        const track1 = result.leapUrl;
        const track2 = result.gradioUrl;

        const mergeAudioResponse = await fetch(mergeAudioUrl, {
            method: "POST",
            body: JSON.stringify({ track1, track2 }),
            headers: { "Content-Type": "application/json" },
        });

        if (!mergeAudioResponse.ok) {
            logger.error("Error merging audio", { structuredData: true });
            response.status(500).send("Error merging audio");
            return;
        } else {
            logger.info("Successfully merged audio", { structuredData: true });
            const res = await mergeAudioResponse.json();
            response.json(res);
        }
    }).catch((error) => {
        logger.error("Error generating podcast components", { structuredData: true });
        response.status(500).send("Error generating podcast components");
    });
});
