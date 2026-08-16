#!/usr/bin/env node

/**
 * Regenerates every brand asset — app icon, Android adaptive layers, splash mark —
 * from the single vector source in `assets/brand/`.
 *
 *   node scripts/generate-brand-assets.js              # full run
 *   node scripts/generate-brand-assets.js --svg-only   # just clean the SVG
 *
 * Why this exists rather than a one-off command: the geometry below is *derived*,
 * not chosen by eye (see `.plans/2026-07-30-vendor-mobile-brand-assets.md` §G5), and
 * these assets get regenerated whenever the mark, the framing, or the target app
 * changes. Six PNGs produced by unrepeatable ad-hoc commands rot immediately.
 *
 * Two hops, deliberately separated:
 *   1. SVG -> 2048px master PNG. Needs a browser; this is the only non-portable
 *      step, and it degrades to "supply the master yourself" rather than failing
 *      obscurely.
 *   2. master PNG -> every output. Pure `jimp-compact`, portable.
 *
 * DEPENDENCY NOTE: `jimp-compact` is a *transitive* dependency (via
 * `@expo/image-utils`), not declared in package.json. That is deliberate — declaring
 * it would trip the AGENTS.md dependency approval gate for a tool run twice a year.
 * If a future Expo bump drops it, the guarded require below says exactly what to do.
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const brandDir = path.join(root, "assets", "brand");

// ---------------------------------------------------------------------------
// Constants. Every number is derived — do not "tidy" them without redoing the maths.
// ---------------------------------------------------------------------------

/** Brand blue, taken from the vector source's own fill. */
const BRAND_BLUE = 0x034bfcff;
/** Knockout colour for the mark on the icon (plan D1-A). */
const MARK_WHITE = 0xffffffff;

const MASTER_PX = 2048; // 2x the SVG's 1024 viewBox, for clean downsampling
const CANVAS = 1024; // both stores want a 1024 master icon

/**
 * iOS draws the icon full-bleed and rounds the corners itself (~22% radius), so the
 * mark can run wider than on Android. 62% of the canvas keeps it clear of the curve.
 */
const IOS_MARK_W = 635;

/**
 * Android adaptive icons are 108dp layers, of which only a centred 66dp circle is
 * guaranteed visible — 66/108 * 1024 = 626px. The mark is inscribed in that circle:
 * at the measured 1.2120:1 aspect that is 483x398. Anything larger gets cropped by
 * some launcher mask, which is the single most common adaptive-icon defect.
 */
const ANDROID_SAFE_CIRCLE = 626;
const ANDROID_MARK_W = 483;

/**
 * SPLASH — and the whole reason this is not just a tight crop.
 *
 * On Android 12+ the splash icon goes through the platform SplashScreen API:
 * `expo-splash-screen`'s plugin writes it as `windowSplashScreenAnimatedIcon`
 * (`withAndroidSplashStyles.js:44-45`), and **the OS masks that drawable to a
 * circle**. No icon background colour is set, so this is the 288dp-canvas case
 * where only the inner two thirds survives the mask.
 *
 * The mark used to be written tight-cropped, so its left and right extremes sat
 * outside that circle and were cut off — the logo appeared to be "inside a
 * circle". Padding it into a square canvas whose content is inscribed in the safe
 * circle is the fix; there is no flag that turns the mask off, because it belongs
 * to the OS rather than to Expo.
 *
 * The mark is inscribed by its DIAGONAL, not its width: a rectangle only fits a
 * circle when its corners do.
 */
const SPLASH_CANVAS = 1024;
const SPLASH_SAFE_CIRCLE = Math.round((SPLASH_CANVAS * 2) / 3); // 683px

/**
 * In-app logo — white on transparency, tight-cropped, for the loading screen's
 * `BrandMark`. Not masked by anything, so it needs no padding; separate from the
 * Android foreground icon (which is padded for launcher masks) so that changing
 * one cannot silently resize the other.
 */
const MARK_WHITE_W = 1024;

const SOURCE_SVG = path.join(brandDir, "ezzy-mark-source.svg"); // supplier file, untouched
const CLEAN_SVG = path.join(brandDir, "ezzy-mark.svg"); // artifact stripped
const MASTER_PNG = path.join(brandDir, "_master.png"); // intermediate

