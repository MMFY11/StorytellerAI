import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  const { text, language } = await request.json();

  if (!text || !language) {
    return NextResponse.json(
      { error: 'Text and language are required' },
      { status: 400 }
    );
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a professional translator. Translate the following text to ${language}. Keep the same tone, style, and formatting. Do not add any additional commentary or explanations.`
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.3
    });

    const translatedText = response.choices[0]?.message?.content;
    return NextResponse.json({ translatedText });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: 'Failed to translate text' },
      { status: 500 }
    );
  }
}