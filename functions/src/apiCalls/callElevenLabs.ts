import * as admin from "firebase-admin";
import { v4 as uuidv4 } from "uuid";
import * as dotenv from "dotenv";
import { ElevenLabsClient } from "elevenlabs";
import * as logger from "firebase-functions/logger";
import * as stream from "stream";

dotenv.config();

/**
 * The API key for authenticating requests, expected to be set in the environment variables.
 * @throws {Error} Throws an error if the API key is not found in the environment variables.
 */
const ELEVENLABS_API_KEY: string = process.env.ELEVENLABS_API_KEY ?? (() => {
    throw new Error("Required environment variable ELEVENLABS_API_KEY is not set");
})();

const client = new ElevenLabsClient({
    apiKey: ELEVENLABS_API_KEY,
});

/**
 * Fetches all available voices from the ElevenLabs API and logs them to the console.
 * @return {Promise<void>} A promise that resolves when the voices have been logged.
 */
async function getVoices() {
    const voices = await client.voices.getAll();
    console.log("voices:", voices);
}

getVoices();

const bucket = admin.storage().bucket("ai-marketing-e2b7e.appspot.com");

/**
 * Generates speech from text using the ElevenLabs API, saves the audio to Firebase Cloud Storage,
 * and returns the file's URL.
 *
 * @param {string} text - The text string to be converted into speech.
 * @param {string} voice - The voice of the api.
 * @param {string} model - The model of the api.

 * @return {Promise<string>} A promise that resolves to the URL of the uploaded audio file
 * in Firebase Cloud Storage.
 * @throws {Error} Throws an error if the speech generation fails for any reason.
 */

export const elevenlabsTTS = (voice: string, text: string, model: string,): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
        client.generate({
            voice: voice,
            text,
            model_id: model,
        })
            .then((audio) => {
                const fileName = `ttsAudio/${uuidv4()}.mp3`;
                const file = bucket.file(fileName);
                const passthroughStream = new stream.PassThrough();

                audio.pipe(passthroughStream);

                const writeStream = file.createWriteStream({
                    metadata: {
                        contentType: "audio/mpeg",
                    },
                });

                passthroughStream.pipe(writeStream);

                writeStream.on("finish", async () => {
                    try {
                        const [url] = await file.getSignedUrl({
                            version: "v4",
                            action: "read",
                            expires: Date.now() + 2 * 60 * 60 * 1000, // Expires in 2 hours
                        });
                        logger.info("setting url to:", url);
                        resolve(url);
                    } catch (error) {
                        logger.error("Error generating signed URL:", error);
                        reject(error);
                    }
                });

                writeStream.on("error", (error) => {
                    logger.error("Error saving audio to Firebase Storage:", error);
                    reject(error);
                });

                audio.on("error", (error) => {
                    logger.error("Error generating audio:", error);
                    reject(error);
                });
            })
            .catch((error) => {
                logger.error("Failed to generate speech:", error);
                reject(new Error("ElevenLabs TTS generation failed"));
            });
    });
};
