import { storage } from "./storage";
import { db } from "./db";
import { classMaterials } from "@shared/schema";
import { sql } from "drizzle-orm";
import path from "path";
import fs from "fs/promises";

export async function cleanupExpiredMaterials() {
  try {
    console.log("[Cleanup] Starting automatic cleanup of expired materials...");

    // Get expired materials before deleting
    const expiredMaterials = await db
      .select()
      .from(classMaterials)
      .where(sql`${classMaterials.expiresAt} < ${new Date()}`);

    if (expiredMaterials.length === 0) {
      console.log("[Cleanup] No expired materials found.");
      return 0;
    }

    console.log(`[Cleanup] Found ${expiredMaterials.length} expired materials`);

    // Delete files from filesystem
    for (const material of expiredMaterials) {
      const filePath = path.join(process.cwd(), material.fileUrl);
      try {
        await fs.unlink(filePath);
        console.log(`[Cleanup] Deleted file: ${material.fileName}`);
      } catch (error) {
        console.error(`[Cleanup] Failed to delete file ${material.fileName}:`, error);
      }
    }

    // Delete from database
    const deletedCount = await storage.deleteExpiredMaterials();

    console.log(`[Cleanup] Successfully cleaned up ${deletedCount} expired materials`);
    return deletedCount;
  } catch (error) {
    console.error("[Cleanup] Error during cleanup:", error);
    return 0;
  }
}

// Run cleanup every 6 hours (21,600,000 milliseconds)
const CLEANUP_INTERVAL = 6 * 60 * 60 * 1000;

export function startAutomaticCleanup() {
  console.log("[Cleanup] Starting automatic cleanup service...");
  
  // Run cleanup immediately on startup
  cleanupExpiredMaterials();

  // Then run every 6 hours
  setInterval(() => {
    cleanupExpiredMaterials();
  }, CLEANUP_INTERVAL);

  console.log("[Cleanup] Automatic cleanup scheduled to run every 6 hours");
}
