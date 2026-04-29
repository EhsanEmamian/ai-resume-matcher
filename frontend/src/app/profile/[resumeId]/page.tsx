import type { Metadata } from "next";
import ProfileClient from "./ProfileClient";

export const metadata: Metadata = {
  title: "Resume Profile",
};

export default function Page({
  params,
}: {
  params: Promise<{ resumeId: string }>;
}) {
  return <ProfileClient params={params} />;
}