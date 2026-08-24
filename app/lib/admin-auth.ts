import { getChatGPTUser, requireChatGPTUser, type ChatGPTUser } from "../chatgpt-auth";

const ADMIN_EMAILS = new Set(["gdwivedi6@gmail.com", "contact.offerloom@gmail.com"]);

export function isOfferLoomAdmin(user: ChatGPTUser | null): boolean {
  return Boolean(user && ADMIN_EMAILS.has(user.email.toLowerCase()));
}

export async function requireOfferLoomAdmin(returnTo = "/admin"): Promise<ChatGPTUser> {
  const user = await requireChatGPTUser(returnTo);
  if (!isOfferLoomAdmin(user)) throw new Error("This account is not authorized to manage OfferLoom.");
  return user;
}

export async function authorizeAdminApi(): Promise<ChatGPTUser | null> {
  const user = await getChatGPTUser();
  return isOfferLoomAdmin(user) ? user : null;
}
