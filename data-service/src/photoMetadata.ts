import { and, eq, gte, lt } from "drizzle-orm";
import { index, integer, jsonb, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import type { Sql } from "postgres";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
type AnalysisResult = Exclude<JsonValue, null>;

const photoMetadata = pgTable("photo_metadata", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  capturedAt: timestamp("captured_at", { withTimezone: true }).notNull(),
  originalBucket: text("original_bucket").notNull(),
  originalKey: text("original_key").notNull(),
  yoloResult: jsonb("yolo_result").$type<AnalysisResult>().notNull(),
  tesseractResult: jsonb("tesseract_result").$type<AnalysisResult>(),
}, (table) => [
  unique("photo_metadata_original_unique").on(table.originalBucket, table.originalKey),
  index("photo_metadata_captured_at_id_idx").on(table.capturedAt, table.id),
]);

export type PhotoMetadata = typeof photoMetadata.$inferSelect;
export type NewPhotoMetadata = Omit<PhotoMetadata, "id">;

export function createPhotoMetadataRepository(client: Sql) {
  const db = drizzle(client);

  return {
    async insertPhotoMetadata(input: NewPhotoMetadata): Promise<PhotoMetadata> {
      const [record] = await db.insert(photoMetadata).values(input).returning();
      return record;
    },

    async findPhotoOriginal(id: number) {
      const [original] = await db.select({
        bucket: photoMetadata.originalBucket,
        key: photoMetadata.originalKey,
      }).from(photoMetadata).where(eq(photoMetadata.id, id));
      return original;
    },

    async listPhotoMetadata(start: Date, end: Date): Promise<PhotoMetadata[]> {
      const startTime = start.getTime();
      const endTime = end.getTime();
      if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || startTime >= endTime) {
        throw new RangeError("Informe datas válidas com início anterior ao fim.");
      }

      return db
        .select()
        .from(photoMetadata)
        .where(and(gte(photoMetadata.capturedAt, start), lt(photoMetadata.capturedAt, end)))
        .orderBy(photoMetadata.capturedAt, photoMetadata.id);
    },
  };
}
