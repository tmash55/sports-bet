import { Button } from "@/components/ui/button";

type PropType = "player" | "team" | "game";
type Subcategory = "main" | "alternate" | "specialized";

interface SubcategorySelectionProps {
  propType: PropType;
  subcategory: Subcategory;
  setSubcategory: (subcategory: Subcategory) => void;
}

export default function SubcategorySelection({
  propType,
  subcategory,
  setSubcategory,
}: SubcategorySelectionProps) {
  const subcategories: Record<PropType, Subcategory[]> = {
    player: ["main", "alternate", "specialized"],
    team: ["main", "alternate", "specialized"],
    game: ["main", "specialized"],
  };

  return (
    <div className="flex space-x-2">
      {subcategories[propType].map((sub) => (
        <Button
          key={sub}
          variant={subcategory === sub ? "default" : "outline"}
          onClick={() => setSubcategory(sub)}
        >
          {sub.charAt(0).toUpperCase() + sub.slice(1)} Props
        </Button>
      ))}
    </div>
  );
}