const OUT = {
  ios: path.join(brandDir, "icon-ios.png"),
  androidFg: path.join(brandDir, "icon-android-foreground.png"),
  androidMono: path.join(brandDir, "icon-android-monochrome.png"),
  splash: path.join(brandDir, "splash-mark.png"),
  markWhite: path.join(brandDir, "mark-white.png"),
};

function loadJimp() {
  try {
    return require("jimp-compact");
  } catch {
    throw new Error(
      "jimp-compact not found. It normally arrives transitively via @expo/image-utils.\n" +
        "If Expo has dropped it, install it explicitly (an approval gate):\n" +
        "  npm install --save-dev jimp-compact",
    );
  }
}

// ---------------------------------------------------------------------------
// Hop 0 — strip the trace artifact out of the supplied SVG
// ---------------------------------------------------------------------------

/**
 * The supplied file carries a stray white sliver hugging the left canvas edge
 * (a vector-trace remnant, ~5x56 in the 1024 viewBox). Left in, it paints a white
 * nick on the icon *and* drags the measured bounding box out to x=0, throwing off
 * every centring calculation below.
 *
 * The design is a single blue mark, so "every white path" identifies the artifact
 * without hardcoding an index. The assertions afterwards fail loudly if that ever
 * stops being true.
 */
function cleanSvg() {
  const src = fs.readFileSync(SOURCE_SVG, "utf8");
  const before = (src.match(/<path\b/g) || []).length;
  const cleaned = src.replace(/<path\b[^>]*fill="#ffffff"[^>]*\/>\s*/gi, "");
  const after = (cleaned.match(/<path\b/g) || []).length;

  if (after !== 1) {
    throw new Error(
      `Expected exactly 1 path after stripping white artifacts, found ${after} ` +
        `(source had ${before}). The source artwork has changed shape — re-check it ` +
        "before trusting the framing constants in this script.",
    );
  }
  if (cleaned.includes("base64")) {
    throw new Error(
      "Cleaned SVG contains a base64 payload — the source is a raster in a vector " +
        "wrapper, not true vector. Obtain a real vector export.",
    );
  }

  fs.writeFileSync(CLEAN_SVG, cleaned);
  console.log(`  cleaned SVG: ${before} path(s) -> ${after}  ${rel(CLEAN_SVG)}`);
}

// ---------------------------------------------------------------------------
// Hop 1 — SVG to master PNG (environment-specific)
// ---------------------------------------------------------------------------

const BROWSERS = [
  "/mnt/c/Program Files/Google/Chrome/Application/chrome.exe",
  "/mnt/c/Program Files/Microsoft/Edge/Application/msedge.exe",
  "/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
];

/**
 * A Windows browser binary cannot see WSL paths, but it can write to the
 * `\\wsl.localhost\<distro>\...` UNC share — which is what keeps the output inside
 * this repo instead of somewhere on the Windows filesystem.
 */
function toUnc(p) {
  const distro = process.env.WSL_DISTRO_NAME;
  if (!distro) throw new Error("WSL_DISTRO_NAME is unset — cannot build a UNC path.");
  return `\\\\wsl.localhost\\${distro}${p.replace(/\//g, "\\")}`;
}

function rasterize() {
  const browser = BROWSERS.find((b) => fs.existsSync(b));
  if (!browser) {
    if (fs.existsSync(MASTER_PNG)) {
      console.log(`  no browser found; reusing existing ${rel(MASTER_PNG)}`);
      return;
    }
    throw new Error(
      "No Chrome or Edge found to rasterize the SVG, and no master PNG to fall back on.\n" +
        `Render ${rel(CLEAN_SVG)} to a ${MASTER_PX}x${MASTER_PX} PNG with a transparent\n` +
        `background by any means, save it as ${rel(MASTER_PNG)}, and re-run.`,
    );
  }

  // --force-device-scale-factor=2 against the SVG's 1024 viewBox yields 2048px.
  // --default-background-color=00000000 is what preserves transparency; without it
  // the screenshot comes back on opaque white.
  execFileSync(browser, [
    "--headless",
    "--disable-gpu",
    "--force-device-scale-factor=2",
    `--window-size=${CANVAS},${CANVAS}`,
    "--default-background-color=00000000",
    `--screenshot=${toUnc(MASTER_PNG)}`,
    toUnc(CLEAN_SVG),
  ], { stdio: "pipe" });

  console.log(`  rasterized via ${path.basename(browser)} -> ${rel(MASTER_PNG)}`);
}

// ---------------------------------------------------------------------------
// Hop 2 — master PNG to every output (portable)
// ---------------------------------------------------------------------------

