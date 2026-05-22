import LandingHeader from "@/components/LandingHeader";

export default function Loading() {
  return (
    <div className="min-h-screen bg-green-100 text-green-950">
      <LandingHeader surface="light" />
      <main className="mx-auto max-w-7xl px-6 py-28">
        <div className="h-10 w-56 animate-pulse rounded-lg bg-black/10" />
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="h-[430px] animate-pulse rounded-lg border border-black/10 bg-white" />
            <div className="h-24 animate-pulse rounded-lg border border-black/10 bg-white" />
            <div className="h-72 animate-pulse rounded-lg border border-black/10 bg-white" />
          </div>
          <div className="h-80 animate-pulse rounded-lg border border-black/10 bg-white" />
        </div>
      </main>
    </div>
  );
}
