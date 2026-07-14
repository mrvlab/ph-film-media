/**
 * Sets `--sw` on <html> from the viewport width so the rem-based UI scales.
 *
 * Inlined as a pre-paint <script> via Function.prototype.toString(), so it must
 * stay FULLY SELF-CONTAINED — no imports or module-scope references (toString
 * only captures the body). That is why the constants live inside.
 */
export function initViewportScale() {
  // Scaling curve thresholds — tweak here to retune. Widths are CSS px.
  // Kept inside the function so `toString()` serializes them with the body.
  const SMALL_MAX = 374; // below this, shrink toward the reference width
  const REFERENCE_WIDTH = 375; // 1:1 design width for small screens
  const LARGE_MIN = 1820; // above this, start upscaling for large monitors
  const LARGE_ANCHOR = 1640; // curve anchor for the upscale ramp
  const LARGE_BASE = 0.95; // scale at the anchor
  const LARGE_GAIN = 0.4; // additional scale per anchor-width of extra width
  const DEBOUNCE_MS = 100;

  const root = document.documentElement;

  function calculateSize() {
    // clientWidth (not innerWidth/DPR maths) stays correct across DPR changes.
    const width = root.clientWidth;

    let size = 1;
    if (width < SMALL_MAX) {
      size = width / REFERENCE_WIDTH;
    } else if (width > LARGE_MIN) {
      size = LARGE_BASE + ((width - LARGE_ANCHOR) / LARGE_ANCHOR) * LARGE_GAIN;
    }

    root.style.setProperty('--sw', size.toString());
  }

  function debounce(fn: () => void, wait: number) {
    let timeout: ReturnType<typeof setTimeout>;
    return function () {
      clearTimeout(timeout);
      timeout = setTimeout(fn, wait);
    };
  }

  const onResize = debounce(calculateSize, DEBOUNCE_MS);
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);

  // Dock/undock changes devicePixelRatio without firing resize; a per-dppx media
  // query is the canonical detector (re-armed on each change).
  (function watchDevicePixelRatio() {
    matchMedia(
      '(resolution: ' + window.devicePixelRatio + 'dppx)',
    ).addEventListener(
      'change',
      function () {
        calculateSize();
        watchDevicePixelRatio();
      },
      { once: true },
    );
  })();

  calculateSize();
}
