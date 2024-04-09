import * as logger from "firebase-functions/logger";
import { triggerLeapWorkflow } from "../apiCalls/callLeap";
import { triggerMockApi } from "../apiCalls/mockApi";

type LeapInput = {
    music_prompt: string;
    duration_in_seconds: number;
}

export async function generatePodcastComponents(leapInput: LeapInput) {

    let musicUrl: string | undefined = '';
    let voUrl: string | undefined = '';

    // Call the Leap API to generate podcast ad music
    try {
        await triggerLeapWorkflow(leapInput).then((result) => {

            if (result.status !== "completed") {
                logger.error("Error generating podcast ad music", { structuredData: true });
                throw new Error("Failed to generate podcast ad music");
            } else {
                musicUrl = result.output?.generated_music;
                logger.info("Successfully generated podcast ad music at: ", { structuredData: true });
                logger.info(result, { structuredData: true });
            }
            // logger.info("Successfully generated podcast ad music at: " + musicUrl, { structuredData: true });
            return result;
        }).catch((error) => {
            logger.error("Error generating podcast ad music", { structuredData: true });
            throw new Error("Failed to generate podcast ad music");
        });
    } catch (error) {
        logger.error("Error generating podcast ad music", { structuredData: true });
        return;
    }

    // Call mockApi to generate podcast ad voiceover
    try {
        await triggerMockApi(2000).then((result) => {
            logger.info("Successfully generated podcast ad voiceover", { structuredData: true });
            voUrl = result.output;
            return result;
        }).catch((error) => {
            logger.error("Error generating podcast ad voiceover", { structuredData: true });
            throw new Error("Failed to generate podcast ad voiceover");
        });
    } catch (error) {
        logger.error("Error generating podcast ad voiceover", { structuredData: true });
        return;
    }

    return { musicUrl, voUrl };
}