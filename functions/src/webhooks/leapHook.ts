import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

import { firebaseAdmin } from '../firebase/firebaseInit';

// const collectionRef = admin.firestore().collection("webhooks").doc("leap").collection("responses");

// interface LeapWebHookResponse {
//     id: string;
//     version_id: string;
//     status: "completed" | "running" | "failed";
//     created_at: string;
//     started_at: string | null;
//     ended_at: string | null;
//     workflow_id: string;
//     error: string | null;
//     input: {
//         music_prompt: string;
//         duration_in_seconds: number;
//     };
//     output: {
//         generated_music: string;
//     };
// }

export const leapHook = onRequest(async (request, response) => {
    logger.info("Leap Webhook received!", { structuredData: true });

    try {
        const collectionRef = firebaseAdmin.firestore().collection("webhooks").doc("leap").collection("responses");

        const leapInput = request.body;

        logger.info("Leap input: ", { structuredData: true });
        logger.info(leapInput, { structuredData: true });

        collectionRef.doc(leapInput.id).set(leapInput);

    } catch (error) {
        logger.error("Error processing Leap Webhook", { structuredData: true });
        logger.error(error, { structuredData: true });
    }

    response.status(200).send("Leap Webhook received!");
});
