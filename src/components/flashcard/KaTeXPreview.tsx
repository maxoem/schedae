import React from "react";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

import { normalizeMathMarkdown } from "@/utils/mathUtils";
export { normalizeMathMarkdown };

/**
 * Renders markdown text with full formatting support (bold, line breaks, lists)
 * and KaTeX math expressions. Handles both inline ($...$) and display ($$...$$) mode.
 */
export function KaTeXRenderer({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const content = React.useMemo(() => normalizeMathMarkdown(text), [text]);

  return (
    <div className={cn("leading-relaxed max-w-none", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ children }) => <div className="mb-2 last:mb-0">{children}</div>,
          pre: ({ children }) => <pre className="overflow-x-auto">{children}</pre>,
          code: ({ className, children }) => <code className={className}>{children}</code>,
          ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
          li: ({ children }) => <li className="mb-1 last:mb-0">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-muted-foreground/30 pl-3 italic my-2">{children}</blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

/**
 * Preview wrapper that renders KaTeX + markdown for the batch preview.
 * This shows the rendered math notation exactly as it will appear in Anki.
 */
export function MathifiedCardContent({ text, variant = "front" }: {
  text: string;
  variant?: "front" | "back";
}) {
  return (
    <div className={cn(
      "leading-relaxed max-w-none",
      variant === "front" ? "text-foreground font-semibold" : "text-foreground/90",
    )}>
      <KaTeXRenderer text={text} />
    </div>
  );
}
