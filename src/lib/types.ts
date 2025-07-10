

export type Campaign = {
    id: string;
    name: string;
    status: 'Sent' | 'Draft' | 'Scheduled' | 'Sending';
    sentDate?: string;
    scheduledAt?: string;
    openRate: string;
    clickRate: string;
    recipients?: number;
    successfulDeliveries?: number;
    bounces?: number;
    unsubscribes?: number;
    queuedRecipients?: number;
    recipientListId?: string;
    subject?: string;
    emailBody?: string;
    tags?: string[];
    emailBackgroundColor?: string;
    createdAt: string;
    updatedAt: string;
};

export type Contact = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    company?: string;
    status: 'Subscribed' | 'Unsubscribed' | 'Bounced';
    subscribedAt: string;
    listIds: string[];
    tags?: string[];
};

export type ContactList = {
  id: string;
  name: string;
  count: number;
  createdAt: string;
  isSystemList: boolean;
  isMasterList?: boolean;
};

export type Template = {
    id: string;
    name: string;
    content: string;
    createdAt: string;
};

export type Settings = {
    draftCampaignSeeded?: boolean;
    templatesSeeded?: boolean;
    profile?: {
        companyName: string;
        address: string;
    },
    defaults?: {
        fromName: string;
        fromEmail: string;
    }
}

export type MediaImage = {
    name: string;
    url: string;
    createdAt: string;
};
