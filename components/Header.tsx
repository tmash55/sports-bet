"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  BarChart2,
  TrendingUp,
  LineChart,
  HelpCircle,
  FileText,
  BookOpen,
  Bell,
  Settings,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { createClient } from "@/libs/supabase/client";
import MobileNav from "./MobileNav";

export const features = [
  {
    name: "Props",
    href: "/props",
    icon: BarChart2,
    sports: [
      { name: "NFL", path: "nfl/compare" },
      { name: "NBA", path: "nba/points/compare" },
      { name: "MLB", path: "mlb/compare" },
      { name: "NHL", path: "nhl/compare" },
    ],
  },
  {
    name: "Trends",
    href: "/trends",
    icon: TrendingUp,
    sports: [
      { name: "NFL", path: "nfl" },
      { name: "NBA", path: "nba" },
      { name: "MLB", path: "mlb" },
      { name: "NHL", path: "nhl" },
    ],
  },
  {
    name: "Projections",
    href: "/projections",
    icon: LineChart,
    sports: [
      { name: "NFL", path: "nfl" },
      { name: "NBA", path: "nba" },
      { name: "MLB", path: "mlb" },
      { name: "NHL", path: "nhl" },
    ],
  },
  {
    name: "Parlay Builder",
    href: "/parlay-builder",
    icon: Layers,
  },
];

export const resources = [
  { name: "Documentation", href: "/docs", icon: FileText },
  { name: "Help Center", href: "/help", icon: HelpCircle },
  { name: "Blog", href: "/blog", icon: BookOpen },
  { name: "Notifications", href: "/notifications", icon: Bell },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Header() {
  const [session, setSession] = useState(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold">SportsBet</span>
        </Link>

        <NavigationMenu className="hidden md:flex relative">
          <NavigationMenuList>
            {features.map((feature) => (
              <NavigationMenuItem key={feature.name} className="relative">
                {feature.sports ? (
                  <>
                    <NavigationMenuTrigger className="h-9">
                      <feature.icon className="mr-2 h-4 w-4" />
                      {feature.name}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[200px] gap-1 p-4">
                        {feature.sports.map((sport) => (
                          <li key={sport.name}>
                            <NavigationMenuLink asChild>
                              <Link
                                href={`${feature.href}/${sport.path}`}
                                className="flex items-center space-x-2 rounded-md p-2 hover:bg-accent"
                              >
                                <span>{sport.name}</span>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </>
                ) : (
                  <Link
                    href={feature.href}
                    className="flex items-center space-x-2 h-9 px-4 py-2"
                  >
                    <feature.icon className="h-4 w-4" />
                    <span>{feature.name}</span>
                  </Link>
                )}
              </NavigationMenuItem>
            ))}

            <NavigationMenuItem>
              <NavigationMenuTrigger className="h-9">
                Resources
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[200px] gap-1 p-4">
                  {resources.map((resource) => (
                    <li key={resource.name}>
                      <NavigationMenuLink asChild>
                        <Link
                          href={resource.href}
                          className="flex items-center space-x-2 rounded-md p-2 hover:bg-accent"
                        >
                          <resource.icon className="h-4 w-4" />
                          <span>{resource.name}</span>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center space-x-4">
          <MobileNav />

          {session ? (
            <Button onClick={handleSignOut} variant="outline">
              Sign Out
            </Button>
          ) : (
            <div className="hidden md:flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <Link href="/auth/signin">Log in</Link>
              </Button>
              <Button
                asChild
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Link href="/auth/signup">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
