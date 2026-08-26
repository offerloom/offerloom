"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { composeSocialPost } from "../lib/social/compose";
import type { SocialPlatform } from "../lib/social/types";
import { SOCIAL_PLATFORMS } from "../lib/social/types";
import styles from "./admin.module.css";

type SocialPost = {
  id: string;
  headline: string;
  body: string;
  linkUrl: string | null;
  imageUrl: string;
  platforms: SocialPlatform[];
  caption: string;
  status: "draft" | "scheduled" | "published" | "failed" | "cancelled";
  scheduledAt: string | null;
  publishedAt: string | null;
  publishResults: Array<{ platform: string; status: string; message: string }> | null;
  lastError: string | null;
  createdAt: string;
};

type ConnectorStatus = Record<SocialPlatform, boolean>;

type SocialPostsPanelProps = {
  busy: boolean;
  setBusy: (value: boolean) => void;
  setMessage: (value: string) => void;
};

const platformLabels: Record<SocialPlatform, string> = {
  instagram: "Instagram (Meta)",
  facebook: "Facebook (Meta)",
  telegram: "Telegram",
  whatsapp_channel: "WhatsApp Channel",
};

export default function SocialPostsPanel({ busy, setBusy, setMessage }: SocialPostsPanelProps) {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [connectors, setConnectors] = useState<ConnectorStatus | null>(null);
  const [loadError, setLoadError] = useState("");
  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");
  const [linkUrl, setLinkUrl] = useState("https://offerloom.contact-offerloom.workers.dev");
  const [imageUrl, setImageUrl] = useState("/brand/logo-square-1080.png");
  const [scheduledAt, setScheduledAt] = useState("");
  const [platforms, setPlatforms] = useState<SocialPlatform[]>(["instagram", "facebook", "telegram", "whatsapp_channel"]);

  const preview = useMemo(() => composeSocialPost({ headline: headline || "Today's hottest deal", body, linkUrl, imageUrl }), [headline, body, linkUrl, imageUrl]);

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/social-posts", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Could not load social posts.");
    setPosts(data.posts ?? []);
    setConnectors(data.connectors ?? null);
    setLoadError("");
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await fetch("/api/admin/social-posts", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Could not load social posts.");
        if (!active) return;
        setPosts(data.posts ?? []);
        setConnectors(data.connectors ?? null);
        setLoadError("");
      } catch (error) {
        if (!active) return;
        setLoadError(error instanceof Error ? error.message : "Could not load social posts.");
      }
    })();
    return () => { active = false; };
  }, []);

  function togglePlatform(platform: SocialPlatform) {
    setPlatforms((current) => current.includes(platform)
      ? current.filter((item) => item !== platform)
      : [...current, platform]);
  }

  async function submit(mode: "schedule" | "publish_now") {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/social-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ headline, body, linkUrl, imageUrl, platforms, scheduledAt: mode === "schedule" ? scheduledAt : undefined, mode }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not save social post.");

      if (mode === "publish_now") {
        const results = data.post?.publishResults ?? [];
        const summary = results.map((item: { platform: string; status: string; message: string }) => `${item.platform}: ${item.message}`).join("\n");
        setMessage(summary || "Post applied.");
      } else {
        setMessage(`Scheduled for ${new Date(data.post.scheduledAt).toLocaleString()}.`);
      }

      setHeadline("");
      setBody("");
      setScheduledAt("");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save social post.");
    } finally {
      setBusy(false);
    }
  }

  async function applyScheduled(postId: string) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/social-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish_now", postId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not publish post.");
      const summary = (data.post?.publishResults ?? []).map((item: { platform: string; message: string }) => `${item.platform}: ${item.message}`).join("\n");
      setMessage(summary || "Post applied.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not publish post.");
    } finally {
      setBusy(false);
    }
  }

  async function cancelScheduled(postId: string) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/social-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", postId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not cancel post.");
      setMessage("Scheduled post cancelled.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not cancel post.");
    } finally {
      setBusy(false);
    }
  }

  function onSchedule(event: FormEvent) {
    event.preventDefault();
    submit("schedule");
  }

  function onApply(event: FormEvent) {
    event.preventDefault();
    submit("publish_now");
  }

  return (
    <section className={styles.socialSection}>
      <div className={styles.socialIntro}>
        <p>SOCIAL MEDIA</p>
        <h2>Schedule and apply posts</h2>
        <span>Create daily deal posts with viral hashtags, thumbnail and WhatsApp channel link. Use Schedule post for later, or Apply post for instant publishing.</span>
      </div>
      <div className={styles.socialWorkspace}>
        <form className={styles.form} onSubmit={onSchedule}>
          <div className={styles.formTitle}><h2>Create post</h2><span>Meta + Telegram + WhatsApp</span></div>
          {connectors ? (
            <div className={styles.connectorGrid}>
              {SOCIAL_PLATFORMS.map((platform) => (
                <span className={connectors[platform] ? styles.connectorOn : styles.connectorOff} key={platform}>
                  {platformLabels[platform]} {connectors[platform] ? "ready" : "needs secret"}
                </span>
              ))}
            </div>
          ) : null}
          {loadError ? <p className={styles.message} role="status">{loadError}</p> : null}
          <label>Headline<input value={headline} onChange={(event) => setHeadline(event.target.value)} required minLength={5} placeholder="Today's best smartphone deal" /></label>
          <label>Post body<textarea value={body} onChange={(event) => setBody(event.target.value)} rows={4} placeholder="Short deal copy for Instagram, Facebook and Telegram…" /></label>
          <label>Destination link<input value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} type="url" placeholder="https://offerloom.contact-offerloom.workers.dev" /></label>
          <label>Thumbnail path or image URL<input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="/brand/logo-square-1080.png" /></label>
          <fieldset className={styles.platformFieldset}>
            <legend>Platforms</legend>
            {SOCIAL_PLATFORMS.map((platform) => (
              <label className={styles.check} key={platform}>
                <input type="checkbox" checked={platforms.includes(platform)} onChange={() => togglePlatform(platform)} />
                {platformLabels[platform]}
              </label>
            ))}
          </fieldset>
          <label>Schedule for later<input value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} type="datetime-local" /></label>
          <button disabled={busy} type="submit">{busy ? "Saving…" : "Schedule post"}</button>
          <button className={styles.secondary} disabled={busy} type="button" onClick={onApply}>Apply post now</button>
          <div className={styles.previewBox}>
            <strong>Preview caption</strong>
            <pre>{preview.caption}</pre>
            <small>Thumbnail: {preview.imageUrl}</small>
          </div>
        </form>
        <div className={styles.list}>
          <div className={styles.listHead}><h2>Recent posts</h2><span>{posts.length} saved</span></div>
          {posts.length === 0 ? (
            <p className={styles.empty}>No social posts yet. Schedule your first daily deal post above.</p>
          ) : posts.map((post) => (
            <article key={post.id}>
              <div>
                <span className={styles.status} data-status={post.status}>{post.status}</span>
                <h3>{post.headline}</h3>
                <p>{post.platforms.join(", ")} · {post.scheduledAt ? `Scheduled ${new Date(post.scheduledAt).toLocaleString()}` : post.publishedAt ? `Published ${new Date(post.publishedAt).toLocaleString()}` : "Draft"}</p>
                {post.lastError ? <p>{post.lastError}</p> : null}
              </div>
              <div className={styles.actions}>
                {post.status === "scheduled" ? <>
                  <button disabled={busy} type="button" onClick={() => applyScheduled(post.id)}>Apply post</button>
                  <button disabled={busy} type="button" onClick={() => cancelScheduled(post.id)}>Cancel</button>
                </> : null}
                {post.status === "failed" ? <button disabled={busy} type="button" onClick={() => applyScheduled(post.id)}>Retry apply</button> : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