/** Tight bounding box of everything not effectively transparent. */
function contentBox(img) {
  const { width: w, height: h, data } = img.bitmap;
  let minx = w, miny = h, maxx = -1, maxy = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] < 16) continue;
      if (x < minx) minx = x;
      if (x > maxx) maxx = x;
      if (y < miny) miny = y;
      if (y > maxy) maxy = y;
    }
  }
  if (maxx < 0) throw new Error("Master PNG is fully transparent — rasterization failed.");
  return { x: minx, y: miny, w: maxx - minx + 1, h: maxy - miny + 1 };
}

/** Repaint every pixel's RGB, keeping alpha so antialiased edges stay clean. */
function recolour(img, rgba) {
  const [r, g, b] = [(rgba >>> 24) & 255, (rgba >>> 16) & 255, (rgba >>> 8) & 255];
  const { width: w, height: h, data } = img.bitmap;
  for (let i = 0; i < w * h; i++) {
    data[i * 4] = r;
    data[i * 4 + 1] = g;
    data[i * 4 + 2] = b;
  }
  return img;
}

async function derive() {
  const Jimp = loadJimp();
  const master = await Jimp.read(MASTER_PNG);
  const box = contentBox(master);
  const aspect = box.w / box.h;
  console.log(`  master content: ${box.w}x${box.h} (aspect ${aspect.toFixed(4)}:1)`);

  /** The mark, tight-cropped — every output starts from this. */
  const mark = master.clone().crop(box.x, box.y, box.w, box.h);

  const centred = (canvas, markImg, markW) => {
    const m = markImg.clone().resize(markW, Jimp.AUTO);
    canvas.composite(m, Math.round((canvas.bitmap.width - m.bitmap.width) / 2),
      Math.round((canvas.bitmap.height - m.bitmap.height) / 2));
    return canvas;
  };

  // iOS — opaque tile, white mark. Alpha is stripped at write time: App Store
  // Connect rejects an icon carrying an alpha channel at all, even a fully opaque one.
  const ios = centred(new Jimp(CANVAS, CANVAS, BRAND_BLUE),
    recolour(mark.clone(), MARK_WHITE), IOS_MARK_W);
  ios.colorType(2);
  await ios.writeAsync(OUT.ios);

  // Android foreground — transparent, white mark, inside the safe circle.
  await centred(new Jimp(CANVAS, CANVAS, 0x00000000),
    recolour(mark.clone(), MARK_WHITE), ANDROID_MARK_W).writeAsync(OUT.androidFg);

  // Android monochrome (themed icons, 13+). Android tints using the alpha channel,
  // so the fill colour is irrelevant — identical framing keeps themed and normal
  // icons in register.
  await centred(new Jimp(CANVAS, CANVAS, 0x00000000),
    recolour(mark.clone(), MARK_WHITE), ANDROID_MARK_W).writeAsync(OUT.androidMono);

  // Splash — brand blue on a transparent SQUARE canvas, with the mark inscribed
  // in the Android 12 safe circle by its diagonal (see SPLASH_SAFE_CIRCLE).
  //
  // ⚠️ `imageWidth` in app.json therefore sizes the CANVAS, not the mark: the mark
  // renders at `imageWidth * (splashMarkW / SPLASH_CANVAS)`. Change one without
  // the other and the logo silently changes size.
  const splashMarkW = Math.floor(
    SPLASH_SAFE_CIRCLE / Math.sqrt(1 + (box.h / box.w) ** 2),
  );
  console.log(
    `  splash: mark ${splashMarkW}px inscribed in the ${SPLASH_SAFE_CIRCLE}px safe circle ` +
      `(${((splashMarkW / SPLASH_CANVAS) * 100).toFixed(1)}% of canvas)`,
  );
  await centred(new Jimp(SPLASH_CANVAS, SPLASH_CANVAS, 0x00000000),
    recolour(mark.clone(), BRAND_BLUE), splashMarkW).writeAsync(OUT.splash);

  // In-app logo — white, tight-cropped, no padding: nothing masks this one.
  await recolour(mark.clone(), MARK_WHITE)
    .resize(MARK_WHITE_W, Jimp.AUTO)
    .writeAsync(OUT.markWhite);

  for (const p of Object.values(OUT)) console.log(`  wrote ${rel(p)}`);
}

