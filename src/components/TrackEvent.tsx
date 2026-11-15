"use client";
import { useEffect } from "react";
import { track } from "@/lib/pixel";

/** Kirim satu event Meta Pixel saat komponen tampil. */
export function TrackEvent({ event, params }: { event: string; params?: Record<string, unknown> }) {
  const key = JSON.stringify(params ?? {});
  useEffect(() => {
    track(event, JSON.parse(key));
  }, [event, key]);
  return null;
}
