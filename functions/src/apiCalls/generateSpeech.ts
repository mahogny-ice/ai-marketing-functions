import { onRequest } from "firebase-functions/v2/https";
import { openaiTTS } from "./callOpenAi";
import type { OpenaiInput } from "./callOpenAi";
import * as logger from "firebase-functions/logger";

export const generateSpeech = onRequest(async (request, response) => {
    const prompt = request.body as OpenaiInput;
    try {
        const url = await openaiTTS(prompt);
        logger.info("Trying to set url to: ", url);
        response.status(200).json({
            status: "Success",
            message: "Speech generated successfully.",
            url: url,
        });
    } catch (error) {
        console.error("Error calling speech-function", error);
        response.status(500).json({
            status: "Error",
            message: "Error calling speech-function: ",
            error: (error as Error).message,
        });
        return;
    }
});
