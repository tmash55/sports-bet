"use client";

import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

interface PropTableProps {
  sport: string;
  statType: string;
  propType: "main" | "alternate";
  data: PlayerProp[] | undefined;
  isLoading: boolean;
  error: Error | null;
}

interface PlayerProp {
  player: string;
  gameDate: string;
  sportsbooks: {
    [bookName: string]: {
      main: {
        line: string | number;
        over: string | number;
        under: string | number;
      };
      alternates: {
        line: string | number;
        over: string | number;
        under: string | number;
      }[];
    };
  };
}

const SPORTSBOOKS = ["DraftKings", "FanDuel", "BetMGM"] as const;

export default function PropTable({
  sport,
  statType,
  propType,
  data,
  isLoading,
  error,
}: PropTableProps) {
  const [selectedBook, setSelectedBook] =
    useState<(typeof SPORTSBOOKS)[number]>("DraftKings");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [openCollapsibles, setOpenCollapsibles] = useState<{
    [key: string]: boolean;
  }>({});

  const sortedProps = useMemo(() => {
    if (!data) return [];
    let sortableProps = [...data];
    if (sortConfig !== null) {
      sortableProps.sort((a, b) => {
        
        return 0;
      });
    }
    return sortableProps.filter((prop) =>
      prop.player.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, sortConfig, searchTerm]);

  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const isBetterOdds = (
    currentOdds: string | number,
    comparisonOdds: string | number
  ): boolean => {
    // Convert odds to numbers for comparison
    const current = Number(String(currentOdds).replace("+", ""));
    const comparison = Number(String(comparisonOdds).replace("+", ""));

    // For positive odds, higher is better
    if (
      String(currentOdds).startsWith("+") &&
      String(comparisonOdds).startsWith("+")
    ) {
      return comparison > current;
    }
    // For negative odds, less negative is better
    if (
      String(currentOdds).startsWith("-") &&
      String(comparisonOdds).startsWith("-")
    ) {
      return comparison > current;
    }
    // If comparing positive to negative, positive is better
    return (
      String(comparisonOdds).startsWith("+") &&
      String(currentOdds).startsWith("-")
    );
  };

  const renderSearchInput = () => (
    <div className="relative w-full max-w-sm mb-4">
      <Input
        placeholder="Search players..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full"
      />
    </div>
  );

  const renderMainProps = () => (
    <>
      {renderSearchInput()}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">
              <Button variant="ghost" onClick={() => requestSort("player")}>
                Player
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            {SPORTSBOOKS.map((book) => (
              <TableHead key={book} className="text-center">
                {book}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedProps.map((prop) => (
            <TableRow key={prop.player}>
              <TableCell className="font-medium">{prop.player}</TableCell>
              {SPORTSBOOKS.map((book) => (
                <TableCell key={book} className="text-center">
                  {prop.sportsbooks[book]?.main ? (
                    <>
                      <div>{prop.sportsbooks[book].main.line}</div>
                      <div className="text-xs text-muted-foreground">
                        O: {prop.sportsbooks[book].main.over} | U:{" "}
                        {prop.sportsbooks[book].main.under}
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
    </>
  );

  const renderAlternateProps = () => (
    <Tabs
      defaultValue={selectedBook}
      onValueChange={(value) =>
        setSelectedBook(value as (typeof SPORTSBOOKS)[number])
      }
      className="w-full"
    >
      <TabsList className="mb-4 flex justify-center">
        {SPORTSBOOKS.map((book) => (
          <TabsTrigger key={book} value={book} className="px-6 py-2">
            {book}
          </TabsTrigger>
        ))}
      </TabsList>
      {renderSearchInput()}
      {SPORTSBOOKS.map((book) => (
        <TabsContent key={book} value={book} className="space-y-4">
          {sortedProps.map((prop) => {
            const alternates = prop.sportsbooks[book]?.alternates || [];
            return (
              <Card key={prop.player}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>{prop.player}</span>
                    <Badge variant="secondary">{alternates.length} lines</Badge>
                  </CardTitle>
                  <CardDescription>
                    Main: {prop.sportsbooks[book]?.main.line} (O:{" "}
                    {prop.sportsbooks[book]?.main.over} | U:{" "}
                    {prop.sportsbooks[book]?.main.under})
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Collapsible
                    open={openCollapsibles[prop.player]}
                    onOpenChange={(isOpen) =>
                      setOpenCollapsibles((prev) => ({
                        ...prev,
                        [prop.player]: isOpen,
                      }))
                    }
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-between"
                      >
                        {openCollapsibles[prop.player] ? "Hide" : "View"}{" "}
                        Alternate Lines
                        {openCollapsibles[prop.player] ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      {alternates.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Line</TableHead>
                              <TableHead>Over</TableHead>
                              <TableHead>Under</TableHead>
                              <TableHead>Other Books</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {alternates.map((alt, index) => (
                              <TableRow key={index}>
                                <TableCell>{alt.line}</TableCell>
                                <TableCell>{alt.over}</TableCell>
                                <TableCell>{alt.under}</TableCell>
                                <TableCell>
                                  {SPORTSBOOKS.filter(
                                    (otherBook) => otherBook !== book
                                  ).map((otherBook) => {
                                    const matchingAlt = prop.sportsbooks[
                                      otherBook
                                    ]?.alternates.find(
                                      (a) =>
                                        Math.abs(
                                          Number(a.line) - Number(alt.line)
                                        ) < 0.5
                                    );

                                    if (!matchingAlt) return null;

                                    const hasOverBetterOdds = isBetterOdds(
                                      alt.over,
                                      matchingAlt.over
                                    );
                                    const hasUnderBetterOdds = isBetterOdds(
                                      alt.under,
                                      matchingAlt.under
                                    );

                                    return (
                                      <div key={otherBook} className="text-sm">
                                        {otherBook}: {matchingAlt.line} (
                                        <span
                                          className={
                                            hasOverBetterOdds
                                              ? "font-bold text-green-500"
                                              : ""
                                          }
                                        >
                                          O: {matchingAlt.over}
                                        </span>
                                        {" | "}
                                        <span
                                          className={
                                            hasUnderBetterOdds
                                              ? "font-bold text-green-500"
                                              : ""
                                          }
                                        >
                                          U: {matchingAlt.under}
                                        </span>
                                        )
                                      </div>
                                    );
                                  })}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p>No alternate lines available for this player.</p>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      ))}
    </Tabs>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, index) => (
          <Skeleton key={index} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      {propType === "main" && renderMainProps()}
      {propType === "alternate" && renderAlternateProps()}
    </div>
  );
}
