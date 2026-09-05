import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

// Web search + a fairly long structured-output turn can take a while.
export const maxDuration = 300;

const EVENT_TYPES = ["event", "festival", "marathon", "milonga"] as const;

const ScrapedEventSchema = z.object({
  title_en: z.string().describe("Event title in its original (English) source language"),
  title_ko: z.string().describe("Korean translation of the title"),
  type: z.enum(EVENT_TYPES),
  city: z.string(),
  state: z.string().describe("US state, as a 2-letter abbreviation, e.g. TX"),
  venue: z.string().nullable().describe("Venue name, null if unknown"),
  address: z.string().nullable().describe("Street address, null if unknown"),
  start_date: z.string().describe("ISO date, YYYY-MM-DD"),
  end_date: z.string().nullable().describe("ISO date, YYYY-MM-DD, null if single-day"),
  price: z.string().nullable(),
  website_url: z.string().nullable(),
  description_en: z.string(),
  description_ko: z.string().describe("Korean translation of the description"),
});

const SearchResultSchema = z.object({
  events: z.array(ScrapedEventSchema),
});

type ParsedSearchResult = z.infer<typeof SearchResultSchema>;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

async function searchForEvents(today: string): Promise<ParsedSearchResult> {
  const client = new Anthropic();

  const prompt = `오늘은 ${today}입니다. 웹 검색 도구를 사용해서 오늘 이후로 미국에서 열리는 아르헨티나 탱고 이벤트, 밀롱가, 마라톤, 페스티벌 정보를 최대한 찾아주세요.

- 이미 지난 행사는 제외하고, 오늘부터 앞으로 몇 달 내에 열리는 행사만 포함하세요.
- 각 항목의 제목과 설명은 원문(영어)과 한국어 번역을 함께 제공하세요.
- 확실하지 않은 정보(정확한 주소, 가격 등)는 null로 남기고, 추측해서 채우지 마세요.
- 정확한 날짜(YYYY-MM-DD)를 알 수 없는 행사는 결과에 포함하지 마세요.`;

  let messages: Anthropic.MessageParam[] = [{ role: "user", content: prompt }];

  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await client.messages.parse({
      model: "claude-opus-5",
      max_tokens: 8000,
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 10 }],
      output_config: {
        format: zodOutputFormat(SearchResultSchema),
        effort: "high",
      },
      messages,
    });

    if (response.stop_reason === "pause_turn") {
      messages = [...messages, { role: "assistant", content: response.content }];
      continue;
    }

    if (!response.parsed_output) {
      throw new Error(`No parsed output (stop_reason: ${response.stop_reason})`);
    }

    return response.parsed_output;
  }

  throw new Error("Search did not complete after multiple pause_turn resumes");
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().slice(0, 10);

  let result: ParsedSearchResult;
  try {
    result = await searchForEvents(today);
  } catch (error) {
    console.error("collect-events: search failed", error);
    return NextResponse.json({ error: "Search failed" }, { status: 502 });
  }

  const supabase = createAdminClient();
  let inserted = 0;
  let skipped = 0;
  let failed = 0;

  for (const event of result.events) {
    if (event.start_date < today) continue;

    const { data: existing } = await supabase
      .from("events")
      .select("id")
      .eq("title_ko", event.title_ko)
      .eq("start_date", event.start_date)
      .maybeSingle();

    if (existing) {
      skipped++;
      continue;
    }

    const { error } = await supabase.from("events").insert({
      type: event.type,
      city: event.city,
      state: event.state,
      venue: event.venue,
      address: event.address,
      start_date: event.start_date,
      end_date: event.end_date ?? event.start_date,
      price: event.price,
      website_url: event.website_url,
      title_ko: event.title_ko,
      title_en: event.title_en,
      description_ko: event.description_ko,
      description_en: event.description_en,
      source: "auto_scraped",
      status: "pending",
    });

    if (error) {
      console.error("collect-events: insert failed", error);
      failed++;
    } else {
      inserted++;
    }
  }

  return NextResponse.json({
    found: result.events.length,
    inserted,
    skipped,
    failed,
  });
}
