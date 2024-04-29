import { processNewUser } from "./auth/processNewUser";
import { helloWorld } from "./utils/helloWorld";
import { generatePodcastAd } from "./adGeneration/generatePodcastAd";
import { leapHook } from "./webhooks/leapHook";
import { receiveGeneratedMusic } from "./webhooks/musicHook";
import { receiveGeneratedVO } from "./webhooks/voHook";
import { initiateMerge } from "./adGeneration/firestoreTriggers/initiateMerge";
import { generateSpeech } from "./apiCalls/generateSpeech";

export {
    processNewUser,
    helloWorld,
    generatePodcastAd,
    leapHook,
    receiveGeneratedMusic,
    receiveGeneratedVO,
    initiateMerge,
    generateSpeech,
};
