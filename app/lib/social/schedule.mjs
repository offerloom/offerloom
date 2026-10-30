export const AUTO_SOCIAL_POST_CRONS = ["30 1 * * *", "30 11 * * *"];
// 12:00 IST: alternate-day OfferLoom brand post (quote card).
export const BRAND_POST_CRON = "30 6 * * *";
export const PROCESS_DUE_SOCIAL_POSTS_CRON = "0 * * * *";

export function getSocialScheduleTask(cron) {
  if (AUTO_SOCIAL_POST_CRONS.includes(cron)) return "auto-post";
  if (cron === BRAND_POST_CRON) return "brand-post";
  if (cron === PROCESS_DUE_SOCIAL_POSTS_CRON) return "process-due";
  return "ignore";
}
