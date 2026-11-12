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
    // events).
    // The player renders at document resolution unless told otherwise, and the
    // canvas is shown much larger than that, so ask for the display size
    // (cover-fit, device pixel ratio capped at 2, scale capped at 3) to stay
    // crisp instead of upscaling a small frame.
    const box = canvas.getBoundingClientRect();
    const scale = Math.max(
      box.width / doc.canvas.width,
      box.height / doc.canvas.height,
    ) * Math.min(devicePixelRatio || 1, 2);
    const player = await createPlayer({
      canvas,
      document: doc,
      loop: true,
      resolution: Math.min(3, Math.max(1, scale)),
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
