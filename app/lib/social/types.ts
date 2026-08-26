export const SOCIAL_PLATFORMS = ["instagram", "facebook", "telegram", "whatsapp_channel"] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export type SocialPostStatus = "draft" | "scheduled" | "published" | "failed" | "cancelled";

export type PublishResult = {
  platform: SocialPlatform;
  status: "published" | "manual" | "failed";
  externalId?: string;
  message: string;
};

export type SocialPostRecord = {
  id: string;
  headline: string;
  body: string;
  linkUrl: string | null;
  imageUrl: string;
  platforms: SocialPlatform[];
  caption: string;
  status: SocialPostStatus;
  scheduledAt: string | null;
  publishedAt: string | null;
  publishResults: PublishResult[] | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SocialSecrets = {
  metaPageAccessToken?: string;
  metaPageId?: string;
  metaInstagramUserId?: string;
  telegramBotToken?: string;
  telegramChannelId?: string;
  publicSiteUrl: string;
};
