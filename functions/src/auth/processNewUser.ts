import { UserRecord } from "firebase-admin/auth";
import * as functions from "firebase-functions";
// import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

import { FieldValue } from "firebase-admin/firestore";

// const admin = require('..firebase/firebaseInit.js');
import { firebaseAdmin } from '../firebase/firebaseInit';

// admin.initializeApp();

export const processNewUser = functions.auth.user().onCreate((user: UserRecord) => {
    const email = user.email;
    const displayName = user.displayName;
    const uid = user.uid;

    const userDocRef = firebaseAdmin.firestore().collection("users").doc(uid);

    userDocRef.set({
        email,
        displayName,
        uid,
        registratedAt: FieldValue.serverTimestamp(),
    });

    logger.info("New user created:", uid, displayName, email, { structuredData: true });
});
