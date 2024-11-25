import { Button } from "@/components/ui/button";
import { BarChart2, Users, Trophy } from "lucide-react";

type PropType = "player" | "team" | "game";

interface PropTypeSelectionProps {
  propType: PropType;
  setPropType: (type: PropType) => void;
}

export default function PropTypeSelection({
  propType,
  setPropType,
}: PropTypeSelectionProps) {
  return (
    <div className="flex space-x-2">
      <Button
        variant={propType === "player" ? "default" : "outline"}
        onClick={() => setPropType("player")}
      >
        <BarChart2 className="mr-2 h-4 w-4" />
        Player Props
      </Button>
      <Button
        variant={propType === "team" ? "default" : "outline"}
        onClick={() => setPropType("team")}
      >
        <Users className="mr-2 h-4 w-4" />
        Team Props
      </Button>
      <Button
        variant={propType === "game" ? "default" : "outline"}
        onClick={() => setPropType("game")}
      >
        <Trophy className="mr-2 h-4 w-4" />
        Game Props
      </Button>
    </div>
  );
}
