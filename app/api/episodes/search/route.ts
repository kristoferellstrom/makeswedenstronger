import { NextResponse } from "next/server";

import { searchEpisodeListItems } from "@/lib/episodes";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") ?? "";
  const episodes = await searchEpisodeListItems(query);

  return NextResponse.json({ episodes });
}
