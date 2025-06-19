import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

export async function POST(req: NextRequest) {
  try {
    const { storyId, pageNumber, newText } = await req.json();

    if (!storyId || !pageNumber || !newText) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    await connection.execute(
      "UPDATE pages SET text = ? WHERE story_id = ? AND page_number = ?",
      [newText, storyId, pageNumber]
    );

    await connection.end();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving edited page:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
