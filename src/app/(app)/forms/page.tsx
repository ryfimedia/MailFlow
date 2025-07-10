
import { getOptInForms, getContactLists } from "@/lib/actions";
import FormsClient from "./forms-client";

export default async function FormsPage() {
  const [forms, lists] = await Promise.all([
    getOptInForms(),
    getContactLists(),
  ]);

  const listMap = lists.reduce((acc, list) => {
    acc[list.id] = list.name;
    return acc;
  }, {} as Record<string, string>);

  return <FormsClient initialForms={forms} listMap={listMap} />;
}
