import { useEffect } from "react";

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

    const canonicalTag = document.querySelector('link[rel="canonical"]');
    canonicalTag?.setAttribute(
      "href",
      `${window.location.origin}${window.location.pathname}`,
    );
  }, [title, description]);
}
