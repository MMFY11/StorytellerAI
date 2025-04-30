import { NextRequest, NextResponse } from "next/server";
import { GPTScript } from "@gptscript-ai/gptscript";
import connection from "@/lib/db";
import type { OkPacket } from "mysql2";

export async function POST(request: NextRequest) {
  try {
    const { story, pages, userId } = await request.json();

    if (!story || !pages || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Build a properly quoted CLI string:
    // Escape any internal quotes in `story`
    const safeStory = story.replace(/"/g, '\\"');
    const cliInput = `--story "${safeStory}" --pages ${pages}`;

    const gpt = new GPTScript({ APIKey: process.env.OPENAI_API_KEY! });
    const run = await gpt.run(
      "app/api/run-script/story-book.gpt",
      { disableCache: true, input: cliInput }
    );

    // Read the JSON back from the tool
    const raw = await run.text();
    const output = JSON.parse(raw) as {
      title: string;
      pages: { text: string; imageUrl: string }[];
    };

    // 1) Insert the story record
    const [storyResult] = await connection.query<OkPacket>(
      `INSERT INTO stories (topic, name, number_of_pages, date, user_id)
       VALUES (?, ?, ?, ?, ?)`,
      [story, output.title, pages, new Date(), userId]
    );
    const storyId = storyResult.insertId;

    // 2) Insert each page & its image URL
    for (let i = 0; i < output.pages.length; i++) {
      const pg = output.pages[i];
      const [pageResult] = await connection.query<OkPacket>(
        `INSERT INTO pages (story_id, page_number, text)
         VALUES (?, ?, ?)`,
        [storyId, i + 1, pg.text]
      );
      const pageId = pageResult.insertId;

      await connection.query<OkPacket>(
        `INSERT INTO images (page_id, url) VALUES (?, ?)`,
        [pageId, pg.imageUrl]
      );
    }

    return NextResponse.json({ success: true, storyId });
  } catch (err) {
    console.error("Error in run-script route:", err);
    return NextResponse.json(
      { error: "Failed to generate story" },
      { status: 500 }
    );
  }
}
