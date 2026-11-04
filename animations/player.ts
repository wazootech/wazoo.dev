// Mounts every <canvas data-clayzo="/path/to/doc.json"> with the Clayzo WebGL player.
// Respects prefers-reduced-motion by drawing a still frame instead of playing.
import { createPlayer } from "@clayzo/webgl-player";

const reduced = matchMedia("(prefers-reduced-motion: reduce)");

async function mount(canvas: HTMLCanvasElement) {
  try {
    const doc = await (await fetch(canvas.dataset.clayzo!)).json();
    const player = await createPlayer({ canvas, document: doc, loop: true });
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
