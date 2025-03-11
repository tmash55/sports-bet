"use client";

import { useState, useCallback, useEffect } from "react";
import { useQueries, useQueryClient, QueryKey } from "@tanstack/react-query";
import PropTypeSelection from "./PropTypeSelection";
import PropTable from "./PropTable";

interface PropComparisonContainerProps {
  sport: string;
  statType: string;
}

const REFETCH_INTERVAL = 60000; // 60 seconds

export default function PropComparisonContainer({
  sport,
  statType,
}: PropComparisonContainerProps) {
  const [propType, setPropType] = useState<"main" | "alternate">("main");
  const queryClient = useQueryClient();

  const handlePropTypeChange = useCallback(
    (newPropType: "main" | "alternate") => {
      setPropType(newPropType);
    },
    []
  );

  const createQueryKey = (prefix: string): QueryKey => [
    prefix,
    sport,
    statType,
  ];

  const queries = useQueries({
    queries: [
      {
        queryKey: createQueryKey("mainProps"),
        queryFn: async () => {
          const endpoint = `/api/oddsblaze/${sport}/${statType}`;
          const response = await fetch(endpoint);
          if (!response.ok) {
            throw new Error("Failed to fetch main props data");
          }
          const data = await response.json();
          console.log("Main props data:", data);
          return data;
        },
      },
      {
        queryKey: createQueryKey("alternateProps"),
        queryFn: async () => {
          const endpoint = `/api/oddsblaze/${sport}/alternates/${statType}`;
          const response = await fetch(endpoint);
          if (!response.ok) {
            throw new Error("Failed to fetch alternate props data");
          }
          const data = await response.json();
          console.log("Alternate props data:", data);
          return data;
        },
      },
    ],
  });

  useEffect(() => {
    const refetchInterval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: createQueryKey("mainProps") });
      queryClient.invalidateQueries({
        queryKey: createQueryKey("alternateProps"),
      });
    }, REFETCH_INTERVAL);

    return () => clearInterval(refetchInterval);
  }, [queryClient, sport, statType]);

  const [mainPropsQuery, alternatePropsQuery] = queries;

  const isLoading = mainPropsQuery.isLoading || alternatePropsQuery.isLoading;
  const error = mainPropsQuery.error || alternatePropsQuery.error;

  const combinedData = useCallback(() => {
    if (!mainPropsQuery.data || !alternatePropsQuery.data) return [];

    return mainPropsQuery.data.map((mainProp: any) => {
      const alternateProp = alternatePropsQuery.data.find(
        (altProp: any) => altProp.player === mainProp.player
      );

      // Create a new sportsbooks object with both main and alternate data
      const combinedSportsbooks = {} as any;

      // Process each sportsbook
      for (const bookName of Object.keys(mainProp.sportsbooks)) {
        combinedSportsbooks[bookName] = {
          main: mainProp.sportsbooks[bookName]?.main || {
            line: "N/A",
            over: "N/A",
            under: "N/A",
          },
          alternates: alternateProp?.sportsbooks[bookName]?.alternates || [],
        };
      }

      // Also check alternate prop data for any additional sportsbooks
      if (alternateProp) {
        for (const bookName of Object.keys(alternateProp.sportsbooks)) {
          if (!combinedSportsbooks[bookName]) {
            combinedSportsbooks[bookName] = {
              main: {
                line: "N/A",
                over: "N/A",
                under: "N/A",
              },
              alternates: alternateProp.sportsbooks[bookName]?.alternates || [],
            };
          }
        }
      }

      return {
        ...mainProp,
        sportsbooks: combinedSportsbooks,
      };
    });
  }, [mainPropsQuery.data, alternatePropsQuery.data]);

  const processedData = combinedData();
  console.log("Processed combined data:", processedData);

  return (
    <div className="space-y-6">
      <PropTypeSelection
        propType={propType}
        setPropType={handlePropTypeChange}
      />
      <PropTable
        sport={sport}
        statType={statType}
        propType={propType}
        data={processedData}
        isLoading={isLoading}
        error={error as Error | null}
      />
    </div>
  );
}
