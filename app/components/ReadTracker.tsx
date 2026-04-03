"use client";

import { useEffect } from "react";
import { useReadHistory } from "../hooks/useReadHistory";

export default function ReadTracker({
  slug,
  category,
  region,
}: {
  slug: string;
  category: string | null;
  region: string | null;
}) {
  const { trackRead } = useReadHistory();

  useEffect(() => {
    trackRead({ slug, category, region });
  }, [slug, category, region]);

  return null;
}
