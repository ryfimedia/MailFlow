
import { getDripCampaigns, getContactLists } from "@/lib/actions";
import DripCampaignsClient from "./drip-campaigns-client";

export default async function DripCampaignsPage() {
  const [campaigns, contactLists] = await Promise.all([
    getDripCampaigns(),
    getContactLists()
  ]);

  const listMap: Record<string, string> = {};
  contactLists.forEach(list => {
    listMap[list.id] = list.name;
  });

  return <DripCampaignsClient initialCampaigns={campaigns} initialListMap={listMap} />;
}
