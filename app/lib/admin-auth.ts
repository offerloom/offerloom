import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getChatGPTUser, requireChatGPTUser, type ChatGPTUser } from "../chatgpt-auth";
import { isWorkersDeployment } from "./deployment";

const ADMIN_EMAILS = new Set(["gdwivedi6@gmail.com", "contact.offerloom@gmail.com"]);
const SESSION_COOKIE = "offerloom_admin_session";

async function getWorkersAdminUser(): Promise<ChatGPTUser | null> {
  if (!(await isWorkersDeployment())) return null;

  let adminToken: string | undefined;
  try {
    const { env } = await import("cloudflare:workers");
    adminToken = env.ADMIN_API_TOKEN;
  } catch {
    return null;
  }
  if (!adminToken) return null;

  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE)?.value;
  const authHeader = (await headers()).get("authorization");
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (session !== adminToken && bearer !== adminToken) return null;

  return {
    userId: "workers-admin",
    displayName: "OfferLoom Workers admin",
    email: "contact.offerloom@gmail.com",
    fullName: "OfferLoom Workers admin",
  };
}

export function isOfferLoomAdmin(user: ChatGPTUser | null): boolean {
  return Boolean(user && ADMIN_EMAILS.has(user.email.toLowerCase()));
}

export async function getOfferLoomAdminUser(): Promise<ChatGPTUser | null> {
  const chatUser = await getChatGPTUser();
  if (isOfferLoomAdmin(chatUser)) return chatUser;

  const workersUser = await getWorkersAdminUser();
  return isOfferLoomAdmin(workersUser) ? workersUser : null;
}

export async function requireOfferLoomAdmin(returnTo = "/admin"): Promise<ChatGPTUser> {
  const user = await getOfferLoomAdminUser();
  if (user) return user;

  if (await isWorkersDeployment()) {
    redirect(`/admin/login?return_to=${encodeURIComponent(returnTo)}`);
  }

  const chatUser = await requireChatGPTUser(returnTo);
  if (!isOfferLoomAdmin(chatUser)) throw new Error("This account is not authorized to manage OfferLoom.");
  return chatUser;
}

export async function authorizeAdminApi(): Promise<ChatGPTUser | null> {
  return getOfferLoomAdminUser();
}
