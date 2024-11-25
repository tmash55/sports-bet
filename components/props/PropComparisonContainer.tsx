"use client";

import { useState } from "react";
import PropTypeSelection from "./PropTypeSelection";
import SubcategorySelection from "./SubcategorySelection";
import PropFilters from "./PropFilters";
import PropTable from "./PropTable";

// File: components/props/PropComparisonContainer.tsx

type PropType = "player" | "team" | "game";
type Subcategory = "main" | "alternate" | "specialized";

interface PropComparisonContainerProps {
  sport: string;
  statType: string;
}

export default function PropComparisonContainer({
  sport,
  statType,
}: PropComparisonContainerProps) {
  const [propType, setPropType] = useState<PropType>("player");
  const [subcategory, setSubcategory] = useState<Subcategory>("main");
  const [filters, setFilters] = useState({
    matchup: "",
    team: "",
    player: "",
    date: "today",
  });

  return (
    <div className="space-y-6">
      <PropTypeSelection propType={propType} setPropType={setPropType} />
      <SubcategorySelection
        propType={propType}
        subcategory={subcategory}
        setSubcategory={setSubcategory}
      />
      <PropFilters filters={filters} setFilters={setFilters} />
      <PropTable
        sport={sport}
        statType={statType}
        propType={propType}
        subcategory={subcategory}
        filters={filters}
      />
    </div>
  );
}
