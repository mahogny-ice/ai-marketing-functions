import OpenAI from "openai";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { v4 as uuidv4 } from "uuid";
import * as dotenv from "dotenv";
dotenv.config();

/**
 * The API key for authenticating requests, expected to be set in the environment variables.
 * @throws {Error} Throws an error if the API key is not found in the environment variables.
 */
const OPENAI_API_KEY: string = process.env.OPENAI_API_KEY ?? (() => {
    throw new Error("Required environment variable HF_API_KEY is not set");
})();

const openai = new OpenAI({
    apiKey: OPENAI_API_KEY });

export type Openai_Input = {
    voice: "alloy"|"echo"|"fable"|"onyx"|"nova"|"shimmer";
    input: string;
}

const bucket = admin.storage().bucket("ai-marketing-e2b7e.appspot.com");

/**
 * Generates speech from text using the OpenAI API, saves the audio to Firebase Cloud Storage,
 *  and returns the file's URL.
 *
 * This function takes an input object containing the `voice` and `input` text. It then calls the
 *  OpenAI API to generate
 * speech based on the specified voice model and input text.
 *  The generated audio is saved as an MP3 file in Firebase Cloud
 * Storage under a unique filename. The public URL to the stored audio file is then returned.
 *
 * @param {Openai_Input} openaiInput - An object containing the properties:
 *  - `voice`: A string specifying the voice model to use for text-to-speech conversion.
 *  Possible values include
 *    "alloy", "echo", "fable", "onyx", "nova", and "shimmer".
 *  - `input`: The text string to be converted into speech.
 * @return {Promise<string>} A promise that resolves to the URL of the uploaded audio file
 * in Firebase Cloud Storage.
 * @throws {Error} Throws an error if the OpenAI API key is not found in the environment
 * variables or if the speech
 * generation fails for any reason.
 *
 * @example
 * openaiTTS({ voice: "echo", input: "Hello, world!" })
 *   .then(url => console.log(`Audio URL: ${url}`))
 *   .catch(error => console.error("Speech generation failed:", error));
 */
export async function openaiTTS({ voice, input }: Openai_Input): Promise<string> {
    try {
        const response = await openai.audio.speech.create({
            model: "tts-1-hd",
            voice: voice,
            input: input,
        });

        const fileName = `ttsAudio/${uuidv4()}.mp3`;
        const file = bucket.file(fileName);

        const buffer = Buffer.from(await response.arrayBuffer());

        await file.save(buffer, {
            metadata: {
                contentType: "audio/mpeg",
            },
        });

        const [url] = await file.getSignedUrl({
            action: "read",
            expires: Date.now() + 2 * 60 * 60 * 1000,
        });

        return url;
    } catch (error) {
        logger.error("Failed to generate speech: ", error);
        throw new Error("OpenAI TTS generation failed");
    }
}
