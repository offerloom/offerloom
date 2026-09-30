export const AUTO_SOCIAL_POST_CRONS = ["0 2 * * *", "30 9 * * *"];
export const PROCESS_DUE_SOCIAL_POSTS_CRON = "0 4 * * *";

export function getSocialScheduleTask(cron) {
  if (AUTO_SOCIAL_POST_CRONS.includes(cron)) return "auto-post";
  if (cron === PROCESS_DUE_SOCIAL_POSTS_CRON) return "process-due";
  return "ignore";
}
