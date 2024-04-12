import { processNewUser } from "./auth/processNewUser";
import { helloWorld } from "./utils/helloWorld";
import { generatePodcastAd } from "./adGeneration/generatePodcastAd";
import { leapHook } from "./webhooks/leapHook";
import { receiveGeneratedMusic } from "./webhooks/musicHook";
import { receiveGeneratedVO } from "./webhooks/voHook";
import { processNewJob } from "./adGeneration/firestoreTriggers/processNewJob";
import { initiateMerge } from "./adGeneration/firestoreTriggers/initiateMerge";

export {
    processNewUser,
    helloWorld,
    generatePodcastAd,
    leapHook,
    processNewJob,
    receiveGeneratedMusic,
    receiveGeneratedVO,
    initiateMerge,
};
