// app/api/translate/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: Request) {
  try {
    const { text, to } = await request.json();
    if (!text || !to) {
      return NextResponse.json(
        { error: "Both `text` and `to` are required" },
        { status: 400 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Translate the following text _only_ into _${to}_ without adding anything else:`,
        },
        { role: "user", content: text },
      ],
    });

    // safely trim only if content exists
    const translated =
      completion.choices?.[0]?.message?.content
        ?.trim()
      ?? "";

    return NextResponse.json({ translated });
  } catch (err: any) {
    console.error("translate error", err);
    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
