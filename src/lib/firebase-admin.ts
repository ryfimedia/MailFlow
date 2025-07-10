
import admin from 'firebase-admin';

// This guard prevents re-initializing the app on hot reloads.
if (!admin.apps.length) {
  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!serviceAccountBase64) {
    throw new Error('Firebase service account key is not set in environment variables.');
  }
  const serviceAccount = JSON.parse(
    Buffer.from(serviceAccountBase64, 'base64').toString('utf-8')
  );
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

export const adminDb = admin.firestore();
