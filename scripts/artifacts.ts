import { readFileSync } from "node:fs";
import { type PageArtifact, readPage } from "./markdown.ts";
import { absolute, EXTERNAL_LINKS, markdownPathFor, PAGES } from "./pages.ts";

function pageMarkdown(page: PageArtifact): string {
  return [
    `# ${page.title}`,
    "",
    `> ${page.description}`,
    "",
    `Source: ${absolute(page.path)}`,
    "",
    page.body,
    "",
  ].join("\n");
}

function llmsTxt(pages: PageArtifact[]): string {
  const [home] = pages;
  const lines = [
    `# ${home.title}`,
    "",
    `> ${home.description}`,
    "",
    "## Pages",
    "",
  ];
  for (const page of pages) {
    const url = absolute(markdownPathFor(page.path));
    lines.push(`- [${page.title}](${url}): ${page.description}`);
  }
  for (const { section, links } of EXTERNAL_LINKS) {
    lines.push("", `## ${section}`, "");
    for (const { name, url } of links) lines.push(`- [${name}](${url})`);
  }
  lines.push(
    "",
    "## Full text",
    "",
    `- [llms-full.txt](${absolute("/llms-full.txt")})`,
    "",
  );
  return lines.join("\n");
}

function sitemap(): string {
  const urls = PAGES.map((page) =>
    `  <url>\n    <loc>${absolute(page.path)}</loc>\n  </url>`
  );
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
}

/** Every generated file, keyed by its path from the repository root. */
export function buildArtifacts(root: URL): Map<string, string> {
  const pages = PAGES.map((page) =>
    readPage(readFileSync(new URL(page.source, root), "utf8"), page.path)
  );
  const files = new Map<string, string>();
  for (const page of pages) {
    files.set(markdownPathFor(page.path).slice(1), pageMarkdown(page));
  }
  files.set("llms.txt", llmsTxt(pages));
  files.set("llms-full.txt", pages.map(pageMarkdown).join("\n---\n\n"));
  files.set("sitemap.xml", sitemap());
  return files;
}
