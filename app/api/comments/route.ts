import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import db from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const storyId = searchParams.get("storyId");
  if (!storyId) {
    return NextResponse.json({ error: "Missing storyId" }, { status: 400 });
  }

  const [rows] = await db.query(
    `SELECT c.id,
            c.user_id    AS userId,
            u.name       AS userName,
            c.text,
            c.date
     FROM comments c
     JOIN users u ON u.id = c.user_id
     WHERE c.story_id = ?
     ORDER BY c.date DESC`,
    [storyId]
  );

  const comments = (rows as any[]).map((r) => ({
    id:       r.id,
    userId:   r.userId,
    userName: r.userName,
    text:     r.text,
    date:     (r.date as Date).toISOString(),
  }));

  return NextResponse.json(comments);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { storyId, text } = await request.json();
  if (!storyId || !text) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  await db.execute(
    `INSERT INTO comments (user_id, story_id, text, date)
     VALUES (?, ?, ?, ?)`,
    [session.user.id, storyId, text, new Date()]
  );

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { commentId } = await request.json();
  if (!commentId) {
    return NextResponse.json({ error: "Missing commentId" }, { status: 400 });
  }

  await db.execute(
    `DELETE FROM comments
     WHERE id = ? AND user_id = ?`,
    [commentId, session.user.id]
  );

  return NextResponse.json({ success: true });
}
