import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../lib/supabase";

// Patterns that indicate junk articles that shouldn't be on a serious tech intelligence platform
const JUNK_HEADLINE_PATTERNS = [
  /charging cable/i, /power bank/i, /phone case/i, /screen protector/i,
  /art book/i, /cookbook/i, /zelda.*secrets/i,
  /percent off/i, /on sale/i, /fire sale/i, /deal/i, /save \$/i,
  /anker.*sale/i, /amazon.*deal/i, /amazon.*sale/i,
  /patch notes/i, /patch \d+/i, /skin bundle/i, /TFT patch/i,
  /game pass.*perk/i, /fanta partnership/i, /pikmin/i,
  /motion sickness.*sound/i, /hearapy/i,
  /doesn.t belong here/i, /this story doesn/i,
  /signals nothing/i, /misses the real/i,
  /long strange trip/i, /chicago.*artist/i,
  /kidnapped in iraq/i,
  /belarus.*russia.*union/i,
  /evercade/i, /retro handheld/i,
];

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-api-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch all articles
    const { data: articles } = await supabaseAdmin
      .from("articles")
      .select("id, headline, slug");

    if (!articles) {
      return NextResponse.json({ deleted: 0, message: "No articles found" });
    }

    const toDelete: string[] = [];

    for (const article of articles) {
      const isJunk = JUNK_HEADLINE_PATTERNS.some((p) =>
        p.test(article.headline)
      );
      if (isJunk) {
        toDelete.push(article.id);
      }
    }

    if (toDelete.length > 0) {
      const { error } = await supabaseAdmin
        .from("articles")
        .delete()
        .in("id", toDelete);

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      deleted: toDelete.length,
      total: articles.length,
      remaining: articles.length - toDelete.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Cleanup failed" },
      { status: 500 }
    );
  }
}
