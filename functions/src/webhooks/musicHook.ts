import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

import { firebaseAdmin } from "../firebase/firebaseInit";
import { DocumentReference } from "firebase-admin/firestore";

export const receiveGeneratedMusic = onRequest(async (request, response) => {
    const jobId = request.body.output.job_id as string;
    const url = request.body.output.url as string;

    // Validating input
    if (typeof jobId !== "string" || typeof url !== "string") {
        logger.error("Invalid input types");
        response.status(400).send("Invalid input types");
        return;
    }

    let jobRef: DocumentReference | null = null;

    try {
        const users = await firebaseAdmin.firestore().collection("users").listDocuments();

        for (const user of users) {
            const job = await user.collection("generationJobs").doc(jobId).get();
            if (jobId === job.id) {
                jobRef = user.collection("generationJobs").doc(jobId);
                logger.log("Job found");
            } else {
                logger.error("Can't find any matching job");
                jobRef = null;
            }
        }
    } catch (error) {
        jobRef = null;
    }

    if (!jobRef) {
        logger.error("Can't find any matching job. Terminating musicHook");
        return;
    }

    try {
        const jobSnapshot = await jobRef?.get();

        if (!jobSnapshot?.exists) {
            logger.error("Can't find any matching job");
            response.status(400).send("Can't find any matching job");
            return;
        } else {
            await jobRef?.update({
                "components.musicUrl": url,
            }).then(() => {
                logger.log("Music url updated successfully");
                response.status(200).send("Music url updated successfully");
                return;
            }).catch((error) => {
                logger.log("Couldn't update music url. Error:", error);
                response.status(500).send("Couldn't update music url");
                jobRef?.update({ "status": "failed" });
                return;
            });
        }
    } catch (error) {
        logger.error("Couldn't get music. Error:", error);
        response.status(500).send("Couldn't get music");
        jobRef?.update({ "status": "failed" });
        return;
    }
});
