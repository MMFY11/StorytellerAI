// app/api/ratings/route.ts
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

  // Run the query and cast rows to any[]
  const [statsRows] = await db.query(
    `SELECT AVG(score) AS average, COUNT(*) AS count
     FROM ratings
     WHERE story_id = ?`,
    [storyId]
  );
  const stats = (statsRows as any[])[0] as { average: number | null; count: number };

  // Fetch this user's own rating if logged in
  let userRating: number | null = null;
  const session = await getServerSession(authOptions);
  if (session) {
    const [userRows] = await db.query(
      `SELECT score
       FROM ratings
       WHERE story_id = ? AND user_id = ?`,
      [storyId, session.user.id]
    );
    const user = (userRows as any[])[0] as { score: number } | undefined;
    userRating = user?.score ?? null;
  }

  return NextResponse.json({
    average:    stats.average ?? 0,
    count:      stats.count,
    userRating,
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { storyId, score } = await request.json();
  if (!storyId || typeof score !== "number") {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  // Upsert the rating
  const [existingRows] = await db.query(
    `SELECT id
     FROM ratings
     WHERE story_id = ? AND user_id = ?`,
    [storyId, session.user.id]
  );
  const existing = (existingRows as any[])[0] as { id: number } | undefined;

  if (existing) {
    await db.execute(
      `UPDATE ratings SET score = ? WHERE id = ?`,
      [score, existing.id]
    );
  } else {
    await db.execute(
      `INSERT INTO ratings (user_id, story_id, score) VALUES (?, ?, ?)`,
      [session.user.id, storyId, score]
    );
  }

  // Return updated stats
  const [newStatsRows] = await db.query(
    `SELECT AVG(score) AS average, COUNT(*) AS count
     FROM ratings
     WHERE story_id = ?`,
    [storyId]
  );
  const newStats = (newStatsRows as any[])[0] as { average: number | null; count: number };

  return NextResponse.json({
    average:    newStats.average ?? 0,
    count:      newStats.count,
    userRating: score,
  });
}
