import { SIGNED_IN_DAILY_AI_LIMIT } from "@/features/auth/accessPolicy";

export interface DailyAiUsage {
  uid: string;
  date: string;
  count: number;
}

export const getUsageDateKey = (date: Date) => date.toISOString().slice(0, 10);

export const canSendAiMessage = (usage: DailyAiUsage | null | undefined) => {
  if (!usage) {
    return false;
  }

  return usage.count < SIGNED_IN_DAILY_AI_LIMIT;
};

export const incrementDailyAiUsage = (usage: DailyAiUsage): DailyAiUsage => ({
  ...usage,
  count: usage.count + 1,
});
