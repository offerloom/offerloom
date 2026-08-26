import type { SocialSecrets } from "./types";

type EnvLike = {
  META_PAGE_ACCESS_TOKEN?: string;
  META_PAGE_ID?: string;
  META_INSTAGRAM_USER_ID?: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHANNEL_ID?: string;
  PUBLIC_SITE_URL?: string;
};

export function socialSecretsFromEnv(env: EnvLike): SocialSecrets {
  return {
    metaPageAccessToken: env.META_PAGE_ACCESS_TOKEN,
    metaPageId: env.META_PAGE_ID,
    metaInstagramUserId: env.META_INSTAGRAM_USER_ID,
    telegramBotToken: env.TELEGRAM_BOT_TOKEN,
    telegramChannelId: env.TELEGRAM_CHANNEL_ID,
    publicSiteUrl: env.PUBLIC_SITE_URL ?? "https://offerloom.contact-offerloom.workers.dev",
  };
}

export function socialConnectorStatus(secrets: SocialSecrets) {
  return {
    facebook: Boolean(secrets.metaPageAccessToken && secrets.metaPageId),
    instagram: Boolean(secrets.metaPageAccessToken && secrets.metaInstagramUserId),
    telegram: Boolean(secrets.telegramBotToken && secrets.telegramChannelId),
    whatsapp_channel: true,
  };
}
