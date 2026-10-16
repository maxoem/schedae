import { useState, useEffect, useCallback } from "react";
import rawChangelog from "@/data/changelog.json";

export interface ChangelogRelease {
  id: number;
  tag: string;
  name: string;
  publishedAt: string;
  body: string;
  url: string;
  isPrerelease: boolean;
}

export const changelogReleases: ChangelogRelease[] = rawChangelog as ChangelogRelease[];

const STORAGE_KEY = "schedae_last_seen_changelog_tag";
const READ_EVENT = "schedae:changelog-read";

export function useChangelogNews() {
  const latestTag = changelogReleases[0]?.tag || "v1.0.0";
  const [hasUnreadNews, setHasUnreadNews] = useState<boolean>(false);

  const checkStatus = useCallback(() => {
    try {
      const lastSeen = localStorage.getItem(STORAGE_KEY);
      if (!lastSeen) {
        // First-time visitor: indicate that there are news!
        setHasUnreadNews(true);
      } else if (lastSeen !== latestTag) {
        // Newer release available since last visit
        setHasUnreadNews(true);
      } else {
        setHasUnreadNews(false);
      }
    } catch {
      setHasUnreadNews(false);
    }
  }, [latestTag]);

  useEffect(() => {
    checkStatus();

    const handleReadEvent = () => setHasUnreadNews(false);
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        checkStatus();
      }
    };

    window.addEventListener(READ_EVENT, handleReadEvent);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener(READ_EVENT, handleReadEvent);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [checkStatus]);

  const markAsRead = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, latestTag);
      setHasUnreadNews(false);
      window.dispatchEvent(new CustomEvent(READ_EVENT));
    } catch {
      // storage unavailable
    }
  }, [latestTag]);

  return {
    hasUnreadNews,
    markAsRead,
    latestTag,
    releases: changelogReleases,
  };
}
