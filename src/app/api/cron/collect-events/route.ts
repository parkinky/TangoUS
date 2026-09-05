import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
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
type ScrapedEvent = z.infer<typeof ScrapedEventSchema>;

// The model doesn't render the Korean title identically across runs (e.g.
// "우토피아 엔쿠엔트로" vs "유토피아 엔쿠엔트로", or a suffix like "(BTFM)"
// appearing only sometimes), so matching on title_ko + start_date lets the
// same real-world event get inserted again and again. Prefer the source
// URL when we have one — it's the most stable identifier a scrape can
// produce — and fall back to city + state + date range, since it's very
// unlikely two distinct tango events start and end on the exact same days
// in the exact same city.
async function findExistingEvent(
  supabase: SupabaseClient,
  event: ScrapedEvent
): Promise<{ id: string } | null> {
  if (event.website_url) {
    const { data } = await supabase
      .from("events")
      .select("id")
      .eq("website_url", event.website_url)
      .eq("start_date", event.start_date)
      .maybeSingle();
    if (data) return data;
  }

  const { data } = await supabase
    .from("events")
    .select("id")
    .eq("city", event.city)
    .eq("state", event.state)
    .eq("start_date", event.start_date)
    .eq("end_date", event.end_date ?? event.start_date)
    .maybeSingle();

  return data;
}

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

async function searchForEvents(today: string): Promise<ParsedSearchResult> {
  const client = new Anthropic();

  const prompt = `오늘은 ${today}입니다. 웹 검색 도구를 사용해서 오늘 이후로 미국에서 열리는 아르헨티나 탱고 엔쿠엔트로, 밀롱가, 마라톤, 페스티벌 정보를 최대한 찾아주세요.

- 답변하기 전에 반드시 web_search 도구를 여러 번 호출해서 실제로 검색하세요. 검색 없이 아는 정보만으로 답하거나 빈 결과를 반환하지 마세요.
- 다음 도시들 각각에 대해 최소 한 번 이상 검색하세요: 뉴욕, 보스턴, 로스앤젤레스, 샌프란시스코, 시애틀, 포틀랜드, 밴쿠버, 샌디에고, 시카고, 뉴올리언스, 마이애미. (단, 이 도시들 외 지역의 행사도 발견되면 포함하세요.)
- 이미 지난 행사는 제외하고, 오늘부터 앞으로 몇 달 내에 열리는 행사만 포함하세요.
- 각 항목의 제목과 설명은 원문(영어)과 한국어 번역을 함께 제공하세요.
- 확실하지 않은 정보(정확한 주소, 가격 등)는 null로 남기고, 추측해서 채우지 마세요.
- 정확한 날짜(YYYY-MM-DD)를 알 수 없는 행사는 결과에 포함하지 마세요.`;

  let messages: Anthropic.MessageParam[] = [{ role: "user", content: prompt }];

  for (let attempt = 0; attempt < 10; attempt++) {
    const response = await client.messages.parse({
      model: "claude-haiku-4-5",
      max_tokens: 8000,
      tools: [
        {
          type: "web_search_20260209",
          name: "web_search",
          max_uses: 10,
          allowed_callers: ["direct"],
        },
      ],
      output_config: {
        format: zodOutputFormat(SearchResultSchema),
      },
      tool_choice: attempt === 0 ? { type: "tool", name: "web_search" } : { type: "auto" },
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

    const existing = await findExistingEvent(supabase, event);

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
