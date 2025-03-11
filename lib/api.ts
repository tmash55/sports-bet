export async function fetchOdds(sport: string, sportsbook: string) {
  const response = await fetch(`/api/odds/${sport}/${sportsbook}`);
  if (!response.ok) {
    throw new Error("Failed to fetch odds");
  }
  return response.json();
}
