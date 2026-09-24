import { cache } from "react";
import { db } from "@/lib/db";

/** The signed-in user's profile (or null before onboarding). Deduplicated per request. */
export const getOwnProfile = cache(async (userId: string) => db.profile.findUnique({ where: { userId } }));
