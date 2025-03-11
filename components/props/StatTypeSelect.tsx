"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StatTypeSelectionProps {
  sport: string;
  currentStatType: string;
}

const statTypes = [
  { name: "Points", value: "points" },
  { name: "Assists", value: "assists" },
  { name: "Rebounds", value: "rebounds" },
  { name: "Threes", value: "threes" },
  { name: "Points + Assists", value: "pointsAssists" },
  { name: "Points + Rebounds", value: "pointsRebounds" },
  { name: "Points + Rebounds + Assists", value: "pointsReboundsAssists" },
];

export default function StatTypeSelection({
  sport,
  currentStatType,
}: StatTypeSelectionProps) {
  const [selectedStatType, setSelectedStatType] = useState(currentStatType);
  const router = useRouter();

  useEffect(() => {
    if (selectedStatType !== currentStatType) {
      router.push(`/props/${sport}/${selectedStatType}/compare`);
    }
  }, [selectedStatType, currentStatType, sport, router]);

  return (
    <div className="w-full max-w-xs mb-4">
      <Select value={selectedStatType} onValueChange={setSelectedStatType}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select stat type" />
        </SelectTrigger>
        <SelectContent>
          {statTypes.map((statType) => (
            <SelectItem key={statType.value} value={statType.value}>
              {statType.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
