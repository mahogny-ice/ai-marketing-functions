import * as logger from "firebase-functions/logger";
import { GradioAPIResponse, GradioParams, triggerGradioWorkflow } from "../apiCalls/callGradio";
import { LeapResponse, triggerLeapWorkflow } from "../apiCalls/callLeap";

type GradioInput = {
    url: string;
    params: GradioParams;
}

type LeapInput = {
    music_prompt: string;
    duration_in_seconds: number;
}

export async function generatePodcastComponents(leapInput: LeapInput, gradioInput: GradioInput) {

    let leapData: LeapResponse;
    let gradioData: GradioAPIResponse;

    let leapUrl: string = '';
    let gradioUrl: string = '';

    // Call the Leap API to generate podcast ad music
    try {
        leapData = await triggerLeapWorkflow(leapInput).then((result) => {
            logger.info("Successfully generated podcast ad music", { structuredData: true });
            return result;
        }).catch((error) => {
            logger.error("Error generating podcast ad music", { structuredData: true });
            throw new Error("Failed to generate podcast ad music");
        });
    } catch (error) {
        logger.error("Error generating podcast ad music", { structuredData: true });
        return;
    }

    // Call the Gradio API to generate podcast ad voiceover
    try {
        gradioData = await triggerGradioWorkflow(gradioInput.url, gradioInput.params).then((result) => {
            logger.info("Gradio prediction result: ", result);
            return result;
        }).catch((error) => {
            logger.error("Error calling Gradio API: ", error);
            throw new Error("Failed to call Gradio API");
        });
    } catch (error) {
        logger.error("Error calling Gradio API: ", error);
        return;
    }

    // Extract the URLs from the API responses
    if (leapData.output) {
        leapUrl = leapData.output.generated_music;
    }

    if (gradioData.data[1]) {
        gradioUrl = gradioInput.url + gradioData.data[1];
    }

    return { leapUrl, gradioUrl };
}