"use client";

import Link from "next/link";
import { BackgroundLines } from "@/components/ui/background-lines";
import Header from "@/components/Header";
import { NBAPlayerProps } from "@/components/player-props/nba/playerpoints";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default function Home() {
  return (
    <div className="space-y-16">
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <BackgroundLines className="flex items-center justify-center w-full flex-col px-4">
          <h2 className="bg-clip-text text-transparent text-center bg-gradient-to-b from-black to-gray-300 dark:from-white dark:to-gray-300 text-4xl md:text-5xl lg:text-7xl font-sans py-2 md:py-10 relative z-20 font-bold tracking-tight">
            Compare. Analyze. <br /> Win Big.
          </h2>
        </BackgroundLines>
      </section>

      <section className="">
        <ThemeSwitcher />
        <NBAPlayerProps />
      </section>
    </div>
  );
}
