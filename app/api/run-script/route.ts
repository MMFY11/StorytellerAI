// app/api/run-script/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { GPTScript } from "@gptscript-ai/gptscript";
import connection from "@/lib/db";
import type { OkPacket } from "mysql2";

export async function POST(request: Request) {
  // 1) auth check
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2) parse + validate
  const { prompt: story, pages, style } = await request.json();
  if (!story || typeof pages !== "number"  || typeof style !== "string") {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  // 3) run your .gpt template via GPTScript
  //    we pass it exactly what you did in repo: --story and --pages
  const safeStory = story.replace(/"/g, '\\"');
   const cliInput =
    `--story "${safeStory}" ` +
    `--pages ${pages} ` +
    `--style "${style}"`;
  const gpt = new GPTScript({ APIKey: process.env.OPENAI_API_KEY! });
  const run = await gpt.run(
    "app/api/run-script/story-book.gpt",
    { disableCache: true, input: cliInput }
  );
  const raw = await run.text();
  const output = JSON.parse(raw) as {
    title: string;
    pages: { text: string; imageUrl: string }[];
  };

  // 4) insert into `stories`
  const [storyResult] = await connection.query<OkPacket>(
    `INSERT INTO stories (topic, name, number_of_pages, date, user_id)
     VALUES (?, ?, ?, NOW(), ?)`,
    [story, output.title, pages, session.user.id]
  );
  const storyId = (storyResult as any).insertId as number;

  // 5) insert each page + its image
  for (let i = 0; i < output.pages.length; i++) {
    const pg = output.pages[i];

    // insert page text
    const [pageResult] = await connection.query<OkPacket>(
      `INSERT INTO pages (story_id, page_number, text)
       VALUES (?, ?, ?)`,
      [storyId, i + 1, pg.text]
    );
    const pageId = (pageResult as any).insertId as number;

    // insert image URL
    await connection.query<OkPacket>(
      `INSERT INTO images (page_id, url)
       VALUES (?, ?)`,
      [pageId, pg.imageUrl]
    );
  }

  // 6) return only once everything is done
  return NextResponse.json({ success: true, storyId });
}
