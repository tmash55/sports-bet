"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";

interface Prop {
  id: string;
  player: string;
  team: string;
  opponent: string;
  propType: string;
  line: number;
  overOdds: number;
  underOdds: number;
}

export default function PropComparisonTable({ props }: { props: Prop[] }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProps = props.filter(
    (prop) =>
      prop.player.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prop.team.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prop.opponent.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prop.propType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <Input
        type="text"
        placeholder="Search props..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4"
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Player</TableHead>
            <TableHead>Team</TableHead>
            <TableHead>Opponent</TableHead>
            <TableHead>Prop Type</TableHead>
            <TableHead>Line</TableHead>
            <TableHead>Over Odds</TableHead>
            <TableHead>Under Odds</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredProps.map((prop) => (
            <TableRow key={prop.id}>
              <TableCell>{prop.player}</TableCell>
              <TableCell>{prop.team}</TableCell>
              <TableCell>{prop.opponent}</TableCell>
              <TableCell>{prop.propType}</TableCell>
              <TableCell>{prop.line}</TableCell>
              <TableCell>{prop.overOdds}</TableCell>
              <TableCell>{prop.underOdds}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
