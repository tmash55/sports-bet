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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

type PropType = "player" | "team" | "game";
type Subcategory = "main" | "alternate" | "specialized";

interface PropTableProps {
  sport: string;
  statType: string;
  propType: PropType;
  subcategory: Subcategory;
  filters: {
    matchup: string;
    team: string;
    player: string;
    date: string;
  };
}

interface PlayerProp {
  player: string;
  gameDate: string;
  sportsbooks: {
    [key: string]: {
      line: string;
      over: string;
      under: string;
    };
  };
}

export default function PropTable({
  sport,
  statType,
  propType,
  subcategory,
  filters,
}: PropTableProps) {
  const [props, setProps] = useState<PlayerProp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProps() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/oddsblaze/${sport}/${statType}`);
        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }
        const data = await response.json();
        setProps(data);
      } catch (err) {
        setError(
          "An error occurred while fetching the data. Please try again later."
        );
        console.error("Error fetching props:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProps();
  }, [sport, statType, propType, subcategory, filters]);

  const filterPropsByDate = (props: PlayerProp[], dateFilter: string) => {
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 86400000)
      .toISOString()
      .split("T")[0];
    const weekFromNow = new Date(Date.now() + 7 * 86400000)
      .toISOString()
      .split("T")[0];

    switch (dateFilter) {
      case "today":
        return props.filter((prop) => prop.gameDate === today);
      case "tomorrow":
        return props.filter((prop) => prop.gameDate === tomorrow);
      case "week":
        return props.filter(
          (prop) => prop.gameDate >= today && prop.gameDate <= weekFromNow
        );
      default:
        return props;
    }
  };

  const filteredProps = filterPropsByDate(props, filters.date);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(10)].map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const sportsbooks = ["DraftKings", "FanDuel", "BetMGM"];

  return (
    <div className="overflow-x-auto">
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
          {filteredProps.map((prop) => (
            <TableRow key={prop.player}>
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
