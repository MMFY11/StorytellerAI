import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import db from "@/lib/db";

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "creator") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { storyId } = await req.json();

  if (!storyId) {
    return NextResponse.json({ error: "Missing storyId" }, { status: 400 });
  }

  // Delete story, pages, and images
  await db.execute("DELETE FROM images WHERE page_id IN (SELECT id FROM pages WHERE story_id = ?)", [storyId]);
  await db.execute("DELETE FROM pages WHERE story_id = ?", [storyId]);
  await db.execute("DELETE FROM comments WHERE story_id = ?", [storyId]);
  await db.execute("DELETE FROM ratings WHERE story_id = ?", [storyId]);
  await db.execute("DELETE FROM stories WHERE id = ?", [storyId]);

  return NextResponse.json({ success: true });
}
