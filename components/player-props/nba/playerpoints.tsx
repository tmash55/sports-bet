"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface PlayerProp {
  player: string;
  sportsbooks: {
    [key: string]: {
      line: number;
      over: string;
      under: string;
    };
  };
}

const sportsbooks = ["DraftKings", "FanDuel", "BetMGM"];

export function NBAPlayerProps() {
  const [playerProps, setPlayerProps] = useState<PlayerProp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPlayerProps = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/oddsblaze/nba/points");
        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }
        const data = await response.json();
        setPlayerProps(data);
      } catch (error) {
        console.error("Error fetching player props:", error);
        toast({
          title: "Error",
          description: "Failed to load player props. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlayerProps();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Player</TableHead>
            {sportsbooks.map((book) => (
              <TableHead key={book} className="text-center">
                {book}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {playerProps.map((prop, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{prop.player}</TableCell>
              {sportsbooks.map((book) => (
                <TableCell key={book} className="text-center">
                  {prop.sportsbooks[book] ? (
                    <>
                      <div>{prop.sportsbooks[book].line}</div>
                      <div className="text-xs text-muted-foreground">
                        O: {prop.sportsbooks[book].over} | U:{" "}
                        {prop.sportsbooks[book].under}
                      </div>
                    </>
                  ) : (
                    <span className="text-muted-foreground">N/A</span>
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
