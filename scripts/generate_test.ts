import { assert, assertEquals, assertThrows } from "@std/assert";
import { buildArtifacts } from "./artifacts.ts";
import { readPage, resolveHref } from "./markdown.ts";
import { absolute, markdownPathFor, PAGES } from "./pages.ts";

const root = new URL("../", import.meta.url);
const read = (path: string) => Deno.readTextFileSync(new URL(path, root));

Deno.test("committed files match the pages (run `deno task generate`)", () => {
  for (const [path, content] of buildArtifacts(root)) {
    assertEquals(read(path), content, `${path} is out of date`);
  }
});

Deno.test("each page advertises its Markdown version and llms.txt", () => {
  for (const page of PAGES) {
    const html = read(page.source).replace(/\s+/g, " ");
    const markdown = absolute(markdownPathFor(page.path));
    assert(
      html.includes(
        `<link rel="alternate" type="text/markdown" href="${markdown}"`,
      ),
      `${page.source} is missing its Markdown alternate link`,
    );
    assert(
      html.includes(`<link rel="describedby" href="${absolute("/llms.txt")}"`),
      `${page.source} is missing its llms.txt link`,
    );
  }
});

Deno.test("page links point at Markdown, other links stay absolute", () => {
  assertEquals(resolveHref("/team", "/"), "https://wazoo.dev/team/index.md");
  assertEquals(resolveHref("/", "/brand/"), "https://wazoo.dev/index.md");
  assertEquals(
    resolveHref("#colors", "/brand/"),
    "https://wazoo.dev/brand/#colors",
  );
  assertEquals(
    resolveHref("/wazoo.svg", "/brand/"),
    "https://wazoo.dev/wazoo.svg",
  );
  assertEquals(resolveHref("https://etok.me/", "/team/"), "https://etok.me/");
});

Deno.test("scripts, hidden content, and unfilled links are dropped", () => {
  const page = readPage(
    `<meta name="description" content="About."><h1>Title</h1><main>
      <p>Kept</p><script>hidden()</script><p aria-hidden="true">Hidden</p>
      <a href="#">Placeholder</a><a href="https://x.com/" aria-label="X"><svg></svg></a>
    </main>`,
    "/",
  );
  assertEquals(page.title, "Title");
  assertEquals(page.body, "Kept\n\n[X](https://x.com/)");
});

Deno.test("a page without a description fails loudly", () => {
  assertThrows(
    () => readPage("<h1>Title</h1><main></main>", "/"),
    Error,
    "description",
  );
});
