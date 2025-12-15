-- AlterTable: Update FhirResource schema for security improvements
-- Add versionId, content, deleted fields and remove old data/version fields

-- Step 1: Add new columns if they don't exist
DO $$
BEGIN
  -- Add versionId column (renamed from version)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'FhirResource' AND column_name = 'versionId') THEN
    ALTER TABLE "FhirResource" ADD COLUMN "versionId" INTEGER;
    -- Copy data from version to versionId if version exists
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'FhirResource' AND column_name = 'version') THEN
      UPDATE "FhirResource" SET "versionId" = "version";
    END IF;
    ALTER TABLE "FhirResource" ALTER COLUMN "versionId" SET DEFAULT 1;
    ALTER TABLE "FhirResource" ALTER COLUMN "versionId" SET NOT NULL;
  END IF;

  -- Add content column (renamed from data)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'FhirResource' AND column_name = 'content') THEN
    ALTER TABLE "FhirResource" ADD COLUMN "content" JSONB;
    -- Copy data from data to content if data exists
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'FhirResource' AND column_name = 'data') THEN
      UPDATE "FhirResource" SET "content" = "data";
    END IF;
    ALTER TABLE "FhirResource" ALTER COLUMN "content" SET NOT NULL;
  END IF;

  -- Add deleted column for soft deletes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'FhirResource' AND column_name = 'deleted') THEN
    ALTER TABLE "FhirResource" ADD COLUMN "deleted" BOOLEAN DEFAULT false;
    ALTER TABLE "FhirResource" ALTER COLUMN "deleted" SET NOT NULL;
  END IF;
END $$;

-- Step 2: Drop old unique constraint if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint
             WHERE conname = 'FhirResource_resourceType_resourceId_key') THEN
    ALTER TABLE "FhirResource" DROP CONSTRAINT "FhirResource_resourceType_resourceId_key";
  END IF;
END $$;

-- Step 3: Add new unique constraint for versioning
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                 WHERE conname = 'FhirResource_resourceType_resourceId_versionId_key') THEN
    ALTER TABLE "FhirResource" ADD CONSTRAINT "FhirResource_resourceType_resourceId_versionId_key"
      UNIQUE ("resourceType", "resourceId", "versionId");
  END IF;
END $$;

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS "FhirResource_resourceId_idx" ON "FhirResource"("resourceId");
CREATE INDEX IF NOT EXISTS "FhirResource_deleted_idx" ON "FhirResource"("deleted");

-- Step 5: Create GIN indexes for JSONB queries (critical for performance)
CREATE INDEX IF NOT EXISTS "FhirResource_content_gin_idx" ON "FhirResource" USING GIN ("content");
CREATE INDEX IF NOT EXISTS "FhirResource_content_identifier_gin_idx" ON "FhirResource" USING GIN (("content"->'identifier'));
CREATE INDEX IF NOT EXISTS "FhirResource_content_name_gin_idx" ON "FhirResource" USING GIN (("content"->'name'));

-- Step 6: Drop old columns if they exist and new columns are populated
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'FhirResource' AND column_name = 'version') THEN
    ALTER TABLE "FhirResource" DROP COLUMN "version";
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'FhirResource' AND column_name = 'data') THEN
    ALTER TABLE "FhirResource" DROP COLUMN "data";
  END IF;
END $$;
