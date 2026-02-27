import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import type { Prisma } from "@prisma/client";

// ─── Configuration ──────────────────────────────────────────────────

const PAPERBANANA_URL =
  process.env.PAPERBANANA_SERVICE_URL || "http://localhost:8001";

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

function buildS3Url(key: string): string {
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
}

interface DiagramRequestBody {
  documentId: string;
  sourceContext: string;
  communicativeIntent: string;
  diagramType?: string;
  style?: string;
  mode: "generate" | "convert_sketch";
  sketchImageBase64?: string;
  description?: string;
}

interface PaperBananaGenerateResponse {
  image_url: string;
  image_id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  metadata: Record<string, unknown>;
}

// ─── POST: Generate or convert diagram via PaperBanana ──────────────

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Read the Gemini API key from request header
  const geminiKey = req.headers.get("x-gemini-key") || undefined;

  let body: DiagramRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { documentId, sourceContext, communicativeIntent, diagramType, style, mode } = body;

  // ── Validate required fields ─────────────────────────────────────

  if (!documentId) {
    return NextResponse.json(
      { error: "Missing required field: documentId" },
      { status: 400 }
    );
  }

  if (!sourceContext) {
    return NextResponse.json(
      { error: "Missing required field: sourceContext" },
      { status: 400 }
    );
  }

  if (!communicativeIntent) {
    return NextResponse.json(
      { error: "Missing required field: communicativeIntent" },
      { status: 400 }
    );
  }

  if (!mode || (mode !== "generate" && mode !== "convert_sketch")) {
    return NextResponse.json(
      { error: "mode must be 'generate' or 'convert_sketch'" },
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

  // ── Call PaperBanana service ──────────────────────────────────────

  let pbResponse: Response;
  let imageBytes: Buffer;
  let pbData: PaperBananaGenerateResponse;

  try {
    if (mode === "generate") {
      // Call the generate endpoint
      pbResponse = await fetch(`${PAPERBANANA_URL}/api/v1/diagrams/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_context: sourceContext,
          communicative_intent: communicativeIntent,
          diagram_type: diagramType || "methodology",
          style: style || "patent_bw",
          gemini_api_key: geminiKey || null,
        }),
      });

      if (!pbResponse.ok) {
        const errorText = await pbResponse.text();
        console.error("PaperBanana generate error:", pbResponse.status, errorText);
        return NextResponse.json(
          { error: `Diagram generation failed: ${errorText}` },
          { status: pbResponse.status >= 500 ? 502 : pbResponse.status }
        );
      }

      pbData = await pbResponse.json();

      // Fetch the generated image from PaperBanana
      const imageResponse = await fetch(
        `${PAPERBANANA_URL}/api/v1/diagrams/${pbData.image_id}`
      );
      if (!imageResponse.ok) {
        return NextResponse.json(
          { error: "Failed to retrieve generated image from diagram service" },
          { status: 502 }
        );
      }
      const arrayBuffer = await imageResponse.arrayBuffer();
      imageBytes = Buffer.from(arrayBuffer);

    } else {
      // mode === "convert_sketch"
      if (!body.sketchImageBase64) {
        return NextResponse.json(
          { error: "Missing required field: sketchImageBase64 for convert_sketch mode" },
          { status: 400 }
        );
      }

      // Decode base64 sketch to send as multipart
      const sketchBuffer = Buffer.from(body.sketchImageBase64, "base64");

      // Build multipart form data for PaperBanana convert-sketch endpoint
      const formData = new FormData();
      const sketchBlob = new Blob([sketchBuffer], { type: "image/png" });
      formData.append("file", sketchBlob, "sketch.png");
      formData.append("description", body.description || sourceContext);
      if (geminiKey) {
        formData.append("gemini_api_key", geminiKey);
      }

      pbResponse = await fetch(
        `${PAPERBANANA_URL}/api/v1/diagrams/convert-sketch`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!pbResponse.ok) {
        const errorText = await pbResponse.text();
        console.error("PaperBanana convert-sketch error:", pbResponse.status, errorText);
        return NextResponse.json(
          { error: `Sketch conversion failed: ${errorText}` },
          { status: pbResponse.status >= 500 ? 502 : pbResponse.status }
        );
      }

      pbData = await pbResponse.json();

      // Fetch the converted image from PaperBanana
      const imageResponse = await fetch(
        `${PAPERBANANA_URL}/api/v1/diagrams/${pbData.image_id}`
      );
      if (!imageResponse.ok) {
        return NextResponse.json(
          { error: "Failed to retrieve converted image from diagram service" },
          { status: 502 }
        );
      }
      const arrayBuffer = await imageResponse.arrayBuffer();
      imageBytes = Buffer.from(arrayBuffer);
    }
  } catch (err) {
    console.error("PaperBanana service call failed:", err);
    return NextResponse.json(
      { error: "Failed to connect to diagram generation service" },
      { status: 502 }
    );
  }

  // ── Upload resulting image to S3 ─────────────────────────────────

  const fileId = randomUUID();
  const filename = pbData.filename || `patent-diagram-${fileId.slice(0, 8)}.png`;
  const s3Key = `patent-documents/${documentId}/${fileId}-${filename}`;

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: s3Key,
        Body: imageBytes,
        ContentType: pbData.mime_type || "image/png",
        CacheControl: "max-age=31536000",
      })
    );
  } catch (err) {
    console.error("S3 upload failed:", err);
    return NextResponse.json(
      { error: "Failed to upload generated image to storage" },
      { status: 500 }
    );
  }

  // ── Auto-assign figure number ────────────────────────────────────

  const maxResult = await prisma.documentImage.aggregate({
    where: { documentId },
    _max: { figureNum: true },
  });
  const figureNum = (maxResult._max.figureNum ?? 0) + 1;

  // ── Create database record ───────────────────────────────────────

  const sourceType = mode === "generate" ? "generated" : "sketch_converted";

  const image = await prisma.documentImage.create({
    data: {
      documentId,
      userId,
      filename,
      s3Key,
      mimeType: pbData.mime_type || "image/png",
      sizeBytes: imageBytes.length,
      figureNum,
      caption: communicativeIntent,
      sourceType,
      generationMeta: {
        mode,
        diagramType: diagramType || "methodology",
        style: style || "patent_bw",
        sourceContext,
        communicativeIntent,
        paperBananaImageId: pbData.image_id,
        paperBananaMetadata: pbData.metadata as Prisma.JsonObject,
      } satisfies Prisma.JsonObject,
    },
  });

  return NextResponse.json(
    {
      id: image.id,
      documentId: image.documentId,
      userId: image.userId,
      filename: image.filename,
      s3Key: image.s3Key,
      mimeType: image.mimeType,
      sizeBytes: image.sizeBytes,
      figureNum: image.figureNum,
      caption: image.caption,
      sourceType: image.sourceType,
      generationMeta: image.generationMeta,
      createdAt: image.createdAt.toISOString(),
      url: buildS3Url(s3Key),
    },
    { status: 201 }
  );
}
