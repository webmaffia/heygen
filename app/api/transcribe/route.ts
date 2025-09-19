import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing DEEPGRAM_API_KEY" }, { status: 500 });
    }

    const contentType = req.headers.get("content-type") || "audio/webm";
    const arrayBuffer = await req.arrayBuffer();

    const dgRes = await fetch("https://api.deepgram.com/v1/listen", {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": contentType,
      },
      body: arrayBuffer,
    });

    if (!dgRes.ok) {
      const text = await dgRes.text();
      return NextResponse.json({ error: "Deepgram error", details: text }, { status: dgRes.status });
    }

    const json = await dgRes.json();
    return NextResponse.json(json);
  } catch (err: any) {
    return NextResponse.json({ error: "Transcription failed", details: err?.message || String(err) }, { status: 500 });
  }
}


