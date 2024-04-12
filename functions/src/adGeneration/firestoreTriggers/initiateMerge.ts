import * as functions from "firebase-functions";
import * as logger from "firebase-functions/logger";

const mergeAudioAPI = "https://merge-media-dx3v2rbg6q-od.a.run.app/mergeaudio";

interface MergeAudioResponse {
    // downloadUrl: string;
    url: string;
}

export const initiateMerge = functions.firestore
    .document("generationJobs/running/jobs/{jobId}")
    .onUpdate(async (change) => {
        logger.info("Job updated, checking components...");

        // TODO: Add proper validation
        const updatedJobData = change.after.data();
        const jobRef = change.after.ref;

        logger.info(updatedJobData.status);

        if (updatedJobData.status === "running") {
            try {
                const { musicUrl, voUrl } = updatedJobData.components;
                const input = updatedJobData.input;

                // TODO: Verify user and add file to user path in storage or some other smart idea
                // const storageFilename = `newMerges/${updatedJobData.id}.mp3`;

                if (musicUrl && voUrl) {
                    logger.info("Initializing merge...");

                    const body = {
                        jobId: updatedJobData.id,
                        track1: {
                            url: musicUrl,
                            volume: input.music.volume,
                            offset: input.music.offsetInMilliseconds,
                        },
                        track2: {
                            url: voUrl,
                            volume: input.vo.volume,
                            offset: input.vo.offsetInMilliseconds,
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
                        // const mergedAudioData: MergeAudioResponse = result.url;
                        logger.info("mergedAudioData: ", mergedAudioData);
                        // const outputUrl = mergedAudioData.downloadUrl;
                        const outputUrl = mergedAudioData.url;
                        // const outputUrl = result.url;

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
