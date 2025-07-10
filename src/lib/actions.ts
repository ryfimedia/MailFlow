
'use server';

import { z } from 'zod';
import { Resend } from 'resend';
import type { Campaign, Contact, ContactList, Settings, Template, MediaImage, DripCampaign, OptInForm } from './types';
import admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { defaultTemplates } from './default-templates';
import { headers } from 'next/headers';
import { auth as adminAuth } from 'firebase-admin';

// This guard prevents re-initializing the app on hot reloads.
if (!admin.apps.length) {
  // When deployed to App Hosting, the service account is automatically available.
  // For local development, we'll use a simplified initialization if the secret isn't set.
  if (process.env.NODE_ENV === 'production') {
    const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    if (!serviceAccountBase64) {
      throw new Error('Firebase service account key is not set for production. In Firebase Studio, please ensure you have connected a Firebase project and that the service account secrets are correctly configured in the environment settings.');
    }

    try {
      const serviceAccountString = Buffer.from(serviceAccountBase64, 'base64').toString('utf-8');
      const serviceAccount = JSON.parse(serviceAccountString);
      
      const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || (process.env.GCLOUD_PROJECT ? `${process.env.GCLOUD_PROJECT}.appspot.com` : undefined);
      if (!storageBucket) {
        throw new Error("Could not determine the storage bucket. Ensure NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET or GCLOUD_PROJECT env var is set.");
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: storageBucket
      });
    } catch (error: any) {
      throw new Error(`Failed to initialize Firebase Admin SDK. Please check if your FIREBASE_SERVICE_ACCOUNT_BASE64 secret is a valid JSON. Error: ${error.message}`);
    }
  } else {
    // Local development initialization
     admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
     });
  }
}

async function getUserIdFromSession() {
    const authorization = headers().get('Authorization');
    if (authorization?.startsWith('Bearer ')) {
        const idToken = authorization.split('Bearer ')[1];
        try {
            const decodedToken = await adminAuth().verifyIdToken(idToken);
            return decodedToken.uid;
        } catch (error) {
            console.error('Error verifying auth token:', error);
            return null;
        }
    }
    return null;
}

async function getDb() {
    const userId = await getUserIdFromSession();
    if (!userId) {
        throw new Error('User not authenticated');
    }
    return admin.firestore().collection('users').doc(userId);
}


function getBucket() {
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!bucketName) {
        throw new Error('Firebase Storage bucket name is not configured. Check your NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET env var.');
    }
    return admin.storage().bucket(bucketName);
}

function docWithIdAndTimestamps(doc: admin.firestore.DocumentSnapshot) {
    if (!doc.exists) return null;
    const data = doc.data() as any;
    const docObject: { [key: string]: any } = { id: doc.id };

    for (const key in data) {
        const value = data[key];
        if (value && typeof value.toDate === 'function') {
            docObject[key] = value.toDate().toISOString();
        } else {
            docObject[key] = value;
        }
    }
    return docObject;
}

// ==== USERS ====
export async function createUserDocument(uid: string, email: string, displayName: string) {
    const userRef = admin.firestore().collection('users').doc(uid);
    await userRef.set({
        email,
        displayName,
        createdAt: FieldValue.serverTimestamp(),
    });
}


// ==== CAMPAIGNS ====

export async function getCampaigns(): Promise<Campaign[]> {
    const userDb = await getDb();
    const campaignsCollection = userDb.collection('campaigns');
    const settingsRef = userDb.collection('meta').doc('settings');

    const [campaignsSnapshot, settingsDoc] = await Promise.all([
        campaignsCollection.orderBy('createdAt', 'desc').get(),
        settingsRef.get()
    ]);
    
    const settings = settingsDoc.data() || {};

    if (!settings.draftCampaignSeeded) {
        const welcomeTemplate = defaultTemplates.find(t => t.name === 'Welcome Email');
        
        if (welcomeTemplate) {
             const batch = admin.firestore().batch();
             const newCampaignRef = campaignsCollection.doc();
             
             batch.set(newCampaignRef, {
                name: 'Welcome Your New Subscribers',
                subject: 'A Warm Welcome From Our Team! 👋',
                status: 'Draft',
                emailBody: welcomeTemplate.content,
                openRate: '-',
                clickRate: '-',
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
             });
             
             batch.set(settingsRef, { draftCampaignSeeded: true }, { merge: true });
             
             await batch.commit();

             const newCampaignsSnapshot = await campaignsCollection.orderBy('createdAt', 'desc').get();
             return newCampaignsSnapshot.docs.map(doc => docWithIdAndTimestamps(doc) as Campaign);
        }
    }

    return campaignsSnapshot.docs.map(doc => docWithIdAndTimestamps(doc) as Campaign);
}

