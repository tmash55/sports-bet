import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PropFiltersProps {
  filters: {
    matchup: string;
    team: string;
    player: string;
    date: string;
  };
  setFilters: (filters: any) => void;
}

export default function PropFilters({ filters, setFilters }: PropFiltersProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="space-y-2">
        <Label htmlFor="matchup">Matchup</Label>
        <Input
          id="matchup"
          value={filters.matchup}
          onChange={(e) => setFilters({ ...filters, matchup: e.target.value })}
          placeholder="e.g. LAL vs GSW"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="team">Team</Label>
        <Input
          id="team"
          value={filters.team}
          onChange={(e) => setFilters({ ...filters, team: e.target.value })}
          placeholder="e.g. Lakers"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="player">Player</Label>
        <Input
          id="player"
          value={filters.player}
          onChange={(e) => setFilters({ ...filters, player: e.target.value })}
          placeholder="e.g. LeBron James"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Select
          value={filters.date}
          onValueChange={(value) => setFilters({ ...filters, date: value })}
        >
          <SelectTrigger id="date">
            <SelectValue placeholder="Select date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="tomorrow">Tomorrow</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
