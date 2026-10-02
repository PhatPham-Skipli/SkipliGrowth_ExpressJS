import fs from 'fs';
import path from 'path';
import { initializeApp, cert, applicationDefault, getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

import EnvVars from '@src/common/constants/env';

/**
 * Initialize Firebase Admin SDK
 * Priority:
 * 1. GOOGLE_APPLICATION_CREDENTIALS path if valid file
 * 2. Local config/serviceAccountKey.json if present
 * 3. Inline FIREBASE_PRIVATE_KEY & FIREBASE_CLIENT_EMAIL env vars
 * 4. Google Cloud Application Default Credentials (applicationDefault)
 */
function createFirebaseApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const projectId = EnvVars.FirebaseProjectId || 'skipli-growth-c2b56';

  // Check 1: Explicit path from env
  const envPath = EnvVars.GoogleApplicationCredentials
    ? path.resolve(process.cwd(), EnvVars.GoogleApplicationCredentials)
    : '';
  if (envPath && fs.existsSync(envPath)) {
    return initializeApp({
      credential: cert(envPath),
      projectId,
    });
  }

  // Check 2: Default server/config/serviceAccountKey.json
  const defaultLocalKeyPath = path.resolve(
    __dirname,
    '../../config/serviceAccountKey.json',
  );
  if (fs.existsSync(defaultLocalKeyPath)) {
    return initializeApp({
      credential: cert(defaultLocalKeyPath),
      projectId,
    });
  }

  // Check 3: Environment variables for private key & client email
  if (EnvVars.FirebasePrivateKey && EnvVars.FirebaseClientEmail) {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail: EnvVars.FirebaseClientEmail,
        privateKey: EnvVars.FirebasePrivateKey,
      }),
    });
  }

  // Check 4: Fallback to Application Default Credentials (e.g. gcloud CLI ADC)
  return initializeApp({
    credential: applicationDefault(),
    projectId,
  });
}

const firebaseApp = createFirebaseApp();

export const auth = getAuth(firebaseApp);

// Export Firestore database instance
export const db = getFirestore(firebaseApp);
db.settings({ ignoreUndefinedProperties: true });

export default firebaseApp;
