import { handleOddsBlazeRequest } from "@/lib/oddsblaze-utils";

export const GET = handleOddsBlazeRequest(
  "nba",
  "Player Points + Rebounds + Assists (At Least)",
  true
);
