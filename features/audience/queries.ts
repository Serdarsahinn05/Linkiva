import { db } from "@/lib/db";

/** Subscribers of the user's own profile, newest first. */
export async function getSubscribers(userId: string) {
  return db.subscriber.findMany({
    where: { profile: { userId } },
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, createdAt: true },
  });
}

export { csvCell } from "@/lib/csv";
