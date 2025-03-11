"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface BettingNavigationProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

const categories = [
  { id: "game-lines", name: "GAME LINES" },
  { id: "player-points", name: "PLAYER POINTS" },
  { id: "player-combos", name: "PLAYER COMBOS" },
  { id: "player-rebounds", name: "PLAYER REBOUNDS" },
  { id: "player-assists", name: "PLAYER ASSISTS" },
  { id: "player-threes", name: "PLAYER THREES" },
  { id: "quick-hits", name: "QUICK HITS" },
  { id: "quarters", name: "QUARTERS" },
  { id: "first-basket", name: "FIRST BASKET" },
];

export default function BettingNavigation({
  selectedCategory,
  onSelectCategory,
}: BettingNavigationProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="relative flex items-center w-full bg-background border-y">
      <button
        onClick={() => scroll("left")}
        className="flex-none p-2 hover:bg-accent"
        aria-label="Scroll left"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-x-auto scrollbar-hide"
      >
        <div className="flex min-w-max px-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className={cn(
                "px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                selectedCategory === category.id
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => scroll("right")}
        className="flex-none p-2 hover:bg-accent"
        aria-label="Scroll right"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
