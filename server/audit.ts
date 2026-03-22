import { db } from "./database";
import { auditLogs } from "@shared/schema";

export async function logAction(
  req: any,
  action: string,
  targetType: string,
  targetId: number | null,
  details: string,
  hopDongId?: number | null
) {
  if (!req.user) return;
  req.audited = true;
  try {
    await db.insert(auditLogs).values({
      userId: req.user.id,
      action,
      targetType,
      targetId,
      details,
      hopDongId: hopDongId || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Lỗi khi ghi audit log:", error);
  }
}
