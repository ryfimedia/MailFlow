
import { getContactLists } from "@/lib/actions";
import ContactsClient from "./contacts-client";

export default async function ContactsPage() {
  const lists = await getContactLists();
  return <ContactsClient initialLists={lists} />;
}
