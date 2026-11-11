import { collection, addDoc, getDocs } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { ActivityLog } from "../types";

const COLLECTION_NAME = "activityLogs";

export async function logActivity(
  action: string,
  resource: string,
  resourceId?: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    const user = auth.currentUser;
    await addDoc(collection(db, COLLECTION_NAME), {
      userId: user?.uid || "system",
      userEmail: user?.email || "admin",
      action,
      resource,
      resourceId: resourceId || "",
      metadata: metadata || {},
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.debug("Activity log error:", error);
  }
}

export async function getActivityLogs(count?: number): Promise<ActivityLog[]> {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    const logs: ActivityLog[] = [];
    snapshot.forEach((docSnap) => {
      logs.push({ id: docSnap.id, ...docSnap.data() } as ActivityLog);
    });
    logs.sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""));
    return count ? logs.slice(0, count) : logs;
  } catch (error) {
    console.warn("Activity logs fetch notice:", error);
    return [];
  }
}
