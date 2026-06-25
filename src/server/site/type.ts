import { z } from "zod";
import type { SiteProfileSchema, updateSiteProfileSchema, socialLinkSchema } from "./schema";

export type SiteProfile = z.infer<typeof SiteProfileSchema>;
export type UpdateSiteProfileInput = z.infer<typeof updateSiteProfileSchema>;
export type SocialLink = z.infer<typeof socialLinkSchema>;
