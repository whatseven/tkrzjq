"use client";

import Globe from "@/components/ui/globe";
import ShinyButton from "@/components/ui/shiny-button";
import FlipText from "@/components/ui/flip-text";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();

  return (
    <div className="relative">
      <Globe className="absolute inset-0 z-0 translate-y-10" />
      <div className="relative z-10 flex flex-col items-center justify-end h-screen pb-20">
        <FlipText word="田可爱工作" className="text-3xl mb-6" />
        <ShinyButton className="mb-4 text-lg px-8 py-3" onClick={() => router.push("/list-comparison")}>
          名单对比
        </ShinyButton>
        <ShinyButton className="text-lg px-8 py-3" onClick={() => router.push("/auto-seating")}>
          自动排座
        </ShinyButton>
      </div>
    </div>
  );
}
