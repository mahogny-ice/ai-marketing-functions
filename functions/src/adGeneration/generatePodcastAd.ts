import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { generatePodcastComponents } from "./generatePodcastComponents";

export const generatePodcastAd = onRequest(async (request, response) => {
    logger.info("Merge audio logs!", { structuredData: true });

    // const mergeAudioUrl = "https://merge-media-dx3v2rbg6q-od.a.run.app/mergeaudio";

    type LeapInput = {
        music_prompt: string;
        duration_in_seconds: number;
    }

    const leapInput: LeapInput = request.body.leapInput;

    await generatePodcastComponents(leapInput).then(async (result) => {
        if (!result) {
            logger.error("Error generating podcast components", { structuredData: true });
            response.status(500).send("Error generating podcast components");
            return;
        } else {
            if (!result.musicUrl) {
                logger.error("Error generating podcast ad music", { structuredData: true });
                response.status(500).send("Error generating podcast ad music");
                return;
            } else if (!result.voUrl) {
                logger.error("Error generating podcast ad voiceover", { structuredData: true });
                response.status(500).send("Error generating podcast ad voiceover");
                return;
            } else {
                logger.info("Successfully generated podcast components", { structuredData: true });
            }
        }

        // Getting url from Gradio API
        const track1 = result.musicUrl;
        const track2 = result.voUrl;

        console.log("track1: ", track1);
        console.log("track2: ", track2);

        // const mergeAudioResponse = await fetch(mergeAudioUrl, {
        //     method: "POST",
        //     body: JSON.stringify({ track1, track2 }),
        //     headers: { "Content-Type": "application/json" },
        // });

        // if (!mergeAudioResponse.ok) {
        //     logger.error("Error merging audio", { structuredData: true });
        //     response.status(500).send("Error merging audio");
        //     return;
        // } else {
        //     logger.info("Successfully merged audio", { structuredData: true });
        //     const res = await mergeAudioResponse.json();
        //     response.json(res);
        // }

        response.json({ track1, track2 });
    }).catch((error) => {
        logger.error("Error generating podcast components: ", { structuredData: true });
        logger.error(error, { structuredData: true });
        response.status(500).send("Error generating podcast components");
    });
});
