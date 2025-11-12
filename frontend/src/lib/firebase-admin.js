import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const rawPrivateKey = process.env.AUTH_FIREBASE_PRIVATE_KEY;
if (!rawPrivateKey) {
  console.warn(
    "AUTH_FIREBASE_PRIVATE_KEY is not set. Firebase admin will not be initialized."
  );
}

const serviceAccount = {
  projectId: process.env.AUTH_FIREBASE_PROJECT_ID,
  clientEmail: process.env.AUTH_FIREBASE_CLIENT_EMAIL,
  privateKey: rawPrivateKey ? rawPrivateKey.replace(/\\n/g, "\n") : undefined,
};

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

export const db = getFirestore();
