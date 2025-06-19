// app/api/tts/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  const { text } = await request.json();
  if (!text) {
    return NextResponse.json(
      { error: "Text is required" },
      { status: 400 }
    );
  }

  try {
    
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",           
      voice: "alloy",           
      input: text,
    });
    
    const buffer = Buffer.from(await mp3.arrayBuffer());

    
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (error) {
    console.error("Error generating speech:", error);
    return NextResponse.json(
      { error: "Failed to generate speech" },
      { status: 500 }
    );
  }
}
