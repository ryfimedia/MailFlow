
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();
const storage = admin.storage();

/**
 * This function runs once a day to clean up old, unused images.
 * It checks for images in the 'campaign-images/' folder that are older
 * than 365 days and are not referenced in any campaign from the last year.
 */
export const cleanupUnusedImages = functions.pubsub
  .schedule("every 24 hours")
  .onRun(async (context) => {
    functions.logger.log("Starting unused image cleanup task.");

    const BUCKET_NAME = process.env.GCLOUD_PROJECT + ".appspot.com";
    const bucket = storage.bucket(BUCKET_NAME);

    // 1. Get all campaigns updated in the last 365 days.
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const campaignsSnapshot = await db
      .collection("campaigns")
      .where("updatedAt", ">", oneYearAgo)
      .get();

    // 2. Extract all image URLs from their email bodies into a Set for quick lookups.
    const usedImageUrls = new Set<string>();
    campaignsSnapshot.forEach((doc) => {
      const campaign = doc.data();
      const emailBody = campaign.emailBody || "";
      
      const srcRegex = /src="([^"]+)"/g;
      let match;
      while ((match = srcRegex.exec(emailBody)) !== null) {
        const url = match[1];
        // We only care about images hosted on our own Firebase Storage.
        if (url.includes("firebasestorage.googleapis.com")) {
          usedImageUrls.add(url);
        }
      }
    });

    functions.logger.log(`Found ${usedImageUrls.size} unique image URLs used in recent campaigns.`);

    // 3. Get all files from the storage bucket.
    const [files] = await bucket.getFiles({ prefix: "campaign-images/" });
    
    let deletedCount = 0;

    // 4. Iterate over files and delete old, unused ones.
    for (const file of files) {
      // Skip directories
      if (file.name.endsWith('/')) {
        continue;
      }

      const [metadata] = await file.getMetadata();
      const fileCreationTime = new Date(metadata.timeCreated);
      
      // Check if file is older than one year and not in the used set.
      if (fileCreationTime < oneYearAgo) {
        if (!usedImageUrls.has(file.publicUrl())) {
          try {
            await file.delete();
            functions.logger.log(`Deleted unused image: ${file.name}`);
            deletedCount++;
          } catch (error) {
            functions.logger.error(`Failed to delete ${file.name}:`, error);
          }
        }
      }
    }
    
    functions.logger.log(`Cleanup complete. Deleted ${deletedCount} unused images.`);
    return null;
  });