export async function getCampaignById(id: string): Promise<Campaign | null> {
    const userDb = await getDb();
    const doc = await userDb.collection('campaigns').doc(id).get();
    return docWithIdAndTimestamps(doc) as Campaign | null;
}

export async function saveCampaign(data: Partial<Campaign> & { id: string | null }) {
    const userDb = await getDb();
    const { id, tags, ...campaignData } = data;
    
    if (campaignData.status === 'Draft') {
        if (id) {
            await userDb.collection('campaigns').doc(id).set({ ...campaignData, tags: tags || [], updatedAt: FieldValue.serverTimestamp() }, { merge: true });
            return { id };
        } else {
            const newDocRef = await userDb.collection('campaigns').add({ ...campaignData, tags: tags || [], createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
            return { id: newDocRef.id };
        }
    }

    const settings = await getSettings();
    const isSetupComplete = !!(
      settings.defaults?.fromEmail &&
      settings.defaults?.fromName &&
      settings.profile?.companyName &&
      settings.profile?.address
    );
    if (!isSetupComplete) {
      return { error: 'Your account setup is incomplete. Please configure your profile and sending email settings before sending.' };
    }
    
    if (!process.env.RESEND_API_KEY) {
        return { error: 'Resend API key is not configured in environment variables.' };
    }
    const resend = new Resend(process.env.RESEND_API_KEY);

    const allContactsInList = await getContactsByListId(campaignData.recipientListId!);
    const contacts = (tags && tags.length > 0)
        ? allContactsInList.filter(c => c.tags && tags.every(tag => c.tags!.includes(tag)))
        : allContactsInList;

    if (contacts.length === 0) {
        const errorMsg = (tags && tags.length > 0)
        ? 'No recipients in the selected list match the specified tags. Campaign saved as draft.'
        : 'No recipients in the selected list. Campaign saved as draft.';
        return { error: errorMsg };
    }

    const companyName = settings.profile?.companyName || 'Your Company Name';
    const companyAddress = settings.profile?.address || 'Your Physical Address';
    
    const recipients = contacts.map(c => c.email);

    const fromName = settings.defaults?.fromName || 'Your Name';
    const fromEmail = settings.defaults?.fromEmail || 'default@yourdomain.com';

    let sendError = null;

    // Resend has a limit of 50 recipients per API call in the 'to' field.
    // We'll batch our sends to respect this limit.
    const BATCH_SIZE = 50;
    for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
        const batchContacts = contacts.slice(i, i + BATCH_SIZE);
        
        try {
            await Promise.all(batchContacts.map(contact => {
                const listUnsubscribeUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/unsubscribe?contactId=${contact.id}&listId=${campaignData.recipientListId}`;
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

                const personalizedBody = (campaignData.emailBody || '')
                  .replace(/\[FirstName\]/g, contact.firstName || '')
                  .replace(/\[LastName\]/g, contact.lastName || '')
                  .replace(/\[Email\]/g, contact.email || '');

                const fullHtml = personalizedBody + footer;

                return resend.emails.send({
                    from: `${fromName} <${fromEmail}>`,
                    to: [contact.email],
                    subject: campaignData.subject || 'No Subject',
                    html: fullHtml,
                });
            }));
        } catch (error: any) {
            console.error('Resend API error:', error);
            sendError = `Could not send campaign: ${error.message}.`;
            break; // Stop sending if one batch fails
        }
    }


    if (sendError) {
        return { error: sendError };
    }

    campaignData.sentDate = new Date().toISOString();
    campaignData.recipients = recipients.length;
    campaignData.successfulDeliveries = recipients.length; // Assuming all sent if no error
    campaignData.openRate = '0.0%';
    campaignData.clickRate = '0.0%';
    campaignData.bounces = 0;
    campaignData.unsubscribes = 0;
    campaignData.status = 'Sent';

    let successMessage = `Campaign sent to ${recipients.length} recipients.`;

    if (id) {
        await userDb.collection('campaigns').doc(id).set({ ...campaignData, tags: tags || [], updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        return { id, success: successMessage };
    } else {
        const newDocRef = await userDb.collection('campaigns').add({ ...campaignData, tags: tags || [], createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
        return { id: newDocRef.id, success: successMessage };
    }
}

export async function duplicateCampaign(campaignId: string): Promise<Campaign | null> {
    const userDb = await getDb();
    const originalCampaign = await getCampaignById(campaignId);
    if (!originalCampaign) return null;

    const { id: originalId, status, sentDate, ...newCampaignData } = originalCampaign;

    const newCampaign: Partial<Campaign> = {
        ...newCampaignData,
        name: `Copy of ${originalCampaign.name}`,
        status: 'Draft',
        openRate: '-',
        clickRate: '-',
    };

    delete newCampaign.recipients;
    delete newCampaign.successfulDeliveries;
    delete newCampaign.bounces;
    delete newCampaign.unsubscribes;
    delete newCampaign.scheduledAt;

    const newDocRef = await userDb.collection('campaigns').add({
        ...newCampaign,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
    });
    return { ...newCampaign, id: newDocRef.id } as Campaign;
}

export async function deleteCampaign(id: string) {
    const userDb = await getDb();
    await userDb.collection('campaigns').doc(id).delete();
}

// ==== DRIP CAMPAIGNS ====

export async function getDripCampaigns(): Promise<DripCampaign[]> {
    const userDb = await getDb();
    const snapshot = await userDb.collection('dripCampaigns').orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => docWithIdAndTimestamps(doc) as DripCampaign);
}

export async function getDripCampaignById(id: string): Promise<DripCampaign | null> {
    const userDb = await getDb();
    const doc = await userDb.collection('dripCampaigns').doc(id).get();
    return docWithIdAndTimestamps(doc) as DripCampaign | null;
}

export async function saveDripCampaign(data: Partial<DripCampaign> & { id?: string | null }) {
    const userDb = await getDb();
    const { id, ...dripData } = data;
    
    if (id) {
        await userDb.collection('dripCampaigns').doc(id).set({
            ...dripData,
            updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });
        return { id };
    } else {
        const newDocRef = await userDb.collection('dripCampaigns').add({
            ...dripData,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
        });
        return { id: newDocRef.id };
    }
}

export async function deleteDripCampaign(id: string) {
    const userDb = await getDb();
    await userDb.collection('dripCampaigns').doc(id).delete();
}


// ==== TEMPLATES ====

export async function getTemplates(): Promise<Template[]> {
    const userDb = await getDb();
    const templatesCollection = userDb.collection('templates');
    const settingsRef = userDb.collection('meta').doc('settings');

    const [snapshot, settingsDoc] = await Promise.all([
        templatesCollection.orderBy('createdAt', 'desc').get(),
        settingsRef.get()
    ]);
    
    const settings = settingsDoc.data() || {};

    if (!settings.templatesSeeded) {
        const batch = admin.firestore().batch();
        
        defaultTemplates.forEach(template => {
            const docRef = templatesCollection.doc();
            batch.set(docRef, { ...template, createdAt: FieldValue.serverTimestamp() });
        });
        
        batch.set(settingsRef, { templatesSeeded: true }, { merge: true });
        
        await batch.commit();

        const newSnapshot = await templatesCollection.orderBy('createdAt', 'desc').get();
        return newSnapshot.docs.map(doc => docWithIdAndTimestamps(doc) as Template);
    }
    
    return snapshot.docs.map(doc => docWithIdAndTimestamps(doc) as Template);
}

export async function saveTemplate(data: Omit<Template, 'id' | 'createdAt'> & { id?: string }) {
    const userDb = await getDb();
    const { id, ...templateData } = data;
    if (id) {
        await userDb.collection('templates').doc(id).update(templateData);
        return { id };
    } else {
        const newDocRef = await userDb.collection('templates').add({
            ...templateData,
            createdAt: FieldValue.serverTimestamp()
        });
        return { id: newDocRef.id };
    }
}

export async function deleteTemplate(id: string) {
    const userDb = await getDb();
    await userDb.collection('templates').doc(id).delete();
}

// ==== OPT-IN FORMS ====

export async function getOptInForms(): Promise<OptInForm[]> {
    const userDb = await getDb();
    const snapshot = await userDb.collection('optInForms').orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => docWithIdAndTimestamps(doc) as OptInForm);
}

export async function getOptInFormById(id: string): Promise<OptInForm | null> {
    // Note: This action might be called by unauthenticated users from the public form page.
    // It queries across all users' forms and finds the one with the matching ID.
    const formsQuerySnapshot = await admin.firestore().collectionGroup('optInForms').get();
    const formDoc = formsQuerySnapshot.docs.find(doc => doc.id === id);

    if (!formDoc) return null;
    
    const form = docWithIdAndTimestamps(formDoc) as OptInForm;
    // We need to get the owner to find the contact list
    const userId = formDoc.ref.parent.parent!.id;
    form.userId = userId;

    return form;
}

export async function saveOptInForm(data: Partial<OptInForm> & { id?: string | null }) {
    const userDb = await getDb();
    const { id, ...formData } = data;
    if (id) {
        await userDb.collection('optInForms').doc(id).set({
            ...formData,
            updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });
        return { id };
    } else {
        const newDocRef = await userDb.collection('optInForms').add({
            ...formData,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
        });
        return { id: newDocRef.id };
    }
}

export async function deleteOptInForm(id: string) {
    const userDb = await getDb();
    await userDb.collection('optInForms').doc(id).delete();
}

export async function addContactFromForm(data: { userId: string, formId: string, email: string, firstName?: string, lastName?: string, phone?: string, company?: string }) {
    const { userId, formId, ...contactData } = data;
    const userDb = admin.firestore().collection('users').doc(userId);
    
    const formDoc = await userDb.collection('optInForms').doc(formId).get();
    if (!formDoc.exists) {
        return { error: 'Form not found.' };
    }
    const form = formDoc.data() as OptInForm;

    const email = contactData.email.trim().toLowerCase();
    const existingContactQuery = await userDb.collection('contacts').where('email', '==', email).limit(1).get();

    if (!existingContactQuery.empty) {
        const existingContactDoc = existingContactQuery.docs[0];
        await existingContactDoc.ref.update({
            listIds: FieldValue.arrayUnion(form.contactListId, 'all'),
            status: 'Subscribed'
        });
        return { success: true, contactId: existingContactDoc.id };
    }

    const newContact: Omit<Contact, 'id'> = {
        email,
        firstName: contactData.firstName || '',
        lastName: contactData.lastName || '',
        phone: contactData.phone || '',
        company: contactData.company || '',
        status: 'Subscribed',
        subscribedAt: new Date().toISOString(),
        listIds: [form.contactListId, 'all'],
    };

    const newContactRef = await userDb.collection('contacts').add(newContact);
    
    await updateAllListCounts(userId);

    return { success: true, contactId: newContactRef.id };
}


// ==== CONTACTS & LISTS ====

export async function getContactLists(): Promise<ContactList[]> {
    const userDb = await getDb();
    const listsCollection = userDb.collection('lists');
    const contactsCollection = userDb.collection('contacts');

    let listsSnapshot = await listsCollection.get();
    const batch = admin.firestore().batch();
    let isSeedingPerformed = false;

    const existingListIds = new Set(listsSnapshot.docs.map(doc => doc.id));

    const systemListsToCreate = [
        { id: 'all', data: { name: 'All Contacts', isSystemList: true, isMasterList: true } },
        { id: 'unsubscribes', data: { name: 'Unsubscribes', isSystemList: true } },
        { id: 'bounces', data: { name: 'Bounces', isSystemList: true } }
    ].filter(list => !existingListIds.has(list.id));

    if (systemListsToCreate.length > 0) {
        systemListsToCreate.forEach(listInfo => {
            batch.set(listsCollection.doc(listInfo.id), { ...listInfo.data, count: 0, createdAt: FieldValue.serverTimestamp() });
        });
        isSeedingPerformed = true;
    }

    const userListsExist = listsSnapshot.docs.some(doc => !doc.data().isSystemList);
    let testingListId: string | undefined = listsSnapshot.docs.find(doc => doc.data().name === "Testing")?.id;

    if (!userListsExist) {
        const testingListRef = listsCollection.doc();
        testingListId = testingListRef.id;
        batch.set(testingListRef, { name: 'Testing', count: 0, createdAt: FieldValue.serverTimestamp(), isSystemList: false });
        isSeedingPerformed = true;
    }
    
    if (isSeedingPerformed) {
        await batch.commit();
        isSeedingPerformed = false; 
    }
    
    const userId = (await getDb()).id;

    const contactsSnapshot = await contactsCollection.limit(1).get();
    if (contactsSnapshot.empty && testingListId) {
        const contactRef = contactsCollection.doc();
        await contactRef.set({
            email: 'user@email.com',
            firstName: 'Test',
            lastName: 'User',
            status: 'Subscribed',
            subscribedAt: new Date().toISOString(),
            listIds: ['all', testingListId]
        });
        isSeedingPerformed = true;
    }
    
    if (isSeedingPerformed) {
        await updateAllListCounts(userId);
    }

    listsSnapshot = await listsCollection.get();

    const sortLists = (lists: ContactList[]) => {
        const listOrder: Record<string, number> = { 'all': 1, 'unsubscribes': 2, 'bounces': 3 };
        return lists.sort((a, b) => {
            const aIsSystem = !!listOrder[a.id];
            const bIsSystem = !!listOrder[b.id];
            
            if (aIsSystem && bIsSystem) return listOrder[a.id] - listOrder[b.id];
            if (aIsSystem) return -1;
            if (bIsSystem) return 1;

            if (a.name === 'Testing') return -1;
            if (b.name === 'Testing') return 1;
            
            return a.name.localeCompare(b.name);
        });
    };

    const lists = listsSnapshot.docs.map(doc => docWithIdAndTimestamps(doc) as ContactList);
    return sortLists(lists);
}

export async function getContactListById(id: string): Promise<ContactList | null> {
    const userDb = await getDb();
    const doc = await userDb.collection('lists').doc(id).get();
    return docWithIdAndTimestamps(doc) as ContactList | null;
}

export async function getContactsByListId(listId: string): Promise<Contact[]> {
    const userDb = await getDb();
    const snapshot = await userDb.collection('contacts').where('listIds', 'array-contains', listId).get();
    return snapshot.docs.map(doc => docWithIdAndTimestamps(doc) as Contact);
}

export async function createList(name: string): Promise<void> {
    const userDb = await getDb();
    await userDb.collection('lists').add({
      name,
      count: 0,
      createdAt: FieldValue.serverTimestamp(),
      isSystemList: false,
    });
}

export async function renameList(id: string, newName: string): Promise<void> {
    const userDb = await getDb();
    await userDb.collection('lists').doc(id).update({ name: newName });
}

export async function deleteList(id: string): Promise<void> {
    const userDb = await getDb();
    const listRef = userDb.collection('lists').doc(id);
    const listDoc = await listRef.get();

    if (!listDoc.exists) {
        throw new Error("List not found.");
    }
    if (listDoc.data()?.isSystemList) {
        throw new Error("Cannot delete a system list.");
    }
    
    // Check if the list is used in any active drip campaigns
    const activeDripsUsingList = await userDb.collection('dripCampaigns')
        .where('contactListId', '==', id)
        .where('status', '==', 'Active')
        .limit(1)
        .get();

    if (!activeDripsUsingList.empty) {
        throw new Error("This list is used by an active drip campaign and cannot be deleted. Please pause or change the campaign's list first.");
    }

    const batch = admin.firestore().batch();
    
    const contactsSnapshot = await userDb.collection('contacts').where('listIds', 'array-contains', id).get();
    contactsSnapshot.forEach(doc => {
        batch.update(doc.ref, { listIds: FieldValue.arrayRemove(id) });
    });

    batch.delete(listRef);

    await batch.commit();
}

export async function updateContact(contactId: string, data: Partial<Contact>, currentListId: string): Promise<void> {
    const userDb = await getDb();
    const contactRef = userDb.collection('contacts').doc(contactId);
    const oldContactSnap = await contactRef.get();
    if (!oldContactSnap.exists) throw new Error("Contact not found");
    const oldContactData = oldContactSnap.data() as Contact;
    
    const oldStatus = oldContactData.status;
    const newStatus = data.status;

    const batch = admin.firestore().batch();
    batch.update(contactRef, data);

    if (oldStatus !== newStatus) {
        if (newStatus === 'Unsubscribed') {
            batch.update(contactRef, { listIds: ['unsubscribes'] });
        } else if (newStatus === 'Subscribed' && oldStatus !== 'Subscribed') {
            batch.update(contactRef, {
                listIds: FieldValue.arrayUnion('all', currentListId)
            });
            batch.update(contactRef, {
                listIds: FieldValue.arrayRemove('unsubscribes', 'bounces')
            });
        }
    }
    await batch.commit();
    await updateAllListCounts(userDb.id);
}

export async function removeContactsFromList(contactIds: string[], listId: string): Promise<void> {
    const userDb = await getDb();
    const batch = admin.firestore().batch();
    contactIds.forEach(contactId => {
        const contactRef = userDb.collection('contacts').doc(contactId);
        batch.update(contactRef, { listIds: FieldValue.arrayRemove(listId) });
    });
    await batch.commit();
    await updateAllListCounts(userDb.id);
}

export async function addContactsToLists(contactIds: string[], listIds: string[]): Promise<{ addedCount: number, targetListName: string}> {
    const userDb = await getDb();
    const batch = admin.firestore().batch();
    contactIds.forEach(contactId => {
        const contactRef = userDb.collection('contacts').doc(contactId);
        batch.update(contactRef, { listIds: FieldValue.arrayUnion(...listIds) });
    });
    await batch.commit();
    await updateAllListCounts(userDb.id);
    
    const targetList = await getContactListById(listIds[0]);
    return { addedCount: contactIds.length, targetListName: targetList?.name || 'list' };
}

export async function addTagsToContacts(contactIds: string[], tags: string[]): Promise<void> {
    const userDb = await getDb();
    const batch = admin.firestore().batch();
    contactIds.forEach(contactId => {
        const contactRef = userDb.collection('contacts').doc(contactId);
        batch.update(contactRef, { tags: FieldValue.arrayUnion(...tags) });
    });
    await batch.commit();
}

export async function removeTagsFromContacts(contactIds: string[], tags: string[]): Promise<void> {
    const userDb = await getDb();
    const batch = admin.firestore().batch();
    contactIds.forEach(contactId => {
        const contactRef = userDb.collection('contacts').doc(contactId);
        batch.update(contactRef, { tags: FieldValue.arrayRemove(...tags) });
    });
    await batch.commit();
}

export async function importContacts(data: {
    contacts: Array<Record<string, string>>,
    columnMapping: Record<string, string>,
    uploadOption: string,
    uploadNewListName: string,
    uploadTargetListId: string
}) {
    const userDb = await getDb();
    let targetListId = data.uploadTargetListId;
    let targetListName = '';

    if (data.uploadOption === 'new') {
        const newListRef = await userDb.collection('lists').add({
            name: data.uploadNewListName,
            count: 0,
            createdAt: FieldValue.serverTimestamp(),
            isSystemList: false,
        });
        targetListId = newListRef.id;
        targetListName = data.uploadNewListName;
    } else {
        const listDoc = await userDb.collection('lists').doc(targetListId).get();
        targetListName = listDoc.data()?.name || '';
    }

    const allContactsSnapshot = await userDb.collection('contacts').select('email').get();
    const existingEmails = new Set(allContactsSnapshot.docs.map(doc => doc.data().email));
    
    const batch = admin.firestore().batch();
    let newContactsAddedCount = 0;

    data.contacts.forEach(row => {
        const emailValue = row[data.columnMapping.email];
        if (emailValue) {
            const sanitizedEmail = emailValue.trim().toLowerCase();
            if (sanitizedEmail && !existingEmails.has(sanitizedEmail)) {
                const newContact: Omit<Contact, 'id'> = {
                    email: sanitizedEmail,
                    firstName: data.columnMapping.firstName ? row[data.columnMapping.firstName] || '' : '',
                    lastName: data.columnMapping.lastName ? row[data.columnMapping.lastName] || '' : '',
                    phone: data.columnMapping.phone ? row[data.columnMapping.phone] || '' : '',
                    company: data.columnMapping.company ? row[data.columnMapping.company] || '' : '',
                    tags: data.columnMapping.tags ? (row[data.columnMapping.tags] || '').split(',').map(t => t.trim()).filter(Boolean) : [],
                    status: 'Subscribed',
                    subscribedAt: new Date().toISOString(),
                    listIds: ['all', targetListId],
                };
                const contactRef = userDb.collection('contacts').doc();
                batch.set(contactRef, newContact);
                existingEmails.add(sanitizedEmail);
                newContactsAddedCount++;
            }
        }
    });

    await batch.commit();
    await updateAllListCounts(userDb.id);

    return {
        newContactsAddedCount,
        duplicatesSkippedCount: data.contacts.length - newContactsAddedCount,
        targetListName
    };
}

// ==== SETTINGS ====

export async function getSettings(): Promise<Settings> {
    const userDb = await getDb();
    const doc = await userDb.collection('meta').doc('settings').get();
    return (docWithIdAndTimestamps(doc) as Settings) || {};
}

export async function saveSettings(data: Partial<Settings>) {
    const userDb = await getDb();
    const settingsDocRef = userDb.collection('meta').doc('settings');
    
    const currentSettings = (await settingsDocRef.get()).data() || {};

    const newSettings: Settings = {
        ...currentSettings,
        ...data,
        profile: {
            ...currentSettings.profile,
            ...data.profile,
        },
        defaults: {
            ...currentSettings.defaults,
            ...data.defaults,
        },
    };
    
    await settingsDocRef.set(newSettings, { merge: true });
}


// ==== DASHBOARD & HELPERS ====

async function updateAllListCounts(userId: string) {
    const userDb = admin.firestore().collection('users').doc(userId);
    const listsSnapshot = await userDb.collection('lists').get();
    const batch = admin.firestore().batch();

    for (const listDoc of listsSnapshot.docs) {
        const contactsCountSnapshot = await userDb.collection('contacts').where('listIds', 'array-contains', listDoc.id).count().get();
        const count = contactsCountSnapshot.data().count;
        batch.update(listDoc.ref, { count });
    }

    await batch.commit();
}

export async function getDashboardData() {
    const userDb = await getDb();
    const [campaignsSnapshot, allContactsListSnapshot] = await Promise.all([
        userDb.collection('campaigns').orderBy('createdAt', 'desc').get(),
        userDb.collection('lists').doc('all').get()
    ]);
    
    const allCampaigns = campaignsSnapshot.docs.map(doc => docWithIdAndTimestamps(doc) as Campaign);
    const sentCampaigns = allCampaigns.filter(c => c.status === 'Sent');
    
    const totalSubscribers = (allContactsListSnapshot.data()?.count || 0) as number;
    let avgOpenRate = '0.0%';
    let avgClickRate = '0.0%';

    if (sentCampaigns.length > 0) {
        const totalOpenRate = sentCampaigns.reduce((acc, c) => acc + parseFloat(c.openRate), 0);
        const totalClickRate = sentCampaigns.reduce((acc, c) => acc + parseFloat(c.clickRate), 0);
        avgOpenRate = `${(totalOpenRate / sentCampaigns.length).toFixed(1)}%`;
        avgClickRate = `${(totalClickRate / sentCampaigns.length).toFixed(1)}%`;
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const campaignsSentLast30Days = sentCampaigns.filter(c => c.sentDate && new Date(c.sentDate) > thirtyDaysAgo).length;

    const recentCampaigns = allCampaigns.slice(0, 5);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyData: {[key: string]: { sent: number, opened: number }} = {};
    
    sentCampaigns.forEach(c => {
      if (c.sentDate) {
        const sentDate = new Date(c.sentDate);
        const month = sentDate.getMonth();
        const year = sentDate.getFullYear();
        const key = `${year}-${month}`;
        if (!monthlyData[key]) {
          monthlyData[key] = { sent: 0, opened: 0 };
        }
        monthlyData[key].sent += 1;
        const openedCount = Math.round((c.recipients || 0) * (parseFloat(c.openRate) / 100));
        monthlyData[key].opened += openedCount;
      }
    });
    
    const chartData = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthName = monthNames[d.getMonth()];
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        
        chartData.push({
            month: monthName,
            sent: monthlyData[key]?.sent || 0,
            opened: monthlyData[key]?.opened || 0,
        });
    }

    return {
        totalSubscribers,
        avgOpenRate,
        avgClickRate,
        campaignsSentLast30Days,
        recentCampaigns,
        chartData
    };
}


export async function uploadImage(formData: FormData): Promise<{ url?: string; error?: string }> {
    const userId = await getUserIdFromSession();
    if (!userId) {
        return { error: 'User not authenticated' };
    }

    try {
        const imageFile = formData.get('image') as File | null;
        if (!imageFile) {
            return { error: 'No image file found.' };
        }

        const bucket = getBucket();
        const fileName = `${Date.now()}-${imageFile.name.replace(/\s/g, '_')}`;
        // Store images in a user-specific folder
        const filePath = `users/${userId}/campaign-images/${fileName}`;
        const file = bucket.file(filePath);

        const fileBuffer = Buffer.from(await imageFile.arrayBuffer());

        await file.save(fileBuffer, {
            metadata: {
                contentType: imageFile.type,
            },
        });

        await file.makePublic();

        return { url: file.publicUrl() };
    } catch (error: any) {
        console.error("Error uploading to Firebase Storage:", error);
        return { error: 'Failed to upload image. Make sure your Storage security rules allow public writes.' };
    }
}

// ==== MEDIA ====
export async function getMediaImages(): Promise<MediaImage[]> {
    const userId = await getUserIdFromSession();
    if (!userId) {
        // Return empty array if not authenticated, as this might be called in contexts where it's not a hard error.
        return [];
    }

    try {
        const bucket = getBucket();
        const [files] = await bucket.getFiles({ prefix: `users/${userId}/campaign-images/` });

        if (files.length === 0) return [];
        // The first file is often the directory itself, so filter it out.
        const imageFiles = files.filter(file => !file.name.endsWith('/'));
        
        const mediaImages = await Promise.all(
            imageFiles.map(async (file) => {
                const [metadata] = await file.getMetadata();
                return {
                    name: file.name,
                    url: file.publicUrl(),
                    createdAt: metadata.timeCreated,
                };
            })
        );
        
        // Sort by most recent
        mediaImages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        return mediaImages;
    } catch (error) {
        console.error("Error fetching media from Firebase Storage:", error);
        return [];
    }
}

export async function deleteMediaImage(fileName: string): Promise<{ success: boolean; error?: string }> {
    const userId = await getUserIdFromSession();
    if (!userId) {
        return { success: false, error: 'User not authenticated' };
    }
    // Security check: ensure the file being deleted belongs to the user.
    if (!fileName.startsWith(`users/${userId}/`)) {
        return { success: false, error: 'Permission denied.' };
    }

    try {
        const bucket = getBucket();
        await bucket.file(fileName).delete();
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting image from Firebase Storage:", error);
        return { success: false, error: 'Failed to delete image.' };
    }
}

// ==== UNSUBSCRIBE ====

export async function getUnsubscribeDetails(contactId: string, listId: string | null, all: boolean): Promise<{contactEmail: string, listName?: string, error?: string}> {
    // This is a public action and does not have user context.
    const contactsQuerySnapshot = await admin.firestore().collectionGroup('contacts').get();
    const contactDoc = contactsQuerySnapshot.docs.find(doc => doc.id === contactId);

    if (!contactDoc) {
        return { error: 'This contact does not exist.', contactEmail: '' };
    }
    
    const contact = contactDoc.data() as Contact;
    
    if (all || !listId) {
        return { contactEmail: contact.email };
    }
    
    const userId = contactDoc.ref.parent.parent!.id;
    const userDb = admin.firestore().collection('users').doc(userId);

    const listRef = userDb.collection('lists').doc(listId);
    const listDoc = await listRef.get();
    if (!listDoc.exists) {
         return { error: 'The specified list does not exist.', contactEmail: '' };
    }
    const list = listDoc.data() as ContactList;

    return { contactEmail: contact.email, listName: list.name };
}

export async function unsubscribeContact(contactId: string, listId: string | null, all: boolean): Promise<{success?: boolean, error?: string}> {
    // This is a public action and does not have user context.
    const contactsQuerySnapshot = await admin.firestore().collectionGroup('contacts').get();
    const contactDoc = contactsQuerySnapshot.docs.find(doc => doc.id === contactId);

    if (!contactDoc) {
        return { error: 'Contact not found.' };
    }

    const contactRef = contactDoc.ref;
    const contactData = contactDoc.data() as Contact;
    
    const userId = contactDoc.ref.parent.parent!.id;

    const batch = admin.firestore().batch();

    if (all) {
        const allUserLists = contactData.listIds.filter(id => !['all', 'unsubscribes', 'bounces'].includes(id));
        batch.update(contactRef, { 
            status: 'Unsubscribed', 
            listIds: FieldValue.arrayRemove(...allUserLists)
        });
        batch.update(contactRef, { listIds: FieldValue.arrayUnion('unsubscribes') });
    } else if (listId) {
        batch.update(contactRef, { listIds: FieldValue.arrayRemove(listId) });
    } else {
        return { error: 'No list specified for unsubscribe.' };
    }

    await batch.commit();
    
    // Need to pass userId to update counts for the correct user
    await updateAllListCounts(userId);

    return { success: true };
}
