import type { Metadata } from "next";
import { Suspense } from "react";
import LiveJobsClient from "./LiveJobsClient";
import LiveJobsFallback from "./LiveJobsFallback";

export const metadata: Metadata = {
  title: "Live Search",
};

export default function Page() {
  return (
    <Suspense fallback={<LiveJobsFallback />}>
      <LiveJobsClient />
    </Suspense>
  );
}