
import admin from 'firebase-admin';

// This guard prevents re-initializing the app on hot reloads.
if (!admin.apps.length) {
  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!serviceAccountBase64) {
    throw new Error('Firebase service account key is not set. In Firebase Studio, please ensure you have connected a Firebase project and that the service account secrets are correctly configured in the environment settings.');
  }

  try {
    const serviceAccountString = Buffer.from(serviceAccountBase64, 'base64').toString('utf-8');
    const serviceAccount = JSON.parse(serviceAccountString);
    
    // Determine the storage bucket from environment or service account
    const storageBucket = process.env.GCLOUD_PROJECT ? `${process.env.GCLOUD_PROJECT}.appspot.com` : serviceAccount.project_id ? `${serviceAccount.project_id}.appspot.com` : undefined;

    if (!storageBucket) {
        throw new Error("Could not determine the storage bucket. Ensure GCLOUD_PROJECT env var is set or the service account has a project_id.");
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: storageBucket
    });
  } catch (error: any) {
    // Add more context to the error message for easier debugging.
    throw new Error(`Failed to initialize Firebase Admin SDK. Please check if your FIREBASE_SERVICE_ACCOUNT_BASE64 secret is a valid JSON. Error: ${error.message}`);
  }
}

export const adminDb = admin.firestore();
export const adminStorage = admin.storage();
