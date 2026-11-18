import { useEffect } from "react";

export interface SeoProps {
  title: string;
  description: string;
  canonicalPath?: string;
  ogType?: "website" | "article";
  noindex?: boolean;
  lang?: "en" | "de";
  noSuffix?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

export function getSiteUrl(): string {
  const envUrl = import.meta.env.VITE_SITE_URL;
  if (
    typeof envUrl === "string" &&
    envUrl.trim() &&
    !envUrl.includes("__RUNTIME_SITE_URL__")
  ) {
    return envUrl.trim().replace(/\/+$/, "");
  }
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, "");
  }
  return "https://__RUNTIME_SITE_URL__";
}

function normalizePath(path?: string): string {
  if (!path || path === "/") return "/";
  return path.startsWith("/") ? path : `/${path}`;
}

export function Seo({
  title,
  description,
  canonicalPath,
  ogType = "website",
  noindex = false,
  lang = "en",
  noSuffix = false,
  jsonLd,
}: SeoProps) {
  const fullTitle =
    noSuffix || title.includes("Schedae") ? title : `${title} | Schedae`;

  const siteUrl = getSiteUrl();
  const path = normalizePath(
    canonicalPath ?? (typeof window !== "undefined" ? window.location.pathname : "/")
  );
  const canonicalUrl = `${siteUrl}${path === "/" ? "/" : path}`;
  const ogImageUrl = `${siteUrl}/logo.jpg`;

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const jsonLdItems = jsonLd
    ? Array.isArray(jsonLd)
      ? jsonLd
      : [jsonLd]
    : [];

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <link rel="canonical" href={canonicalUrl} />
      )}

      <meta property="og:site_name" content="Schedae" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImageUrl} />

      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImageUrl} />

      {jsonLdItems.map((item, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(item).replace(/</g, "\\u003c"),
          }}
        />
      ))}
    </>
  );
}
