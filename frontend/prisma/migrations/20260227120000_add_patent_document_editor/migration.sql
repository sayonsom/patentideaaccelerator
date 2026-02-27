-- Patent Document Editor: 4 new tables for rich document editing,
-- version control, inline comments, and patent figure management.

-- PatentDocument: one-to-one with Idea, stores Tiptap JSON content
CREATE TABLE "patent_documents" (
    "id" TEXT NOT NULL,
    "idea_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "content" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "paragraph_counter" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patent_documents_pkey" PRIMARY KEY ("id")
);

-- DocumentVersion: snapshot-based version control for documents
CREATE TABLE "document_versions" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "version_num" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "trigger" TEXT NOT NULL DEFAULT 'manual',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_versions_pkey" PRIMARY KEY ("id")
);

-- DocumentComment: inline annotations with ProseMirror position anchoring
CREATE TABLE "document_comments" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "anchor_from" INTEGER,
    "anchor_to" INTEGER,
    "anchor_text" TEXT,
    "parent_id" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT NOT NULL DEFAULT 'user',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_comments_pkey" PRIMARY KEY ("id")
);

-- DocumentImage: patent figures with S3 storage
CREATE TABLE "document_images" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "s3_key" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "figure_num" INTEGER,
    "caption" TEXT NOT NULL DEFAULT '',
    "source_type" TEXT NOT NULL DEFAULT 'upload',
    "generation_meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_images_pkey" PRIMARY KEY ("id")
);

-- Unique constraints
CREATE UNIQUE INDEX "patent_documents_idea_id_key" ON "patent_documents"("idea_id");
CREATE UNIQUE INDEX "document_versions_document_id_version_num_key" ON "document_versions"("document_id", "version_num");

-- Indexes
CREATE INDEX "patent_documents_user_id_idx" ON "patent_documents"("user_id");
CREATE INDEX "document_versions_document_id_idx" ON "document_versions"("document_id");
CREATE INDEX "document_comments_document_id_idx" ON "document_comments"("document_id");
CREATE INDEX "document_images_document_id_idx" ON "document_images"("document_id");

-- Foreign keys
ALTER TABLE "patent_documents" ADD CONSTRAINT "patent_documents_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "ideas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "patent_documents" ADD CONSTRAINT "patent_documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "patent_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "document_comments" ADD CONSTRAINT "document_comments_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "patent_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "document_comments" ADD CONSTRAINT "document_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "document_comments" ADD CONSTRAINT "document_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "document_comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "document_images" ADD CONSTRAINT "document_images_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "patent_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "document_images" ADD CONSTRAINT "document_images_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
