"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { nflMarkets, NFLMarkets } from "@/app/utils/nflMarkets";

interface BettingNavigationProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

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

  const categories = Object.keys(nflMarkets);

  const renderSubcategories = (category: string) => {
    const subcategories = nflMarkets[category as keyof NFLMarkets];
    if (!subcategories || Array.isArray(subcategories)) {
      return null; // No subcategories for this category
    }
    return (
      <div className="flex overflow-x-auto scrollbar-hide py-2">
        {Object.entries(subcategories).map(([subCategory, markets]) => (
          <button
            key={subCategory}
            onClick={() => onSelectCategory(`${category}-${subCategory}`)}
            className="px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors hover:text-primary"
          >
            {subCategory}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="relative flex flex-col w-full bg-background border-y">
      <div className="flex items-center">
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
                key={category}
                onClick={() => onSelectCategory(category)}
                className={cn(
                  "px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                  selectedCategory === category
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {category.toUpperCase()}
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

      {selectedCategory && renderSubcategories(selectedCategory)}
    </div>
  );
}
