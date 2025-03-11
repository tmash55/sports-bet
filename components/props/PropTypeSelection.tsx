"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface PropTypeSelectionProps {
  propType: "main" | "alternate";
  setPropType: (propType: "main" | "alternate") => void;
}

export default function PropTypeSelection({
  propType,
  setPropType,
}: PropTypeSelectionProps) {
  return (
    <RadioGroup
      defaultValue={propType}
      onValueChange={(value) => setPropType(value as "main" | "alternate")}
      className="flex space-x-4"
    >
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="main" id="main" />
        <Label htmlFor="main">Main Props</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="alternate" id="alternate" />
        <Label htmlFor="alternate">Alternate Props</Label>
      </div>
    </RadioGroup>
  );
}
