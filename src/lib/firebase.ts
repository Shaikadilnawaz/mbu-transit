import { getApps, getApp, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, initializeFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const isConfigured = Object.values(firebaseConfig).every(Boolean);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isConfigured) {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  // Auto-detect long-polling: many campus/proxy networks block Firestore's
  // default streaming transport, causing "client is offline" errors. This lets
  // Firestore fall back to a compatible connection automatically.
  try {
    db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
  } catch {
    // Already initialized (e.g. hot reload) — reuse the existing instance.
    db = getFirestore(app);
  }
} else if (typeof window !== 'undefined') {
  console.warn(
    'Firebase is not configured: missing NEXT_PUBLIC_FIREBASE_* env vars. ' +
      'Auth and Firestore features are disabled until .env.local is set up (see .env.local.example).'
  );
}

export { app, auth, db };
