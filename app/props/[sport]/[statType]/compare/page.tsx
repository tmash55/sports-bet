import PropComparisonContainer from "@/components/props/PropComparisonContainer";
import StatTypeSelection from "@/components/props/StatTypeSelect";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Prop Comparison | SportsBet Analytics",
  description: "Compare sports betting props across multiple sportsbooks",
};

export default function PropComparisonPage({
  params,
}: {
  params: { sport: string; statType: string };
}) {
  const formattedSport = params.sport.toUpperCase();
  const formattedStatType =
    params.statType.charAt(0).toUpperCase() + params.statType.slice(1);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">
        {formattedSport} {formattedStatType} Prop Comparison
      </h1>
      <StatTypeSelection
        sport={params.sport}
        currentStatType={params.statType}
      />
      <PropComparisonContainer
        sport={params.sport}
        statType={params.statType}
      />
    </div>
  );
}
