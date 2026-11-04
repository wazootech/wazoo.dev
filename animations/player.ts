// Mounts every <canvas data-clayzo="/path/to/doc.json"> with the Clayzo WebGL player.
//
// prefers-reduced-motion: the loop does not play (a still frame is drawn) and
// the cursor parallax is off, since both are motion. If the preference changes
// while the page is open, the page reloads so the player is built the right way.
import { createPlayer } from "@clayzo/webgl-player";

const reduced = matchMedia("(prefers-reduced-motion: reduce)");
reduced.addEventListener("change", () => location.reload());

async function mount(canvas: HTMLCanvasElement) {
  try {
    const doc = await (await fetch(canvas.dataset.clayzo!)).json();
    // Decorative backdrop: listen on the whole page (the canvas ignores pointer
    // events) and cap the pixel ratio, since it renders at full-viewport size.
    const player = await createPlayer({
      canvas,
      document: doc,
      loop: true,
      maxPixelRatio: 1,
      interactive: !reduced.matches,
      interactionElement: reduced.matches
        ? undefined
        : document.documentElement,
    });
    if (reduced.matches) {
      await player.seek(Number(canvas.dataset.still ?? 0));
    } else {
      player.play();
    }
    canvas.dataset.ready = "true";
  } catch (error) {
    console.warn("clayzo: animation unavailable", error);
    canvas.closest(".world")?.setAttribute("hidden", "");
  }
}

for (
  const canvas of document.querySelectorAll<HTMLCanvasElement>(
    "canvas[data-clayzo]",
  )
) {
  void mount(canvas);
}
