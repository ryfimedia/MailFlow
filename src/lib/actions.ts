'use server';

import { adminDb } from './firebase-admin';
import { z } from 'zod';
import { Resend } from 'resend';
import type { Campaign, Contact, ContactList, Settings, Template } from './types';
import { FieldValue } from 'firebase-admin/firestore';

const resend = new Resend(process.env.RESEND_API_KEY);

// Helper function to convert Firestore doc to a serializable object
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
    const snapshot = await adminDb.collection('campaigns').orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => docWithIdAndTimestamps(doc) as Campaign);
}

export async function getCampaignById(id: string): Promise<Campaign | null> {
    const doc = await adminDb.collection('campaigns').doc(id).get();
    return docWithIdAndTimestamps(doc) as Campaign | null;
}

export async function saveCampaign(data: Partial<Campaign> & { id: string | null }) {
    const { id, ...campaignData } = data;

    let finalEmailBody = campaignData.emailBody || '';

    // If sending/scheduling, add the footer
    if (campaignData.status === 'Sent' || campaignData.status === 'Scheduled') {
        const settings = await getSettings();
        const companyName = settings.profile?.companyName || 'RyFi Media LLC';
        const companyAddress = settings.profile?.address || 'PO Box 157, Colton, OR 97017';

        const footer = `
            <div style="text-align: center; font-family: sans-serif; font-size: 12px; color: #888888; padding: 20px 0; margin-top: 20px; border-top: 1px solid #eaeaea;">
                <p style="margin: 0 0 5px 0;">Copyright 2025 ${companyName}, All rights reserved.</p>
                <p style="margin: 0 0 10px 0;">Our mailing address is: ${companyAddress}</p>
                <p style="margin: 0 0 10px 0;">You have been sent this business email communication because you are listed as a professional real estate broker, agent or property manager in our area.</p>
                <p style="margin: 0;">
                <a href="#unsubscribe-list" style="color: #888888; text-decoration: underline;">Unsubscribe from this list</a>
                <span style="padding: 0 5px;">|</span>
                <a href="#unsubscribe-all" style="color: #888888; text-decoration: underline;">Unsubscribe from all mailings</a>
                </p>
            </div>
        `;
        finalEmailBody += footer;
        campaignData.emailBody = finalEmailBody;
    }

    if (campaignData.status === 'Sent') {
        const contacts = await getContactsByListId(campaignData.recipientListId!);
        const recipientEmails = contacts.map(c => c.email);

        if (recipientEmails.length === 0) {
            return { error: 'No recipients in the selected list. Campaign saved as draft.' };
        }

        const settings = await getSettings();
        const fromName = settings.defaults?.fromName || 'RyFi Media LLC';
        const fromEmail = settings.defaults?.fromEmail || 'hello@ryfimedia.com';

        try {
            await resend.emails.send({
                from: `${fromName} <${fromEmail}>`,
                to: recipientEmails,
                subject: campaignData.subject || 'No Subject',
                html: finalEmailBody,
            });
            // Update campaign stats on send
            campaignData.sentDate = new Date().toISOString();
            campaignData.recipients = recipientEmails.length;
            campaignData.successfulDeliveries = recipientEmails.length; // Placeholder
            campaignData.bounces = 0;
            campaignData.unsubscribes = 0;
            campaignData.openRate = '0.0%';
            campaignData.clickRate = '0.0%';
        } catch (error: any) {
            console.error('Resend API error:', error);
            return { error: `Could not send campaign: ${error.message}.` };
        }
    }

    if (id) {
        await adminDb.collection('campaigns').doc(id).set({
            ...campaignData,
            updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
        return { id };
    } else {
        const newDocRef = await adminDb.collection('campaigns').add({
            ...campaignData,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });
        return { id: newDocRef.id };
    }
}

export async function duplicateCampaign(id: string): Promise<Campaign | null> {
    const originalCampaign = await getCampaignById(id);
    if (!originalCampaign) return null;

    const { id: originalId, status, sentDate, ...newCampaignData } = originalCampaign;

    const newCampaign: Partial<Campaign> = {
        ...newCampaignData,
        name: `Copy of ${originalCampaign.name}`,
        status: 'Draft',
        openRate: '-',
        clickRate: '-',
    };

    // Remove stats
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

// ==== TEMPLATES ====

export async function getTemplates(): Promise<Template[]> {
    const snapshot = await adminDb.collection('templates').orderBy('createdAt', 'desc').get();
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

// ==== CONTACTS & LISTS ====

export async function getContactLists(): Promise<ContactList[]> {
    const snapshot = await adminDb.collection('lists').get();
    // Sort system lists to the top
    const lists = snapshot.docs.map(doc => docWithIdAndTimestamps(doc) as ContactList);
    return lists.sort((a, b) => {
        if (a.isSystemList && !b.isSystemList) return -1;
        if (!a.isSystemList && b.isSystemList) return 1;
        if (a.isMasterList) return -1;
        if (b.isMasterList) return 1;
        return a.name.localeCompare(b.name);
    });
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
    const batch = adminDb.batch();
    
    // Remove listId from all contacts
    const contactsSnapshot = await adminDb.collection('contacts').where('listIds', 'array-contains', id).get();
    contactsSnapshot.forEach(doc => {
        batch.update(doc.ref, { listIds: FieldValue.arrayRemove(id) });
    });

    // Delete the list document itself
    const listRef = adminDb.collection('lists').doc(id);
    batch.delete(listRef);

    await batch.commit();
}

export async function updateContact(contactId: string, data: Partial<Contact>, currentListId: string): Promise<void> {
    const contactRef = adminDb.collection('contacts').doc(contactId);
    const oldContactSnap = await contactRef.get();
    const oldContactData = oldContactSnap.data() as Contact;
    
    const oldStatus = oldContactData.status;
    const newStatus = data.status;

    const batch = adminDb.batch();
    batch.update(contactRef, data);

    if (oldStatus !== newStatus) {
        if (newStatus === 'Unsubscribed') {
            const unsubList = (await adminDb.collection('lists').where('id', '==', 'unsubscribes').get()).docs[0];
            batch.update(contactRef, { status: 'Unsubscribed', listIds: ['unsubscribes'] });
        } else if (newStatus === 'Subscribed' && oldStatus !== 'Subscribed') {
            // Re-subscribing adds them back to the original list and the 'all' list
            batch.update(contactRef, { status: 'Subscribed', listIds: FieldValue.arrayUnion('all', currentListId) });
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
                    status: 'Subscribed',
                    subscribedAt: new Date().toISOString(),
                    listIds: ['all', targetListId],
                };
                const contactRef = adminDb.collection('contacts').doc(); // new doc
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
    return docWithIdAndTimestamps(doc) as Settings || {};
}

export async function saveSettings(formName: 'profile' | 'defaults', data: any) {
    await adminDb.collection('meta').doc('settings').set({
        [formName]: data
    }, { merge: true });
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
        adminDb.collection('campaigns').where('status', '==', 'Sent').orderBy('sentDate', 'desc').get(),
        adminDb.collection('lists').doc('all').get()
    ]);
    
    const sentCampaigns = campaignsSnapshot.docs.map(doc => docWithIdAndTimestamps(doc) as Campaign);
    
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

    const recentCampaigns = (await adminDb.collection('campaigns').orderBy('createdAt', 'desc').limit(5).get()).docs.map(doc => docWithIdAndTimestamps(doc) as Campaign);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyData: {[key: string]: { sent: number, opened: number }} = {};
    
    sentCampaigns.forEach(c => {
      if (c.sentDate) {
        const month = new Date(c.sentDate).getMonth();
        const monthName = monthNames[month];
        if (!monthlyData[monthName]) {
          monthlyData[monthName] = { sent: 0, opened: 0 };
        }
        monthlyData[monthName].sent += 1;
        // This is a mock calculation for opened
        if (Math.random() < parseFloat(c.openRate) / 100) {
          monthlyData[monthName].opened += 1;
        }
      }
    });

    const chartData = monthNames.map(month => ({
      month,
      sent: monthlyData[month]?.sent || 0,
      opened: monthlyData[month]?.opened || 0,
    })).slice(0, 6);

    return {
        totalSubscribers,
        avgOpenRate,
        avgClickRate,
        campaignsSentLast30Days,
        recentCampaigns,
        chartData
    };
}
