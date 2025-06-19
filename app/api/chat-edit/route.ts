import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import OpenAI from "openai";

// Protect API access with auth
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "creator") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { originalText, instruction } = await req.json();

  if (!originalText || !instruction) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are an assistant helping rewrite a children's story page. Always keep it child-appropriate and aligned with the original style.",
        },
        {
          role: "user",
          content: `Original: "${originalText}"\nInstruction: "${instruction}"\n\nPlease rewrite accordingly.`,
        },
      ],
      temperature: 0.7,
    });

    const edited = completion.choices[0].message.content?.trim();

    if (!edited) {
      return NextResponse.json({ error: "Empty response from AI" }, { status: 500 });
    }

    return NextResponse.json({ edited });
  } catch (error) {
    console.error("Chat edit error:", error);
    return NextResponse.json({ error: "OpenAI API failed" }, { status: 500 });
  }
}
