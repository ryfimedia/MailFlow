
'use server';

import { adminDb, adminStorage } from './firebase-admin';
import { z } from 'zod';
import { Resend } from 'resend';
import type { Campaign, Contact, ContactList, Settings, Template, MediaImage, DripCampaign, OptInForm } from './types';
import { FieldValue } from 'firebase-admin/firestore';
import { defaultTemplates } from './default-templates';
import admin from 'firebase-admin';

const FREE_TIER_DAILY_LIMIT = 100;

function getBucket() {
    const bucketName = admin.app().options.storageBucket;
    if (!bucketName) {
        throw new Error('Firebase Storage bucket name is not configured. Check your service account credentials or environment variables.');
    }
    return adminStorage.bucket(bucketName);
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

// ==== CAMPAIGNS ====

export async function getCampaigns(): Promise<Campaign[]> {
    const campaignsCollection = adminDb.collection('campaigns');
    const settingsRef = adminDb.collection('meta').doc('settings');

    const [campaignsSnapshot, settingsDoc] = await Promise.all([
        campaignsCollection.orderBy('createdAt', 'desc').get(),
        settingsRef.get()
    ]);
    
    const settings = settingsDoc.data() || {};

    if (!settings.draftCampaignSeeded) {
        const welcomeTemplate = defaultTemplates.find(t => t.name === 'Welcome Email');
        
        if (welcomeTemplate) {
             const batch = adminDb.batch();
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
    const doc = await adminDb.collection('campaigns').doc(id).get();
    return docWithIdAndTimestamps(doc) as Campaign | null;
}

export async function saveCampaign(data: Partial<Campaign> & { id: string | null }) {
    const { id, tags, ...campaignData } = data;
    
    if (campaignData.status === 'Draft') {
        if (id) {
            await adminDb.collection('campaigns').doc(id).set({ ...campaignData, tags: tags || [], updatedAt: FieldValue.serverTimestamp() }, { merge: true });
            return { id };
        } else {
            const newDocRef = await adminDb.collection('campaigns').add({ ...campaignData, tags: tags || [], createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
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
        await adminDb.collection('campaigns').doc(id).set({ ...campaignData, tags: tags || [], updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        return { id, success: successMessage };
    } else {
        const newDocRef = await adminDb.collection('campaigns').add({ ...campaignData, tags: tags || [], createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
        return { id: newDocRef.id, success: successMessage };
    }
}

export async function duplicateCampaign(campaignId: string): Promise<Campaign | null> {
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

    const newDocRef = await adminDb.collection('campaigns').add({
        ...newCampaign,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
    });
    return { ...newCampaign, id: newDocRef.id } as Campaign;
}

export async function deleteCampaign(id: string) {
    await adminDb.collection('campaigns').doc(id).delete();
}

// ==== DRIP CAMPAIGNS ====

export async function getDripCampaigns(): Promise<DripCampaign[]> {
    const snapshot = await adminDb.collection('dripCampaigns').orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => docWithIdAndTimestamps(doc) as DripCampaign);
}

export async function getDripCampaignById(id: string): Promise<DripCampaign | null> {
    const doc = await adminDb.collection('dripCampaigns').doc(id).get();
    return docWithIdAndTimestamps(doc) as DripCampaign | null;
}

export async function saveDripCampaign(data: Partial<DripCampaign> & { id?: string | null }) {
    const { id, ...dripData } = data;
    
    if (id) {
        await adminDb.collection('dripCampaigns').doc(id).set({
            ...dripData,
            updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });
        return { id };
    } else {
        const newDocRef = await adminDb.collection('dripCampaigns').add({
            ...dripData,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
        });
        return { id: newDocRef.id };
    }
}

export async function deleteDripCampaign(id: string) {
    await adminDb.collection('dripCampaigns').doc(id).delete();
}


// ==== TEMPLATES ====

export async function getTemplates(): Promise<Template[]> {
    const templatesCollection = adminDb.collection('templates');
    const settingsRef = adminDb.collection('meta').doc('settings');

    const [snapshot, settingsDoc] = await Promise.all([
        templatesCollection.orderBy('createdAt', 'desc').get(),
        settingsRef.get()
    ]);
    
    const settings = settingsDoc.data() || {};

    if (!settings.templatesSeeded) {
        const batch = adminDb.batch();
        
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
    const { id, ...templateData } = data;
    if (id) {
        await adminDb.collection('templates').doc(id).update(templateData);
        return { id };
    } else {
        const newDocRef = await adminDb.collection('templates').add({
            ...templateData,
            createdAt: FieldValue.serverTimestamp()
        });
        return { id: newDocRef.id };
    }
}

export async function deleteTemplate(id: string) {
    await adminDb.collection('templates').doc(id).delete();
}

// ==== OPT-IN FORMS ====

export async function getOptInForms(): Promise<OptInForm[]> {
    const snapshot = await adminDb.collection('optInForms').orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => docWithIdAndTimestamps(doc) as OptInForm);
}

export async function getOptInFormById(id: string): Promise<OptInForm | null> {
    const doc = await adminDb.collection('optInForms').doc(id).get();
    return docWithIdAndTimestamps(doc) as OptInForm | null;
}

export async function saveOptInForm(data: Partial<OptInForm> & { id?: string | null }) {
    const { id, ...formData } = data;
    if (id) {
        await adminDb.collection('optInForms').doc(id).set({
            ...formData,
            updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });
        return { id };
    } else {
        const newDocRef = await adminDb.collection('optInForms').add({
            ...formData,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
        });
        return { id: newDocRef.id };
    }
}

export async function deleteOptInForm(id: string) {
    await adminDb.collection('optInForms').doc(id).delete();
}

export async function addContactFromForm(data: { formId: string, email: string, firstName?: string, lastName?: string, phone?: string, company?: string }) {
    const form = await getOptInFormById(data.formId);
    if (!form) {
        return { error: 'Form not found.' };
    }

    const email = data.email.trim().toLowerCase();
    const existingContactQuery = await adminDb.collection('contacts').where('email', '==', email).limit(1).get();

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
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        phone: data.phone || '',
        company: data.company || '',
        status: 'Subscribed',
        subscribedAt: new Date().toISOString(),
        listIds: [form.contactListId, 'all'],
    };

    const newContactRef = await adminDb.collection('contacts').add(newContact);
    
    await updateAllListCounts();

    return { success: true, contactId: newContactRef.id };
}


// ==== CONTACTS & LISTS ====

export async function getContactLists(): Promise<ContactList[]> {
    const listsCollection = adminDb.collection('lists');
    const contactsCollection = adminDb.collection('contacts');

    let listsSnapshot = await listsCollection.get();
    const batch = adminDb.batch();
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
        await updateAllListCounts();
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
    const doc = await adminDb.collection('lists').doc(id).get();
    return docWithIdAndTimestamps(doc) as ContactList | null;
}

export async function getContactsByListId(listId: string): Promise<Contact[]> {
    const snapshot = await adminDb.collection('contacts').where('listIds', 'array-contains', listId).get();
    return snapshot.docs.map(doc => docWithIdAndTimestamps(doc) as Contact);
}

export async function createList(name: string): Promise<void> {
    await adminDb.collection('lists').add({
      name,
      count: 0,
      createdAt: FieldValue.serverTimestamp(),
      isSystemList: false,
    });
}

export async function renameList(id: string, newName: string): Promise<void> {
    await adminDb.collection('lists').doc(id).update({ name: newName });
}

export async function deleteList(id: string): Promise<void> {
    const listRef = adminDb.collection('lists').doc(id);
    const listDoc = await listRef.get();

    if (!listDoc.exists) {
        throw new Error("List not found.");
    }
    if (listDoc.data()?.isSystemList) {
        throw new Error("Cannot delete a system list.");
    }

    const batch = adminDb.batch();
    
    const contactsSnapshot = await adminDb.collection('contacts').where('listIds', 'array-contains', id).get();
    contactsSnapshot.forEach(doc => {
        batch.update(doc.ref, { listIds: FieldValue.arrayRemove(id) });
    });

    batch.delete(listRef);

    await batch.commit();
}

export async function updateContact(contactId: string, data: Partial<Contact>, currentListId: string): Promise<void> {
    const contactRef = adminDb.collection('contacts').doc(contactId);
    const oldContactSnap = await contactRef.get();
    if (!oldContactSnap.exists) throw new Error("Contact not found");
    const oldContactData = oldContactSnap.data() as Contact;
    
    const oldStatus = oldContactData.status;
    const newStatus = data.status;

    const batch = adminDb.batch();
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
    await updateAllListCounts();
}

export async function removeContactsFromList(contactIds: string[], listId: string): Promise<void> {
    const batch = adminDb.batch();
    contactIds.forEach(contactId => {
        const contactRef = adminDb.collection('contacts').doc(contactId);
        batch.update(contactRef, { listIds: FieldValue.arrayRemove(listId) });
    });
    await batch.commit();
    await updateAllListCounts();
}

export async function addContactsToLists(contactIds: string[], listIds: string[]): Promise<{ addedCount: number, targetListName: string}> {
    const batch = adminDb.batch();
    contactIds.forEach(contactId => {
        const contactRef = adminDb.collection('contacts').doc(contactId);
        batch.update(contactRef, { listIds: FieldValue.arrayUnion(...listIds) });
    });
    await batch.commit();
    await updateAllListCounts();
    
    const targetList = await getContactListById(listIds[0]);
    return { addedCount: contactIds.length, targetListName: targetList?.name || 'list' };
}

export async function addTagsToContacts(contactIds: string[], tags: string[]): Promise<void> {
    const batch = adminDb.batch();
    contactIds.forEach(contactId => {
        const contactRef = adminDb.collection('contacts').doc(contactId);
        batch.update(contactRef, { tags: FieldValue.arrayUnion(...tags) });
    });
    await batch.commit();
}

export async function removeTagsFromContacts(contactIds: string[], tags: string[]): Promise<void> {
    const batch = adminDb.batch();
    contactIds.forEach(contactId => {
        const contactRef = adminDb.collection('contacts').doc(contactId);
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
    let targetListId = data.uploadTargetListId;
    let targetListName = '';

    if (data.uploadOption === 'new') {
        const newListRef = await adminDb.collection('lists').add({
            name: data.uploadNewListName,
            count: 0,
            createdAt: FieldValue.serverTimestamp(),
            isSystemList: false,
        });
        targetListId = newListRef.id;
        targetListName = data.uploadNewListName;
    } else {
        const listDoc = await adminDb.collection('lists').doc(targetListId).get();
        targetListName = listDoc.data()?.name || '';
    }

    const allContactsSnapshot = await adminDb.collection('contacts').select('email').get();
    const existingEmails = new Set(allContactsSnapshot.docs.map(doc => doc.data().email));
    
    const batch = adminDb.batch();
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
                const contactRef = adminDb.collection('contacts').doc();
                batch.set(contactRef, newContact);
                existingEmails.add(sanitizedEmail);
                newContactsAddedCount++;
            }
        }
    });

    await batch.commit();
    await updateAllListCounts();

    return {
        newContactsAddedCount,
        duplicatesSkippedCount: data.contacts.length - newContactsAddedCount,
        targetListName
    };
}

// ==== SETTINGS ====

export async function getSettings(): Promise<Settings> {
    const doc = await adminDb.collection('meta').doc('settings').get();
    return (docWithIdAndTimestamps(doc) as Settings) || {};
}

export async function saveSettings(data: Partial<Settings>) {
    const settingsDocRef = adminDb.collection('meta').doc('settings');
    
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

async function updateAllListCounts() {
    const listsSnapshot = await adminDb.collection('lists').get();
    const batch = adminDb.batch();

    for (const listDoc of listsSnapshot.docs) {
        const contactsCountSnapshot = await adminDb.collection('contacts').where('listIds', 'array-contains', listDoc.id).count().get();
        const count = contactsCountSnapshot.data().count;
        batch.update(listDoc.ref, { count });
    }

    await batch.commit();
}

export async function getDashboardData() {
    const [campaignsSnapshot, allContactsListSnapshot] = await Promise.all([
        adminDb.collection('campaigns').orderBy('createdAt', 'desc').get(),
        adminDb.collection('lists').doc('all').get()
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
    try {
        const imageFile = formData.get('image') as File | null;
        if (!imageFile) {
            return { error: 'No image file found.' };
        }

        const bucket = getBucket();
        const fileName = `${Date.now()}-${imageFile.name.replace(/\s/g, '_')}`;
        const file = bucket.file(`campaign-images/${fileName}`);

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
    try {
        const bucket = getBucket();
        const [files] = await bucket.getFiles({ prefix: 'campaign-images/' });

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
        // This can happen if Storage is not enabled or permissions are wrong.
        // Return an empty array to avoid crashing the page.
        return [];
    }
}

export async function deleteMediaImage(fileName: string): Promise<{ success: boolean; error?: string }> {
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
    const contactRef = adminDb.collection('contacts').doc(contactId);
    const contactDoc = await contactRef.get();
    
    if (!contactDoc.exists) {
        return { error: 'This contact does not exist.', contactEmail: '' };
    }
    const contact = contactDoc.data() as Contact;
    
    if (all || !listId) {
        return { contactEmail: contact.email };
    }

    const listRef = adminDb.collection('lists').doc(listId);
    const listDoc = await listRef.get();
    if (!listDoc.exists) {
         return { error: 'The specified list does not exist.', contactEmail: '' };
    }
    const list = listDoc.data() as ContactList;

    return { contactEmail: contact.email, listName: list.name };
}

export async function unsubscribeContact(contactId: string, listId: string | null, all: boolean): Promise<{success?: boolean, error?: string}> {
    const contactRef = adminDb.collection('contacts').doc(contactId);
    const contactDoc = await contactRef.get();
    if (!contactDoc.exists) {
        return { error: 'Contact not found.' };
    }
    const contactData = contactDoc.data() as Contact;

    const batch = adminDb.batch();

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
    await updateAllListCounts();
    return { success: true };
}


    