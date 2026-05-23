import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Skeleton, SkeletonCard } from "@/components/Skeleton";

export default function LiveJobsFallback() {
  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#0B1120] px-6 py-12 text-slate-100">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#111827] px-5 py-4">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500 animate-pulse"
              aria-hidden
            />
            <p className="font-mono text-sm tracking-wide text-slate-300">
              Loading jobs…
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#111827] p-8 shadow-sm">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="mt-4 h-10 w-72" />
            <Skeleton className="mt-4 h-5 w-2/3" />
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#111827] p-6 shadow-sm">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="mt-4 h-12 w-full" />
            <Skeleton className="mt-4 h-12 w-full" />
          </div>

          <SkeletonCard />
          <SkeletonCard />
        </div>
      </main>

      <Footer />
    </>
  );
}
