"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Menu } from "lucide-react";

const features = [
  {
    name: "Prop Comparison",
    href: "/props",
    subItems: [
      { name: "NFL", href: "/props/nfl/compare" },
      { name: "NBA", href: "/props/nba/compare" },
      { name: "MLB", href: "/props/mlb/compare" },
      { name: "NHL", href: "/props/nhl/compare" },
    ],
  },
  {
    name: "Player Trends",
    href: "/trends",
    subItems: [
      { name: "NFL", href: "/trends/nfl" },
      { name: "NBA", href: "/trends/nba" },
      { name: "MLB", href: "/trends/mlb" },
      { name: "NHL", href: "/trends/nhl" },
    ],
  },
  {
    name: "Fantasy Projections",
    href: "/projections",
    subItems: [
      { name: "NFL", href: "/projections/nfl" },
      { name: "NBA", href: "/projections/nba" },
      { name: "MLB", href: "/projections/mlb" },
      { name: "NHL", href: "/projections/nhl" },
    ],
  },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px]">
        <nav className="flex flex-col gap-4">
          <Accordion type="single" collapsible className="w-full">
            {features.map((feature) => (
              <AccordionItem key={feature.name} value={feature.name}>
                <AccordionTrigger>{feature.name}</AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col space-y-2">
                    {feature.subItems.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="block py-2 px-4 rounded-md hover:bg-gray-100"
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <Link
            href="/about"
            onClick={() => setOpen(false)}
            className="block py-2 px-4 rounded-md hover:bg-gray-100"
          >
            About
          </Link>
          <Link
            href="/pricing"
            onClick={() => setOpen(false)}
            className="block py-2 px-4 rounded-md hover:bg-gray-100"
          >
            Pricing
          </Link>
          <div className="mt-4 space-y-2">
            <Button asChild variant="outline" className="w-full">
              <Link href="/auth/signin">Log in</Link>
            </Button>
            <Button
              asChild
              className="w-full bg-black text-white hover:bg-gray-800"
            >
              <Link href="/auth/signup">Sign up</Link>
            </Button>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
