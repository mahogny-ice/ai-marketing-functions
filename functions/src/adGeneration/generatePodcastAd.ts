import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { v4 as uuidv4 } from "uuid";
import { firebaseAdmin } from "../firebase/firebaseInit";
import { FieldValue } from "firebase-admin/firestore";

export type GenerationJob = {
    createdAt: FieldValue;
    userId: string;
    id: string;
    type: "podcastAd";
    status: "running" | "completed" | "failed" | "canceled";
    components: PodcastAdComponents;
    input: {
        music: MusicInput;
        vo: VoInput;
    }
    output: string;
    adtitle?: string;
}

export type PodcastAdComponents = {
    musicUrl: string;
    voUrl: string;
}

type MusicInput = {
    prompt: MusicPrompt;
    durationInSeconds: number;
    volume: number;
    offsetInMilliseconds: number;
}

type MusicPrompt = {
    genres: string;
    moods: string;
    themes: string;
    length: number;
}

type VoInput = {
    prompt: VoPrompt;
    durationInSeconds: number;
    volume: number;
    offsetInMilliseconds: number;
}

type VoPrompt = {
    voice: string;
    input: string;
}

export const generatePodcastAd = onRequest(async (request, response) => {
    let job: GenerationJob;

    try {
        job = {
            createdAt: FieldValue.serverTimestamp(),
            userId: request.body.userId,
            id: uuidv4(),
            status: "running",
            type: "podcastAd",
            components: {
                musicUrl: "",
                voUrl: "",
            },
            input: {
                music: {
                    prompt: {
                        genres: "",
                        moods: "",
                        themes: "",
                        length: 0,
                    },
                    durationInSeconds: 1,
                    volume: 1,
                    offsetInMilliseconds: 0,
                },
                vo: {
                    prompt: {
                        voice: "",
                        input: "",
                    },
                    durationInSeconds: 1,
                    volume: 1,
                    offsetInMilliseconds: 0,
                },
            },
            output: "",
            adtitle: request.body.adtitle || "",
        };
    } catch (error) {
        logger.error("Error generating podcast ad", error, { structuredData: true });
        response.status(500).send("Error: " + error);
        return;
    }

    try {
        const jobRef = firebaseAdmin.firestore().collection("users").doc(job.userId).collection("generationJobs").doc(job.id);

        await jobRef.set(job);

        // Start job status check interval
        checkJobStatus(jobRef);

        logger.info("Started new podcast ad generation job: " + job.id);
        response.status(200).json({ message: "Started new podcast ad generation job", jobId: job.id });
    } catch (error) {
        logger.error("Error starting new podcast ad generation job", error, { structuredData: true });
        response.status(500).send("Error setting jobRef" + error);
        return;
    }
});

const checkJobStatus = async (jobRef: FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>) => {
    try {
        let count = 0;

        const jobCheckInterval = setInterval(async () => {
            // Make 3 checks (30 seconds) before setting job status to failed
            count++;
            const jobData = (await jobRef.get()).data() as GenerationJob;

            if (count < 3) {
                if (jobData.status === "completed") {
                    // JOB IS COMPLETED
                    logger.info("Podcast ad generation job completed: " + jobData.id);
                    clearInterval(jobCheckInterval);
                    return;
                } else if (count >= 3) {
                    // Maximum retries reached, mark job as failed
                    await jobRef.update({ status: "failed" });
                    logger.error("Podcast ad generation job failed: " + jobData.id);
                    clearInterval(jobCheckInterval);
                    return;
                }
            } else {
                logger.info("Podcast ad generation job still running: " + jobData.id);
                return;
            }
        }, 10000);
    } catch (error) {
        console.error("Error checking job status", error);
    }
};
