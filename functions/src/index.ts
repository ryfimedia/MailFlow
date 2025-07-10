
import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger, setGlobalOptions } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { Resend } from "resend";

// Set the region for all functions in this file.
setGlobalOptions({ region: "us-central1" });

// Type definitions for Firestore documents.
// These are simplified versions of the types in the main app (src/lib/types.ts)
// as the functions directory is a separate Node project.
type DripCampaignEmail = {
  subject: string;
  body: string;
  delayDays: number;
};

type DripCampaign = {
  id: string;
  name: string;
  contactListId: string;
  status: 'Active' | 'Paused' | 'Draft';
  emails: DripCampaignEmail[];
  createdAt: string;
  updatedAt: string;
};

type Contact = {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    status: 'Subscribed' | 'Unsubscribed' | 'Bounced';
    subscribedAt: string; // ISO string
};


admin.initializeApp();

const db = admin.firestore();
const storage = admin.storage();

/**
 * This function runs once a day to clean up old, unused images.
 * It checks for images in the 'campaign-images/' folder that are older
 * than 365 days and are not referenced in any campaign from the last year.
 */
export const cleanupUnusedImages = onSchedule("every 24 hours", async (event) => {
    logger.log("Starting unused image cleanup task.");

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

    logger.log(`Found ${usedImageUrls.size} unique image URLs used in recent campaigns.`);

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
            logger.log(`Deleted unused image: ${file.name}`);
            deletedCount++;
          } catch (error) {
            logger.error(`Failed to delete ${file.name}:`, error as any);
          }
        }
      }
    }
    
    logger.log(`Cleanup complete. Deleted ${deletedCount} unused images.`);
    return null;
  });

/**
 * This function runs once a day to process active drip campaigns.
 * It checks each subscribed contact against each campaign's email sequence
 * and sends the appropriate email based on the number of days since they subscribed.
 */
export const processDripCampaigns = onSchedule("every 24 hours", async (event) => {
    logger.log("Starting drip campaign processing task.");

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
        logger.error("Resend API key is not set in environment variables. Aborting drip campaign processing.");
        return null;
    }
    const resend = new Resend(resendApiKey);

    const settingsDoc = await db.collection("meta").doc("settings").get();
    const settings = settingsDoc.data() || {};
    
    const fromName = settings.defaults?.fromName || "Your Company";
    const fromEmail = settings.defaults?.fromEmail || "noreply@yourdomain.com";
    const companyName = settings.profile?.companyName || "Your Company Name";
    const companyAddress = settings.profile?.address || "Your Physical Address";

    const activeDripCampaigns = await db
      .collection("dripCampaigns")
      .where("status", "==", "Active")
      .get();

    if (activeDripCampaigns.empty) {
      logger.log("No active drip campaigns found.");
      return null;
    }

    for (const campaignDoc of activeDripCampaigns.docs) {
      const campaign = campaignDoc.data() as DripCampaign;
      const campaignName = campaign.name;
      const listId = campaign.contactListId;
      const emails = campaign.emails || [];

      if (!listId || emails.length === 0) {
        logger.warn(`Campaign "${campaignName}" (ID: ${campaignDoc.id}) is invalid or has no emails, skipping.`);
        continue;
      }
      
      logger.log(`Processing campaign: "${campaignName}" for list ID: ${listId}`);

      const contactsSnapshot = await db
        .collection("contacts")
        .where("listIds", "array-contains", listId)
        .where("status", "==", "Subscribed")
        .get();

      if (contactsSnapshot.empty) {
        logger.log(`No subscribed contacts found for list ${listId} in campaign "${campaignName}".`);
        continue;
      }

      for (const contactDoc of contactsSnapshot.docs) {
        const contact = { ...contactDoc.data(), id: contactDoc.id } as Contact;
        
        try {
          const subscribedDate = new Date(contact.subscribedAt);
          subscribedDate.setUTCHours(0, 0, 0, 0);
          
          const today = new Date();
          today.setUTCHours(0, 0, 0, 0);
          
          const timeDiff = today.getTime() - subscribedDate.getTime();
          const daysSinceSubscription = Math.round(timeDiff / (1000 * 60 * 60 * 24));

          const emailToSend = emails.find((e) => e.delayDays === daysSinceSubscription);

          if (emailToSend) {
            logger.log(`Matched day ${daysSinceSubscription} for ${contact.email} in campaign "${campaignName}". Preparing to send.`);
            
            let personalizedBody = emailToSend.body
              .replace(/\[FirstName\]/g, contact.firstName || '')
              .replace(/\[LastName\]/g, contact.lastName || '')
              .replace(/\[Email\]/g, contact.email || '');

            const listUnsubscribeUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/unsubscribe?contactId=${contact.id}&listId=${listId}`;
            const allUnsubscribeUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/unsubscribe?contactId=${contact.id}&all=true`;
                
            const footer = `
                <div style="text-align: center; font-family: sans-serif; font-size: 12px; color: #888888; padding: 20px 0; margin-top: 20px; border-top: 1px solid #eaeaea;">
                    <p style="margin: 0 0 5px 0;">Copyright © ${new Date().getFullYear()} ${companyName}, All rights reserved.</p>
                    <p style="margin: 0 0 10px 0;">Our mailing address is: ${companyAddress}</p>
                    <p style="margin: 0;">
                        <a href="${listUnsubscribeUrl}" style="color: #888888; text-decoration: underline;">Unsubscribe from this list</a>
                        <span style="padding: 0 5px;">|</span>
                        <a href="${allUnsubscribeUrl}" style="color: #888888; text-decoration: underline;">Unsubscribe from all mailings</a>
                    </p>
                </div>
            `;
            
            const fullHtml = personalizedBody + footer;

            await resend.emails.send({
              from: `${fromName} <${fromEmail}>`,
              to: [contact.email],
              subject: emailToSend.subject,
              html: fullHtml,
            });
            logger.log(`Successfully sent email to ${contact.email} for campaign "${campaignName}".`);
          }
        } catch (error) {
          logger.error(`Error processing contact ${contact.email} for campaign "${campaignName}"`, error as any);
        }
      }
    }
    
    logger.log("Drip campaign processing finished.");
    return null;
  });
