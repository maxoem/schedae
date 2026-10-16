import { useEffect } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useChangelogNews } from "@/hooks/useChangelogNews";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Github, ArrowLeft, ExternalLink, Sparkles, Tag } from "lucide-react";

export default function Changelog() {
  const { releases, markAsRead } = useChangelogNews();

  useEffect(() => {
    markAsRead();
    document.title = "Changelog | Schedae";
  }, [markAsRead]);

  return (
    <div className="w-full max-w-4xl px-4 sm:px-6 py-12 mx-auto">
      {/* Back button & top navigation */}
      <div className="flex items-center justify-between mb-8">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 text-zinc-600 hover:text-zinc-950">
          <Link to="/">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Tools</span>
          </Link>
        </Button>

        <Button asChild variant="outline" size="sm" className="gap-2 text-xs">
          <a
            href="https://github.com/maxoem/Schedae/releases"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub Releases</span>
            <ExternalLink className="w-3 h-3 text-zinc-400" />
          </a>
        </Button>
      </div>

      {/* Hero header */}
      <div className="border-b border-zinc-200 pb-8 mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950">
          Changelog
        </h1>
        <p className="mt-2 text-base text-zinc-600 max-w-2xl leading-relaxed">
          Stay up to date with the latest features, improvements, and fixes in Schedae. All notes are synced directly from our GitHub releases.
        </p>
      </div>

      {/* Releases Timeline */}
      {releases.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/50">
          <Tag className="w-8 h-8 text-zinc-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-zinc-900">No releases published yet</h3>
          <p className="text-sm text-zinc-500 mt-1 max-w-sm mx-auto">
            Check back soon or follow our repository on GitHub for upcoming release announcements.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-4 gap-1.5">
            <a href="https://github.com/maxoem/Schedae" target="_blank" rel="noopener noreferrer">
              <Github className="w-4 h-4" />
              Follow on GitHub
            </a>
          </Button>
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 border-l-2 border-zinc-200 space-y-12">
          {releases.map((release, idx) => {
            const formattedDate = new Date(release.publishedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            });

            return (
              <article key={release.id || release.tag} className="relative group">
                {/* Timeline node dot */}
                <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white bg-blue-600 ring-4 ring-blue-50 transition-transform group-hover:scale-110" />

                <div className="bg-white rounded-xl border border-zinc-200/90 shadow-2xs hover:shadow-xs transition-shadow p-6 sm:p-7">
                  {/* Release Meta */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-zinc-100">
                    <div className="flex items-center gap-2.5">
                      <Badge variant="secondary" className="font-mono text-xs font-semibold px-2.5 py-0.5 bg-zinc-100 text-zinc-900 border border-zinc-200/70">
                        {release.tag}
                      </Badge>
                      {idx === 0 && (
                        <Badge className="bg-emerald-500 text-white hover:bg-emerald-600 text-[11px] font-medium px-2 py-0.5">
                          Latest
                        </Badge>
                      )}
                      {release.isPrerelease && (
                        <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 text-[11px]">
                          Pre-release
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                        <time dateTime={release.publishedAt}>{formattedDate}</time>
                      </span>
                      {release.url && (
                        <a
                          href={release.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-900 hover:underline transition-colors"
                          title="View on GitHub"
                        >
                          <span>GitHub</span>
                          <ExternalLink className="w-3 h-3 text-zinc-400" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Title if different from tag */}
                  {release.name && release.name !== release.tag && (
                    <h2 className="text-lg font-bold text-zinc-900 mt-4 mb-2">
                      {release.name}
                    </h2>
                  )}

                  {/* Release Notes Body */}
                  <div className="mt-4 prose prose-zinc prose-sm sm:prose-base max-w-none prose-headings:font-semibold prose-headings:text-zinc-900 prose-headings:mt-4 prose-headings:mb-2 prose-p:my-2 prose-ul:my-2 prose-li:my-0.5 prose-a:text-blue-600 prose-a:underline hover:prose-a:text-blue-800 prose-code:font-mono prose-code:text-xs prose-code:bg-zinc-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-zinc-900 prose-pre:text-zinc-100">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {release.body}
                    </ReactMarkdown>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
