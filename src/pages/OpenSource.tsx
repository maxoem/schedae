import { Link } from "react-router-dom";
import { Mail, ArrowLeft, Github } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OpenSource() {
  const contactEmail = import.meta.env.VITE_CONTACT_EMAIL || "contact@localhost";
  const repoUrl = "https://github.com/maxoem/Schedae";

  return (
    <div className="w-full max-w-xl px-4 py-20 mx-auto flex flex-col items-center text-center">
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
        Open Source
      </h1>

      <p className="mt-4 text-base text-muted-foreground leading-relaxed">
        Schedae is free and open-source software built with a privacy-first architecture. All database parsing, WebAssembly operations, and deck exports happen client-side on your device.
      </p>

      <p className="mt-2 text-base text-foreground font-medium">
        Explore the source code, contribute, or self-host your own instance on GitHub under the MIT License.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="gap-2"
          >
            <Github className="w-4 h-4" />
            View on GitHub
          </a>
        </Button>
        <Button asChild variant="outline">
          <a
            href={`mailto:${contactEmail}?subject=Schedae%20Feedback`}
            className="gap-2"
          >
            <Mail className="w-4 h-4" />
            Contact
          </a>
        </Button>
        <Button asChild variant="ghost">
          <Link to="/" className="gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </Button>
      </div>
    </div>
  );
}
