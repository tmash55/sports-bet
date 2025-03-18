import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "EV Calculator",
  description: "Find positive EV bets and calculate optimal wager amounts",
}

export default function EVCalculatorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">{children}</div>
}

