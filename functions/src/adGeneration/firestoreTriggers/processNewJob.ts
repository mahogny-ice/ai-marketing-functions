import * as functions from "firebase-functions";
import * as logger from "firebase-functions/logger";
import { triggerLeapWorkflow } from "../../apiCalls/callLeap";

export const processNewJob = functions.firestore
    .document("generationJobs/running/jobs/{jobId}")
    .onCreate(async (snapshot, context) => {
        const newJobData = snapshot.data();
        const jobId = context.params.jobId;

        if (newJobData.type === "podcastAd") {
            logger.info("Trying to generate music with Leap");

            try {
                const { prompt, durationInSeconds } = newJobData.input.music;
                const input = {
                    prompt: prompt,
                    duration_in_seconds: durationInSeconds,
                    webhook: "https://receiveGeneratedMusic-dx3v2rbg6q-uc.a.run.app",
                    job_id: jobId,
                    workflow_id: "wkf_kDiB0Z6F5eiH5y",
                };

                // Simulating music API call
                // setTimeout(async () => {
                //     const body = {
                //         otherData: {
                //             random: '1234'
                //         },
                //         output: {
                //             job_id: jobId,
                //             url: "https://firebasestorage.googleapis.com/v0/b/ai-marketing-e2b7e.appspot.com/o/TEST%2Ftrack1_lowVolume.mp3?alt=media&token=04fe9e08-c3be-498f-83b9-942b4b69ebb5"
                //         }
                //     }
                //     await fetch("http://127.0.0.1:5001/ai-marketing-e2b7e/us-central1/receiveGeneratedMusic", {
                //         method: "POST",
                //         headers: {
                //             "Content-Type": "application/json",
                //         },
                //         body: JSON.stringify(body),
                //     });
                // }, 4000)

                await triggerLeapWorkflow(input)
                    .then(() => {
                        logger.info("Successfully started leap music workflow");
                        return;
                    })
                    .catch((error) => {
                        logger.error("Error while starting leap music workflow", error);
                        return;
                    });
            } catch (error) {
                logger.error("Failed to start music generation with error: ");
                logger.error(error);
                return;
            }

            try {
                logger.info("Trying to generate VO with Leap");

                const { prompt, durationInSeconds } = newJobData.input.vo;
                const input = {
                    prompt: prompt,
                    duration_in_seconds: durationInSeconds,
                    webhook: "https://receiveGeneratedVO-dx3v2rbg6q-uc.a.run.app",
                    job_id: jobId,
                    workflow_id: "wkf_k5ko9EEpCxZSYi",
                };

                // Simulating VO API call
                // setTimeout(async () => {
                //     const body = {
                //         otherData: {
                //             random: '5678'
                //         },
                //         output: {
                //             job_id: jobId,
                //             url: "https://firebasestorage.googleapis.com/v0/b/ai-marketing-e2b7e.appspot.com/o/TEST%2Ftrack2.m4a?alt=media&token=0a8f300b-81fb-404c-a135-0e9c1e8e728e"
                //         }
                //     }
                //     await fetch("http://127.0.0.1:5001/ai-marketing-e2b7e/us-central1/receiveGeneratedVO", {
                //         method: "POST",
                //         headers: {
                //             "Content-Type": "application/json",
                //         },
                //         body: JSON.stringify(body),
                //     });
                // }, 3000)

                await triggerLeapWorkflow(input)
                    .then(() => {
                        logger.info("Successfully started leap VO workflow");
                        return;
                    })
                    .catch((error) => {
                        logger.error("Error while starting leap VO workflow", error);
                        return;
                    });
            } catch (error) {
                logger.error("Failed to start VO generation with error: ");
                logger.error(error);
                return;
            }
        } else {
            logger.info("Not a podcastAd!");
            return;
        }

        logger.info("New job created!");
        logger.info("jobData: " + newJobData);
        logger.info("jobId: " + jobId);
        return;
    });
