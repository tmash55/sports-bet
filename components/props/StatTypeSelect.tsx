import { Button } from "@/components/ui/button";
import { BarChart2, TrendingUp } from "lucide-react";
import Link from "next/link";

interface StatTypeSelectionProps {
  sport: string;
  currentStatType: string;
}

const statTypes = [
  { name: "Points", icon: BarChart2 },
  { name: "Assists", icon: TrendingUp },
  // Add more stat types here as needed
];

export default function StatTypeSelection({
  sport,
  currentStatType,
}: StatTypeSelectionProps) {
  return (
    <div className="flex space-x-2 mb-4">
      {statTypes.map((statType) => (
        <Link
          key={statType.name}
          href={`/props/${sport}/${statType.name.toLowerCase()}/compare`}
          passHref
        >
          <Button
            variant={
              currentStatType === statType.name.toLowerCase()
                ? "default"
                : "outline"
            }
          >
            <statType.icon className="mr-2 h-4 w-4" />
            {statType.name}
          </Button>
        </Link>
      ))}
    </div>
  );
}
