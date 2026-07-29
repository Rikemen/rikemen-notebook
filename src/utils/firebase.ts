import { getApps, initializeApp } from "firebase/app";

import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";

import { firebaseConfig } from "@/config/project";

const firebaseApp = getApps()[0] ?? initializeApp(firebaseConfig);

export const db = getFirestore(firebaseApp);
export const auth = getAuth(firebaseApp);
export const functions = getFunctions(firebaseApp, "asia-northeast1");

interface EmulatorGlobalState {
  gaussFirebaseEmulatorsConnected?: boolean;
}

const emulatorState = globalThis as typeof globalThis & EmulatorGlobalState;
if (
  import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true" &&
  !emulatorState.gaussFirebaseEmulatorsConnected
) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", {
    disableWarnings: true,
  });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
  emulatorState.gaussFirebaseEmulatorsConnected = true;
}
