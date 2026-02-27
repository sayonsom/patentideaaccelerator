import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

// ─── S3 Client ──────────────────────────────────────────────────────

const REGION = process.env.AWS_REGION || "us-east-1";
const BUCKET = process.env.AWS_S3_BUCKET || "patent-ideator-uploads";

const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

// ─── Helpers ────────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function buildS3Url(key: string): string {
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
}

// ─── POST: Upload image ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid multipart form data" },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  const documentId = formData.get("documentId");
  const caption = (formData.get("caption") as string) || "";
  const figureNumRaw = formData.get("figureNum");

  // ── Validate inputs ──────────────────────────────────────────────

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "Missing required field: file" },
      { status: 400 }
    );
  }

  if (!documentId || typeof documentId !== "string") {
    return NextResponse.json(
      { error: "Missing required field: documentId" },
      { status: 400 }
    );
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: `Unsupported file type: ${file.type}. Allowed: PNG, JPEG, WebP` },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File exceeds maximum size of 10 MB" },
      { status: 400 }
    );
  }

  // ── Verify document ownership ────────────────────────────────────

  const document = await prisma.patentDocument.findUnique({
    where: { id: documentId },
    select: { id: true, userId: true },
  });

  if (!document) {
    return NextResponse.json(
      { error: "Document not found" },
      { status: 404 }
    );
  }

  if (document.userId !== userId) {
    return NextResponse.json(
      { error: "You do not own this document" },
      { status: 403 }
    );
  }

  // ── Determine figure number ──────────────────────────────────────

  let figureNum: number | null = null;

  if (figureNumRaw !== null && figureNumRaw !== undefined && figureNumRaw !== "") {
    const parsed = parseInt(String(figureNumRaw), 10);
    if (!isNaN(parsed) && parsed >= 1) {
      figureNum = parsed;
    }
  }

  // If no explicit figure number, auto-assign based on current max
  if (figureNum === null) {
    const maxResult = await prisma.documentImage.aggregate({
      where: { documentId },
      _max: { figureNum: true },
    });
    figureNum = (maxResult._max.figureNum ?? 0) + 1;
  }

  // ── Upload to S3 ─────────────────────────────────────────────────

  const fileId = randomUUID();
  const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const s3Key = `patent-documents/${documentId}/${fileId}-${sanitizedFilename}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: s3Key,
        Body: buffer,
        ContentType: file.type,
        CacheControl: "max-age=31536000",
      })
    );
  } catch (err) {
    console.error("S3 upload failed:", err);
    return NextResponse.json(
      { error: "Failed to upload file to storage" },
      { status: 500 }
    );
  }

  // ── Create database record ───────────────────────────────────────

  const image = await prisma.documentImage.create({
    data: {
      documentId,
      userId,
      filename: file.name,
      s3Key,
      mimeType: file.type,
      sizeBytes: file.size,
      figureNum,
      caption,
      sourceType: "upload",
    },
  });

  return NextResponse.json(
    {
      id: image.id,
      url: buildS3Url(s3Key),
      filename: image.filename,
      figureNum: image.figureNum,
      caption: image.caption,
      mimeType: image.mimeType,
      sizeBytes: image.sizeBytes,
      sourceType: image.sourceType,
      createdAt: image.createdAt.toISOString(),
    },
    { status: 201 }
  );
}

// ─── GET: List images for a document ────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const documentId = searchParams.get("documentId");

  if (!documentId) {
    return NextResponse.json(
      { error: "Missing required query parameter: documentId" },
      { status: 400 }
    );
  }

  // Verify the user has access to this document
  const document = await prisma.patentDocument.findUnique({
    where: { id: documentId },
    select: { id: true, userId: true },
  });

  if (!document) {
    return NextResponse.json(
      { error: "Document not found" },
      { status: 404 }
    );
  }

  if (document.userId !== session.user.id) {
    return NextResponse.json(
      { error: "You do not own this document" },
      { status: 403 }
    );
  }

  const images = await prisma.documentImage.findMany({
    where: { documentId },
    orderBy: [{ figureNum: "asc" }, { createdAt: "asc" }],
  });

  const result = images.map((img) => ({
    id: img.id,
    documentId: img.documentId,
    userId: img.userId,
    filename: img.filename,
    s3Key: img.s3Key,
    mimeType: img.mimeType,
    sizeBytes: img.sizeBytes,
    figureNum: img.figureNum,
    caption: img.caption,
    sourceType: img.sourceType,
    generationMeta: img.generationMeta,
    createdAt: img.createdAt.toISOString(),
    url: buildS3Url(img.s3Key),
  }));

  return NextResponse.json(result);
}
