import ParlayBuilder from "@/components/parlay-builder"


export const metadata = {
  title: "Parlay Builder & Odds Comparison",
  description: "Build your parlay and compare odds across different sportsbooks",
}

export default function ParlayBuilderPage() {
  return (
    <div className="container mx-auto py-8 pb-20">
      <h1 className="text-3xl font-bold mb-6">Parlay Builder</h1>
      <ParlayBuilder />
    </div>
  )
}

