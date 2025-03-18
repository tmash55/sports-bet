"use client"

interface ErrorStateProps {
  error: string
}

export function ErrorState({ error }: ErrorStateProps) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
      <p className="font-medium">Error loading props</p>
      <p className="text-sm">{error}</p>
      <p className="text-sm mt-2">This market may not be available for this game or sport.</p>
    </div>
  )
}

