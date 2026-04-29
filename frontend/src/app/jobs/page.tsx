import type { Metadata } from "next";
import JobsClient from "./JobsClient";

export const metadata: Metadata = {
  title: "Saved Jobs",
};

export default function Page() {
  return <JobsClient />;
}