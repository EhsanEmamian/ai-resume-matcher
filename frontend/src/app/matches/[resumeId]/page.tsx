import type { Metadata } from "next";
import MatchesClient from "./MatchesClient";

export const metadata: Metadata = {
  title: "Job Matches",
};

export default function Page({
  params,
}: {
  params: Promise<{ resumeId: string }>;
}) {
  return <MatchesClient params={params} />;
}