"use client";

import { useEffect, useState } from "react";
import { getDiscoveryStatus } from "@/lib/api";
import { updateParsedResumeMatchCount } from "@/lib/heroState";

const POLL_INTERVAL_MS = 1500;
const MAX_ATTEMPTS = 20;

function isTerminalStatus(status: string): boolean {
  return status === "ready" || status === "failed";
}

export function useDiscoveryStatus(resumeId: string) {
  const [status, setStatus] = useState<string>("pending");
  const [matchCount, setMatchCount] = useState(0);

  useEffect(() => {
    if (!resumeId) {
      return;
    }

    let cancelled = false;
    let attempts = 0;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const clearPolling = () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    async function poll() {
      if (cancelled || attempts >= MAX_ATTEMPTS) {
        clearPolling();
        return;
      }

      attempts += 1;

      try {
        const result = await getDiscoveryStatus(resumeId);
        if (cancelled) {
          return;
        }

        setStatus(result.status);
        setMatchCount(result.match_count);

        if (result.status === "ready") {
          updateParsedResumeMatchCount(resumeId, result.match_count);
        }

        if (isTerminalStatus(result.status)) {
          clearPolling();
        }
      } catch {
        if (attempts >= MAX_ATTEMPTS) {
          clearPolling();
        }
      }
    }

    void poll();
    intervalId = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearPolling();
    };
  }, [resumeId]);

  return { status, matchCount };
}
