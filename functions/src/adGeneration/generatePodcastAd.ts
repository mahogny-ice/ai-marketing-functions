import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { v4 as uuidv4 } from "uuid";

import { firebaseAdmin } from "../firebase/firebaseInit";

export type GenerationJob = {
    id: string;
    type: "podcastAd";
    status: "running" | "completed" | "failed" | "canceled";
    components: PodcastAdComponents;
    input: {
        music: MusicInput;
        vo: VoInput;
    }
    output: string;
}

export type PodcastAdComponents = {
    musicUrl: string;
    voUrl: string;
}

type MusicInput = {
    prompt: string;
    durationInSeconds: number;
    volume: number;
    offsetInMilliseconds: number;
}

type VoInput = {
    prompt: string;
    durationInSeconds: number;
    volume: number;
    offsetInMilliseconds: number;
}

export const generatePodcastAd = onRequest(async (request, response) => {
    let job: GenerationJob;

    try {
        job = {
            id: uuidv4(),
            status: "running",
            type: "podcastAd",
            components: {
                musicUrl: "",
                voUrl: "",
            },
            input: {
                music: {
                    prompt: request.body.music.prompt,
                    durationInSeconds: request.body.music.durationInSeconds,
                    volume: request.body.music.volume,
                    offsetInMilliseconds: request.body.music.offsetInMilliseconds,
                },
                vo: {
                    prompt: request.body.vo.prompt,
                    durationInSeconds: request.body.vo.durationInSeconds,
                    volume: request.body.vo.volume,
                    offsetInMilliseconds: request.body.vo.offsetInMilliseconds,
                },
            },
            output: "",
        };
    } catch (error) {
        logger.error("Error generating podcast ad", { structuredData: true });
        logger.error(error, { structuredData: true });
        response.status(500).send("Error: " + error);
        return;
    }

    try {
        const jobRef = firebaseAdmin.firestore().collection("generationJobs").doc("running").collection("jobs").doc(job.id);

        jobRef.set(job);
        response.status(200).send("Started new podcast ad generation job: " + job);
    } catch (error) {
        logger.error("Error starting new podcast ad generation job", { structuredData: true });
        logger.error(error, { structuredData: true });
        response.status(500).send("Error: " + error);
        return;
    }
});