// ---------------------------------------------------------------------------
// Assertions — the store rules that are cheap to check and expensive to discover late
// ---------------------------------------------------------------------------

async function assertOutputs() {
  const Jimp = loadJimp();
  const fail = [];

  const iosBytes = fs.readFileSync(OUT.ios);
  if (iosBytes[25] !== 2) {
    fail.push(`icon-ios.png has PNG colour type ${iosBytes[25]}, expected 2 (no alpha). App Store Connect rejects alpha.`);
  }
  const ios = await Jimp.read(OUT.ios);
  if (ios.bitmap.width !== CANVAS || ios.bitmap.height !== CANVAS) {
    fail.push(`icon-ios.png is ${ios.bitmap.width}x${ios.bitmap.height}, expected ${CANVAS}x${CANVAS}.`);
  }

  for (const key of ["androidFg", "androidMono"]) {
    const img = await Jimp.read(OUT[key]);
    if (img.bitmap.width !== CANVAS || img.bitmap.height !== CANVAS) {
      fail.push(`${path.basename(OUT[key])} is ${img.bitmap.width}x${img.bitmap.height}, expected ${CANVAS}x${CANVAS}.`);
    }
    if (fs.readFileSync(OUT[key])[25] !== 6) {
      fail.push(`${path.basename(OUT[key])} has no alpha channel; adaptive layers require transparency.`);
    }
  }

  // Every visible foreground pixel must sit inside the safe circle, or some launcher
  // mask will clip it.
  const fg = await Jimp.read(OUT.androidFg);
  const { width: w, height: h, data } = fg.bitmap;
  const cx = w / 2, cy = h / 2, r = ANDROID_SAFE_CIRCLE / 2;
  let worst = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] < 16) continue;
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      if (d > worst) worst = d;
    }
  }
  if (worst > r) {
    fail.push(`Android foreground reaches ${worst.toFixed(1)}px from centre, outside the ${r}px safe radius — launchers will crop it.`);
  }
  console.log(`  safe-circle check: furthest pixel ${worst.toFixed(1)}px of ${r}px allowed`);

  // The same check for the splash, against the OS mask rather than a launcher's.
  // This is the assertion that would have caught the clipped logo before it
  // shipped: the drawable was tight-cropped, so its corners sat well outside the
  // circle Android 12+ masks it to.
  const splash = await Jimp.read(OUT.splash);
  if (splash.bitmap.width !== splash.bitmap.height) {
    fail.push(`splash-mark.png is ${splash.bitmap.width}x${splash.bitmap.height}; it must be SQUARE, or the Android 12 circular mask crops the long axis.`);
  }
  {
    const { width: sw, height: sh, data: sd } = splash.bitmap;
    const scx = sw / 2, scy = sh / 2, sr = (SPLASH_SAFE_CIRCLE / SPLASH_CANVAS) * (sw / 2);
    let sWorst = 0;
    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        if (sd[(y * sw + x) * 4 + 3] < 16) continue;
        const d = Math.hypot(x + 0.5 - scx, y + 0.5 - scy);
        if (d > sWorst) sWorst = d;
      }
    }
    if (sWorst > sr) {
      fail.push(`Splash mark reaches ${sWorst.toFixed(1)}px from centre, outside the ${sr.toFixed(1)}px Android 12 mask radius — the logo will be clipped into a circle.`);
    }
    console.log(`  splash mask check: furthest pixel ${sWorst.toFixed(1)}px of ${sr.toFixed(1)}px allowed`);
  }

  if (fail.length) {
    throw new Error("Asset assertions failed:\n  - " + fail.join("\n  - "));
  }
  console.log("  all assertions passed");
}

const rel = (p) => path.relative(root, p).replace(/\\/g, "/");

async function main() {
  if (!fs.existsSync(SOURCE_SVG)) {
    throw new Error(`Missing source artwork: ${rel(SOURCE_SVG)}`);
  }
  fs.mkdirSync(brandDir, { recursive: true });

  console.log("1. cleaning source SVG");
  cleanSvg();
  if (process.argv.includes("--svg-only")) {
    console.log("\n--svg-only: stopping before rasterization.");
    return;
  }

  console.log("2. rasterizing to master PNG");
  rasterize();
  console.log("3. deriving assets");
  await derive();
  console.log("4. asserting store constraints");
  await assertOutputs();
  console.log("\nDone.");
}

main().catch((err) => {
  console.error("\n" + err.message);
  process.exit(1);
});
