import { client } from "@gradio/client";
import * as logger from "firebase-functions/logger";

/**
 * The API key for authenticating requests, expected to be set in the environment variables.
 * @throws {Error} Throws an error if the API key is not found in the environment variables.
 */
const HF_API_KEY: string = process.env.HF_API_KEY ?? (() => {
    throw new Error("Required environment variable HF_API_KEY is not set");
})();

/**
 * Parameters required to invoke the Gradio model.
 */
export type GradioParams = {
    model: string; // The model name or identifier.
    text: string; // Input text for the model.
    speed: number; // Speed parameter for the model.
    tune: number; // Tune parameter for the model.
    pitchMethod: string; // Pitch method to be used.
    indexRate: number; // Index rate parameter.
    protect: number; // Protect parameter.
};

/**
 * Represents a file response from the Gradio API.
 */
export type GradioFileResponse = {
    name: string; // The name of the file.
    data: null; // Data of the file, null in this context.
    is_file: boolean; // Indicates if the response is a file.
    orig_name: string; // The original name of the file.
};

/**
 * The response structure from the Gradio API call.
 */
export type GradioAPIResponse = {
    type: string; // Type of the response.
    time: string; // Timestamp of the response.
    data: [
        string, // Success message.
        GradioFileResponse, // First file response.
        GradioFileResponse // Second file response.
    ];
    endpoint: string; // API endpoint.
    fn_index: number; // Function index.
};

/**
 * Triggers a workflow in Gradio with the specified parameters.
 * @param {string} url The Gradio URL to invoke the model.
 * @param {GradioParams} params Parameters for the Gradio model.
 * @return {Promise<GradioAPIResponse>} The response from the Gradio API.
 * @throws {Error} Throws an error if the Gradio API call fails.
 */
export async function triggerGradioWorkflow(url: string, params: GradioParams): Promise<GradioAPIResponse> {
    const gradioUrl = url;
    const app = await client(gradioUrl, {
        hf_token: HF_API_KEY as `hf_${string}`,
    });

    try {
        const result = await app.predict(0, [
            params.model,
            params.text,
            params.speed,
            params.tune,
            params.pitchMethod,
            params.indexRate,
            params.protect,
        ]);

        logger.info("Gradio prediction result: ", result);

        return result as GradioAPIResponse;
    } catch (error) {
        logger.error("Error calling Gradio API: ", error);
        throw new Error("Failed to call Gradio API");
    }
}
