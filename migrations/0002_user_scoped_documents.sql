ALTER TABLE "documents" ADD COLUMN "user_id" text;
--> statement-breakpoint
CREATE INDEX "documents_user_id_idx" ON "documents" USING btree ("user_id");
