
import { getTemplates } from "@/lib/actions";
import TemplatesClient from "./templates-client";

export default async function TemplatesPage() {
  const templates = await getTemplates();
  return <TemplatesClient initialTemplates={templates} />;
}
