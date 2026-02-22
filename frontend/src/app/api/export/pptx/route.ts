import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getIdeaAction } from "@/lib/actions/ideas";
import { generatePatentPptx } from "@/lib/export-pptx";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ideaId } = await req.json();
  const idea = await getIdeaAction(ideaId);

  if (!idea || idea.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const blob = await generatePatentPptx(idea);
  const buffer = Buffer.from(await blob.arrayBuffer());

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename="${(idea.title || "patent-disclosure").replace(/[^a-zA-Z0-9-_ ]/g, "")}.pptx"`,
    },
  });
}
