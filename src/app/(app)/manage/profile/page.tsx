import { getSiteProfile } from "@/server/site/service";
import { SiteProfileForm } from "./SiteProfileForm";
import type { SiteProfile } from "@/server/site/type";

export const dynamic = "force-dynamic";

export default async function ManageProfilePage() {
    const profile = (await getSiteProfile()) as unknown as SiteProfile | null;
    return <SiteProfileForm profile={profile} />;
}
