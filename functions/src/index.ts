import { processNewUser } from "./auth/processNewUser";
import { generatePodcastAd } from "./adGeneration/generatePodcastAd";
import { initiateMerge } from "./adGeneration/firestoreTriggers/initiateMerge";

export {
    processNewUser,
    generatePodcastAd,
    initiateMerge,
};
