import * as functions from "firebase-functions";
import * as logger from "firebase-functions/logger";
import { firebaseAdmin } from "../../firebase/firebaseInit";

const mergeAudioAPI = "https://merge-media-dx3v2rbg6q-od.a.run.app/mergeaudio";

interface MergeAudioResponse {
    url: string;
}

export const initiateMerge = functions.firestore
    .document("users/{userId}/generationJobs/{jobId}")
    .onUpdate(async (change) => {
        logger.info("Job updated, checking components...");

        // TODO: Add proper validation
        const updatedJobData = change.after.data();
        const jobRef = change.after.ref;

        logger.info(updatedJobData.status);

        if (updatedJobData.status === "running") {
            try {
                const { musicUrl, voUrl } = updatedJobData.components;

                if (musicUrl && voUrl) {
                    logger.info("Initializing merge...");

                    const config = (await firebaseAdmin.firestore().collection("mergeConfig").doc("config").get()).data();

                    if (!config) {
                        logger.error("Merge config not found. Make sure it exists under mergeConfig/config. Aborting job merge.");
                        return;
                    }

                    const body = {
                        jobId: updatedJobData.id,
                        track1: {
                            url: musicUrl,
                            volume: config.track1.volume,
                            offset: config.track1.offset,
                        },
                        track2: {
                            url: voUrl,
                            volume: config.track2.volume,
                            offset: config.track2.offset,
                        },
                    };

                    await fetch(mergeAudioAPI, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(body),
                    }).then(async (result) => {
                        logger.info("Successfully merged audio tracks");

                        const mergedAudioData: MergeAudioResponse = await result.json();
                        logger.info("mergedAudioData: ", mergedAudioData);
                        const outputUrl = mergedAudioData.url;

                        jobRef.update({ "output": outputUrl });
                        jobRef.update({ "status": "completed" });

                        // TODO: Add track id to users generated tracks

                        return;
                    }).catch((error) => {
                        jobRef.update({ "status": "failed" });
                        logger.error("Error while merging audio:", error);
                        return;
                    });
                } else {
                    logger.info("Waiting for more components before merging");
                    return;
                }
            } catch (error) {
                logger.error("Error while initiating merge:", error);
                return;
            }
        } else if (updatedJobData.status === "completed") {
            logger.warn("Job already completed");
            return;
        } else {
            logger.warn("Job status not running or completed");
            return;
        }
    });
