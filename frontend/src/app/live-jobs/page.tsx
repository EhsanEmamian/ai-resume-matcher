import type { Metadata } from "next";
import LiveJobsClient from "./LiveJobsClient";

export const metadata: Metadata = {
  title: "Live Search",
};

export default function Page() {
  return <LiveJobsClient />;
}