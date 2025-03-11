import React, { useState } from "react";
import { Game } from "@/lib/oddsblaze-utils";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import { SelectedBet } from "./ParlayBuilder";
import AdditionalBetOptions from "./AdditionalBetOptions";

interface AdditionalBetsPopupProps {
  game: Game;
  onClose: () => void;
  onSelectBet: (bet: SelectedBet) => void;
  selectedBets: SelectedBet[];
}

const AdditionalBetsPopup: React.FC<AdditionalBetsPopupProps> = ({
  game,
  onClose,
  onSelectBet,
  selectedBets,
}) => {
  const [selectedTab, setSelectedTab] = useState("Game Props");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-background rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">
            {game.teams.away.name} @ {game.teams.home.name} - Additional Bets
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-4">
          <AdditionalBetOptions
            game={game}
            onSelectBet={onSelectBet}
            selectedBets={selectedBets}
            selectedTab={selectedTab}
            setSelectedTab={setSelectedTab}
            filteredOdds={game.sportsbooks[0].odds}
          />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AdditionalBetsPopup;
