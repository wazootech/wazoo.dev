export const SITE = "https://wazoo.dev";

/** The public, canonical pages. The sitemap and the agent files come from this. */
export const PAGES = [
  { path: "/", source: "index.html" },
  { path: "/team/", source: "team/index.html" },
  { path: "/brand/", source: "brand/index.html" },
  { path: "/stream-privacy/", source: "stream-privacy/index.html" },
];

/** Links that leave the site, listed in llms.txt under their section heading. */
export const EXTERNAL_LINKS = [
  {
    section: "Documentation",
    links: [
      {
        name: "Documentation index",
        url: "https://docs.wazoo.dev/llms.txt",
      },
    ],
  },
  {
    section: "Company",
    links: [
      { name: "Blog", url: "https://blog.wazoo.dev/" },
      { name: "GitHub", url: "https://github.com/wazootech" },
    ],
  },
];

/** Directory URLs get `index.md` appended, per the llms.txt proposal. */
export function markdownPathFor(path: string): string {
  return `${path}index.md`;
}

export function absolute(path: string): string {
  return new URL(path, SITE).href;
}
