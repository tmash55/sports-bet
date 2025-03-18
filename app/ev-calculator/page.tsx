import type { Metadata } from "next"
import EVCalculatorPage from "@/components/ev-calculator-page"

export const metadata: Metadata = {
  title: "EV Calculator | Sports Betting",
  description: "Find positive EV bets and calculate optimal wager amounts using the Kelly Criterion",
}

export default function EVCalculator() {
  return <EVCalculatorPage />
}

