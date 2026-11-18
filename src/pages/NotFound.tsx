import { Link } from "react-router-dom";
import { BookOpen, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Seo } from "@/components/Seo";

export default function NotFound() {
  return (
    <div className="container mx-auto py-24 px-4 text-center flex flex-col items-center justify-center min-h-[60vh]">
      <Seo
        title="Page Not Found"
        description="The requested page could not be found on Schedae."
        noindex
      />
      <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
        <BookOpen className="w-10 h-10 text-muted-foreground" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight mb-2">404 — Page not found</h1>
      <p className="text-muted-foreground mb-8 max-w-md">
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg">
          <Link to="/" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Open MD → APKG Converter
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link to="/decks">Browse Flashcard Decks</Link>
        </Button>
      </div>
    </div>
  );
}
