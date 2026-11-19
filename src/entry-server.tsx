import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { AppRoutes } from "./App";
import { setPreloadedPublicDecks, type Deck } from "./data/decks";

export function render(url: string, publicDecks: Deck[] = []): string {
  setPreloadedPublicDecks(publicDecks);
  return renderToString(
    <StaticRouter location={url}>
      <AppRoutes />
    </StaticRouter>
  );
}
