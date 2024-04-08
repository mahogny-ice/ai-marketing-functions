import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { Leap } from "@leap-ai/workflows";

const LEAP_API_KEY = process.env.LEAP_API_KEY as string;

export const triggerLeapWorkflow = onRequest(async (request, response) => {
    const leap = new Leap({
        apiKey: LEAP_API_KEY,
    });

    try {
        const body = request.body;
        logger.info("Received body: ", body, { structuredData: true });

        const leapResponse = await leap.workflowRuns.workflow({
            workflow_id: "wkf_FZIrfeC0AGcbTf",
            input: body.input
        });

        response.json(leapResponse.data);

    } catch (error) {
        logger.error("Error calling Leap API: ", error);
        response.status(500).send(error);
    }
});