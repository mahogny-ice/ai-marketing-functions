import { processNewUser } from "./auth/processNewUser";
import { generatePodcastAd } from "./adGeneration/generatePodcastAd";
import { initiateMerge } from "./adGeneration/firestoreTriggers/initiateMerge";
import { updateJobComponents } from "./adGeneration/updateComponents";

export {
    processNewUser,
    generatePodcastAd,
    initiateMerge,
    updateJobComponents,
};
