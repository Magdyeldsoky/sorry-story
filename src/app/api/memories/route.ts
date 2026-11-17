import { NextResponse } from "next/server";

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SHEET_API_URL;
    if (!url) return NextResponse.json([]);

    const res = await fetch(url, { cache: "no-store", redirect: "follow" });
    const text = await res.text();

    try {
      return NextResponse.json(JSON.parse(text));
    } catch {
      console.error("Sheet API did not return JSON:", text.slice(0, 200));
      return NextResponse.json([]);
    }
  } catch (err) {
    console.error("Memories route error:", err);
    return NextResponse.json([]);
  }
}