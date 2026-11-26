# [wazoo.dev](https://wazoo.dev/) (formerly [wazoo.tech](https://github.com/wazootech/wazoo.tech))

You found Wazoo's official company website.

## Development

1\. Install the Deno toolchain:
<https://deno.land/manual/getting_started/installation>

2\. Start the project:

```sh
deno -A jsr:@std/http/file-server
```

This will serve the project directory.

## Agent files

`llms.txt`, `llms-full.txt`, `sitemap.xml`, and each page's `index.md` are
generated from the HTML. After editing a page, run:

```sh
deno task generate
```

CI fails if they are out of date. The page list is in `scripts/pages.ts`.

---

Programmed with 💖 [**@wazootech**](https://github.com/wazootech)
