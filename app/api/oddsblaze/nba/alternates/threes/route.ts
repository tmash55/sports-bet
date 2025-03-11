import { handleOddsBlazeRequest } from "@/lib/oddsblaze-utils";

export const GET = handleOddsBlazeRequest(
  "nba",
  "Player Threes (At Least)",
  true
);
