import type { Metadata } from "next";
import JobDetailClient from "./JobDetailClient";

export const metadata: Metadata = {
  title: "Job Detail",
};

export default function Page({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  return <JobDetailClient params={params} />;
}