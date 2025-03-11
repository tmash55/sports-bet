import { handleOddsBlazeRequest } from "@/lib/oddsblaze-utils";

export const GET = handleOddsBlazeRequest(
  "nba",
  "Player Rebounds (At Least)",
  true
);
