import { ok, strictEqual, throws } from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { buildArtifacts } from "./artifacts.ts";
import { readPage, resolveHref } from "./markdown.ts";
import { absolute, markdownPathFor, PAGES } from "./pages.ts";

const root = new URL("../", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), "utf8");

test("committed files match the pages (run `bun run generate`)", () => {
  for (const [path, content] of buildArtifacts(root)) {
    strictEqual(read(path), content, `${path} is out of date`);
  }
});

test("each page advertises its Markdown version and llms.txt", () => {
  for (const page of PAGES) {
    const html = read(page.source).replace(/\s+/g, " ");
    const markdown = absolute(markdownPathFor(page.path));
    ok(
      html.includes(
        `<link rel="alternate" type="text/markdown" href="${markdown}"`,
      ),
      `${page.source} is missing its Markdown alternate link`,
    );
    ok(
      html.includes(`<link rel="describedby" href="${absolute("/llms.txt")}"`),
      `${page.source} is missing its llms.txt link`,
    );
  }
});

test("page links point at Markdown, other links stay absolute", () => {
  strictEqual(resolveHref("/team", "/"), "https://wazoo.dev/team/index.md");
  strictEqual(resolveHref("/", "/brand/"), "https://wazoo.dev/index.md");
  strictEqual(
    resolveHref("#colors", "/brand/"),
    "https://wazoo.dev/brand/#colors",
  );
  strictEqual(
    resolveHref("/wazoo.svg", "/brand/"),
    "https://wazoo.dev/wazoo.svg",
  );
  strictEqual(resolveHref("https://etok.me/", "/team/"), "https://etok.me/");
});

test("scripts, hidden content, and unfilled links are dropped", () => {
  const page = readPage(
    `<meta name="description" content="About."><h1>Title</h1><main>
      <p>Kept</p><script>hidden()</script><p aria-hidden="true">Hidden</p>
      <a href="#">Placeholder</a><a href="https://x.com/" aria-label="X"><svg></svg></a>
    </main>`,
    "/",
  );
  strictEqual(page.title, "Title");
  strictEqual(page.body, "Kept\n\n[X](https://x.com/)");
});

test("a page without a description fails loudly", () => {
  throws(
    () => readPage("<h1>Title</h1><main></main>", "/"),
    /description/,
  );
});
