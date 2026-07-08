import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

// Web-only document shell. Sets a dark background (no white flash), title,
// favicon, fonts, and desktop affordances (pointer cursor, focus ring, scrollbars).
const favicon =
  "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🚗</text></svg>";

const css = `
:root { color-scheme: dark; }
html, body, #root { height: 100%; }
body {
  background-color: #0B0F1A;
  margin: 0;
  font-family: Inter_400Regular, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  overscroll-behavior-y: none;
}
* { -webkit-tap-highlight-color: transparent; }
[role="button"], a { cursor: pointer; }
:focus-visible { outline: 2px solid #6366F1; outline-offset: 2px; }
::selection { background: rgba(99,102,241,0.35); }
::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-track { background: #0B0F1A; }
::-webkit-scrollbar-thumb { background: #243049; border-radius: 999px; border: 2px solid #0B0F1A; }
::-webkit-scrollbar-thumb:hover { background: #2f3d5c; }
`;

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />
        <title>DealDesk — AI car-deal copilot</title>
        <meta name="description" content="DealDesk is an AI-powered copilot for negotiating your next car: find dealers, capture specific cars by link or screenshot, and compare itemized out-the-door offers." />
        <meta name="theme-color" content="#0B0F1A" />
        <link rel="icon" href={favicon} />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: css }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
