import { useEffect } from "react";
import { SITE_URL } from "@/app/siteContent";

// react-router's client-side navigation never touches <head> on its own —
// without this, the tab title/description stay stuck on whatever the static
// HTML shell for the entry route shipped, even after navigating elsewhere.
export function useDocumentMeta(title: string, description: string) {
  useEffect(() => {
    document.title = title;

    const descriptionTag = document.querySelector(
      'meta[name="description"]',
    );
    descriptionTag?.setAttribute("content", description);

    // Same URL the static shell ships (scripts/generate-route-shells.mjs):
    // the production origin, always with a trailing slash, because that's
    // the address GitHub Pages actually serves (no-slash forms 301 to it).
    const path = window.location.pathname
      .replace(/index\.html$/, "")
      .replace(/\/?$/, "/");
    document
      .querySelector('link[rel="canonical"]')
      ?.setAttribute("href", `${SITE_URL}${path}`);
  }, [title, description]);
}
