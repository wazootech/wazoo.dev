import { parseHTML } from "linkedom";
// @ts-types="npm:@types/turndown@5.0.5"
import TurndownService from "turndown";
// @ts-expect-error the plugin ships no types
import { gfm } from "turndown-plugin-gfm";
import { absolute, markdownPathFor, PAGES, SITE } from "./pages.ts";

export interface PageArtifact {
  path: string;
  title: string;
  description: string;
  body: string;
}

const DROP =
  'script, style, noscript, nav, footer, svg, button, canvas, h1, [hidden], [aria-hidden="true"]';

/** Public pages link to their Markdown; everything else becomes an absolute URL. */
export function resolveHref(href: string, currentPath: string): string {
  const url = new URL(href, absolute(currentPath));
  // Same-page anchors stay on the HTML page: heading IDs do not survive Markdown.
  if (href.startsWith("#") || url.origin !== SITE) return url.href;
  const path = url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`;
  const isPage = PAGES.some((page) => page.path === path);
  return isPage ? `${absolute(markdownPathFor(path))}${url.hash}` : url.href;
}

function createTurndown(currentPath: string): TurndownService {
  const service = new TurndownService({
    headingStyle: "atx",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
  });
  service.use(gfm);
  service.addRule("link", {
    filter: (node) => node.nodeName === "A",
    replacement: (content, node) => {
      const element = node as Element;
      const href = element.getAttribute("href") ?? "";
      // Icon-only links keep their label. `#` links are filled in by scripts.
      const text = content.trim() || element.getAttribute("aria-label") || "";
      if (!text || !href || href === "#") return "";
      const link = `[${text}](${resolveHref(href, currentPath)})`;
      // Adjacent icons have no text between them, so add the space back.
      return content.trim() ? link : `${link} `;
    },
  });
  service.addRule("image", {
    filter: "img",
    replacement: (_content, node) => {
      const element = node as Element;
      const src = element.getAttribute("src") ?? "";
      const alt = element.getAttribute("alt") ?? "";
      return src ? `![${alt}](${resolveHref(src, currentPath)})` : alt;
    },
  });
  return service;
}

/** Reads one page's title, description, and `<main>` content as Markdown. */
export function readPage(html: string, path: string): PageArtifact {
  const { document } = parseHTML(html);
  const main = document.querySelector("main");
  if (!main) throw new Error(`llms: no <main> in ${path}`);
  const title = document.querySelector("h1")?.textContent?.trim();
  const description = document
    .querySelector('meta[name="description"]')
    ?.getAttribute("content")
    ?.replace(/\s+/g, " ")
    .trim();
  if (!title || !description) {
    throw new Error(`llms: ${path} needs an <h1> and a description`);
  }
  for (const element of Array.from(main.querySelectorAll(DROP))) {
    element.remove();
  }
  const body = createTurndown(path)
    .turndown(main.innerHTML)
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { path, title, description, body };
}
