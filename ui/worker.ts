import { ImageResponse, loadGoogleFont } from 'workers-og';

const CRAWLER_USER_AGENTS = [
  'facebookexternalhit',
  'Facebot',
  'Twitterbot',
  'LinkedInBot',
  'Slackbot',
  'Discordbot',
  'WhatsApp',
  'TelegramBot',
  'Googlebot',
  'bingbot',
  'Applebot',
  'iMessageLinkPreview',
  'redditbot',
  'Pinterest',
  'Mastodon',
];

const API_BASE = 'https://api.bedbase.org/v1';
const SITE_URL = 'https://bedbase.org';
const SITE_NAME = 'BEDbase';

// Open Graph image dimensions (the universal 1.91:1 standard)
const OG_W = 1200;
const OG_H = 630;

// Edge-generated card URLs (served by this worker, see handleOgImage)
const OG_BED = (id: string) => `${SITE_URL}/og/bed/${id}.png`;
const OG_BEDSET = (id: string) => `${SITE_URL}/og/bedset/${id}.png`;

const CARD_CACHE_CONTROL = 'public, max-age=86400, s-maxage=604800';

// Brand tokens (mirrors ui/src/custom.scss)
const TEAL = '#008080';
const TEAL_DARK = '#016a6a';
const INK = '#212529';
const MUTED = '#6c757d';
const BG = '#f8f9fa';
const BORDER = '#dee2e6';
const WHITE = '#ffffff';
const TEAL_SOFT = '#bfe6e6';

interface Env {
  ASSETS: Fetcher;
}

// ---------------------------------------------------------------------------
// Fonts — loaded once per isolate and reused (the generated PNG is also
// edge-cached, so Google Fonts is hit rarely).
// ---------------------------------------------------------------------------
type Font = { name: string; data: ArrayBuffer; weight: 400 | 600 | 700; style: 'normal' };
let fontsPromise: Promise<Font[]> | null = null;

function getFonts(): Promise<Font[]> {
  if (!fontsPromise) {
    fontsPromise = Promise.all([
      loadGoogleFont({ family: 'Inter', weight: 400 }),
      loadGoogleFont({ family: 'Inter', weight: 600 }),
      loadGoogleFont({ family: 'Inter', weight: 700 }),
    ]).then(([regular, semibold, bold]) => [
      { name: 'Inter', data: regular, weight: 400, style: 'normal' },
      { name: 'Inter', data: semibold, weight: 600, style: 'normal' },
      { name: 'Inter', data: bold, weight: 700, style: 'normal' },
    ]);
  }
  return fontsPromise;
}

// ---------------------------------------------------------------------------
// Logo — the real BEDbase wordmark (public/bedbase_logo.svg), fetched once via the
// ASSETS binding, recolored for each background, embedded as an SVG data URI.
// ---------------------------------------------------------------------------
let logoCache: { white: string; teal: string } | null = null;

async function getLogos(env: Env, origin: string): Promise<{ white: string; teal: string }> {
  if (logoCache) return logoCache;
  let svg = '';
  try {
    const res = await env.ASSETS.fetch(new URL('/bedbase_logo.svg', origin).toString());
    if (res.ok) svg = await res.text();
  } catch {
    /* fall through to text wordmark */
  }
  const uri = (s: string) => `data:image/svg+xml,${encodeURIComponent(s)}`;
  logoCache = svg
    ? {
        teal: uri(svg),
        // the wordmark is #008080 (+ one #000000); recolor every fill to white for the teal header
        white: uri(svg.replace(/#008080/gi, '#ffffff').replace(/#000000/gi, '#ffffff')),
      }
    : { white: '', teal: '' };
  return logoCache;
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
function isCrawler(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return CRAWLER_USER_AGENTS.some((bot) => ua.includes(bot.toLowerCase()));
}

// For real HTML attributes consumed by crawlers (the <meta> tags), which DO decode entities.
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// For Satori card text: workers-og parses our HTML with HTMLRewriter, which does NOT decode
// entities (escaping would render a literal "&lt;"). Only a '<' that could open a tag is a
// risk, so neutralize just that — "< 20 mb" and other bare '<' stay literal and render fine.
function sanitizeText(str: string): string {
  return str.replace(/<(?=[a-zA-Z!/?])/g, '‹');
}

function truncate(str: string, max: number): string {
  const s = str.trim();
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

function fmtInt(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

// ---------------------------------------------------------------------------
// Card building blocks (Satori-compatible HTML — flex everywhere)
// ---------------------------------------------------------------------------
function pill(text: string): string {
  return `<div style="display:flex;align-items:center;background:${TEAL};color:${WHITE};font-size:24px;font-weight:600;padding:8px 22px;border-radius:9999px;margin-right:14px;">${sanitizeText(text)}</div>`;
}

function statCard(label: string, value: string): string {
  return `<div style="display:flex;flex-direction:column;justify-content:center;background:${WHITE};border:1px solid ${BORDER};border-radius:16px;padding:22px 28px;margin-right:20px;box-shadow:0 1px 2px rgba(16,24,40,0.06);">
      <div style="display:flex;color:${MUTED};font-size:19px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px;">${sanitizeText(label)}</div>
      <div style="display:flex;color:${TEAL};font-size:44px;font-weight:700;">${sanitizeText(value)}</div>
    </div>`;
}

// Like statCard but for short text values (assay, cell line, species …).
function infoCard(label: string, value: string): string {
  return `<div style="display:flex;flex-direction:column;justify-content:center;background:${WHITE};border:1px solid ${BORDER};border-radius:16px;padding:20px 26px;margin-right:20px;box-shadow:0 1px 2px rgba(16,24,40,0.06);">
      <div style="display:flex;color:${MUTED};font-size:18px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px;">${sanitizeText(label)}</div>
      <div style="display:flex;color:${INK};font-size:30px;font-weight:600;">${sanitizeText(truncate(value, 20))}</div>
    </div>`;
}

// Real BEDbase wordmark (public/bedbase_logo.svg, ~4.645:1). `logo` is a data URI;
// falls back to a text wordmark if the asset could not be loaded.
function header(logo: string): string {
  const brand = logo
    ? `<img src="${logo}" width="195" height="42" />`
    : `<div style="display:flex;color:${WHITE};font-size:40px;font-weight:700;letter-spacing:-0.5px;">BEDbase</div>`;
  return `<div style="display:flex;align-items:center;justify-content:space-between;height:112px;padding:0 60px;background:linear-gradient(135deg, ${TEAL} 0%, ${TEAL_DARK} 100%);">
      ${brand}
      <div style="display:flex;color:${TEAL_SOFT};font-size:26px;font-weight:400;">bedbase.org</div>
    </div>`;
}

// Decorative genomic "signal track" — a row of peaks of varying height, deterministic per
// seed so every record looks unique. Evokes a ChIP-seq / BED region track.
function peakTrack(seed: string): string {
  const BARS = 72;
  const MAXH = 68;
  let s = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    s ^= seed.charCodeAt(i);
    s = Math.imul(s, 16777619) >>> 0;
  }
  const rand = () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
  let bars = '';
  for (let i = 0; i < BARS; i++) {
    const t = rand() * rand(); // skew toward short peaks with occasional tall ones
    const h = 5 + Math.round(t * MAXH);
    // interpolate light-teal (short) → brand teal (tall), no opacity (resvg-safe)
    const g = Math.round(210 + (128 - 210) * (h / MAXH));
    const r = Math.round(170 + (0 - 170) * (h / MAXH));
    bars += `<div style="display:flex;width:10px;height:${h}px;margin-right:4px;border-radius:2px 2px 0 0;background:rgb(${r},${g},${g});"></div>`;
  }
  return `<div style="display:flex;align-items:flex-end;height:${MAXH + 10}px;padding:0 60px;">${bars}</div>`;
}

// Card chrome: teal header (with real logo) + body (flex:1) + decorative peak track.
function frame(logo: string, body: string, trackSeed: string): string {
  return `<div style="display:flex;flex-direction:column;width:${OG_W}px;height:${OG_H}px;background:${BG};font-family:Inter;">${header(logo)}${body}${peakTrack(trackSeed)}</div>`;
}

function kicker(label: string): string {
  return `<div style="display:flex;color:${TEAL};font-size:22px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin-bottom:12px;">${sanitizeText(label)}</div>`;
}

function titleBlock(title: string): string {
  const t = truncate(title, 74);
  const size = t.length > 46 ? 46 : t.length > 30 ? 54 : 62;
  return `<div style="display:flex;color:${INK};font-size:${size}px;font-weight:700;line-height:1.12;margin-bottom:14px;">${sanitizeText(t)}</div>`;
}

function subtitle(text: string): string {
  return `<div style="display:flex;color:${MUTED};font-size:24px;font-weight:400;line-height:1.3;margin-bottom:30px;">${sanitizeText(truncate(text, 110))}</div>`;
}

function row(children: string[], marginBottom = 0): string {
  if (children.length === 0) return '';
  return `<div style="display:flex;flex-wrap:wrap;${marginBottom ? `margin-bottom:${marginBottom}px;` : ''}">${children.join('')}</div>`;
}

// ---------------------------------------------------------------------------
// Metadata fetching
// ---------------------------------------------------------------------------
interface BedStats {
  number_of_regions?: number | null;
  mean_region_width?: number | null;
}
interface BedAnnotation {
  assay?: string | null;
  target?: string | null;
  cell_line?: string | null;
  cell_type?: string | null;
  tissue?: string | null;
  species_name?: string | null;
}
interface BedMetadata {
  id?: string;
  name?: string | null;
  genome_alias?: string;
  bed_compliance?: string;
  data_format?: string;
  description?: string | null;
  annotation?: BedAnnotation | null;
}
interface BedSetMetadata {
  id: string;
  name: string;
  description?: string;
  bedfile_count?: number;
  statistics?: { mean?: BedStats | null } | null;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// Lightweight metadata only — NOT `?full=true` (that computes the full stats/plots
// payload and is expensive). The plain endpoint still returns name, genome, compliance,
// data format, description, license and the biological annotation we display.
const fetchBedMeta = (id: string) =>
  fetchJson<BedMetadata>(`${API_BASE}/bed/${id}/metadata`);
const fetchBedSetMeta = (id: string) =>
  fetchJson<BedSetMetadata>(`${API_BASE}/bedset/${id}/metadata`);

// ---------------------------------------------------------------------------
// Descriptions (used in the <meta> tags)
// ---------------------------------------------------------------------------
function buildBedDescription(meta: BedMetadata): string {
  if (meta.description) return meta.description;
  const a = meta.annotation;
  const parts: string[] = [];
  if (meta.genome_alias) parts.push(`Genome: ${meta.genome_alias}`);
  if (meta.bed_compliance) parts.push(`Format: ${meta.bed_compliance}`);
  if (a?.assay) parts.push(a.assay);
  if (a?.species_name) parts.push(a.species_name);
  return parts.length
    ? parts.join(' | ')
    : 'BED file hosted on BEDbase — a platform for genomic region data.';
}

// ---------------------------------------------------------------------------
// Card renderers → ImageResponse (PNG)
// ---------------------------------------------------------------------------
async function image(html: string): Promise<Response> {
  const rendered = new ImageResponse(html, {
    width: OG_W,
    height: OG_H,
    fonts: await getFonts(),
  });
  // Replace ImageResponse's default `immutable, max-age=1yr` with our own TTL so
  // cards refresh when metadata changes (set() overwrites, avoiding a duplicate header).
  const headers = new Headers(rendered.headers);
  headers.set('cache-control', CARD_CACHE_CONTROL);
  return new Response(rendered.body, { status: rendered.status, headers });
}

// Biological context from the lightweight annotation (no stats fetch needed).
function bedInfoCards(meta: BedMetadata): string[] {
  const a = meta.annotation || {};
  const cards: string[] = [];
  const push = (label: string, value?: string | null) => {
    if (value && cards.length < 4) cards.push(infoCard(label, value));
  };
  push('Assay', a.assay);
  push('Target', a.target);
  if (a.cell_line) push('Cell line', a.cell_line);
  else if (a.cell_type) push('Cell type', a.cell_type);
  else if (a.tissue) push('Tissue', a.tissue);
  push('Species', a.species_name);
  push('Data format', meta.data_format);
  return cards;
}

type Logos = { white: string; teal: string };

async function renderBedCard(meta: BedMetadata, id: string, logos: Logos): Promise<Response> {
  const pills: string[] = [];
  if (meta.genome_alias) pills.push(pill(meta.genome_alias));
  if (meta.bed_compliance) pills.push(pill(meta.bed_compliance.toUpperCase()));

  const body = `<div style="display:flex;flex-direction:column;flex:1;padding:40px 60px 20px 60px;">
      ${kicker('BED file')}
      ${titleBlock(meta.name || id)}
      ${subtitle(meta.description || id)}
      ${row(pills, 26)}
      ${row(bedInfoCards(meta))}
    </div>`;
  return image(frame(logos.white, body, id));
}

async function renderBedSetCard(meta: BedSetMetadata, id: string, logos: Logos): Promise<Response> {
  const mean = meta.statistics?.mean;
  const cards: string[] = [];
  if (meta.bedfile_count != null)
    cards.push(statCard('BED files', fmtInt(meta.bedfile_count)));
  if (mean?.number_of_regions != null)
    cards.push(statCard('Mean regions', fmtInt(mean.number_of_regions)));
  if (mean?.mean_region_width != null)
    cards.push(statCard('Mean width', `${fmtInt(mean.mean_region_width)} bp`));

  const body = `<div style="display:flex;flex-direction:column;flex:1;padding:40px 60px 20px 60px;">
      ${kicker('BED set')}
      ${titleBlock(meta.name || id)}
      ${subtitle(meta.description || id)}
      ${row(cards)}
    </div>`;
  return image(frame(logos.white, body, id));
}

async function renderHomeCard(logos: Logos): Promise<Response> {
  const logo = logos.teal
    ? `<img src="${logos.teal}" width="470" height="101" />`
    : `<div style="display:flex;color:${TEAL};font-size:104px;font-weight:700;letter-spacing:-2px;">BEDbase</div>`;
  const html = `<div style="display:flex;flex-direction:column;width:${OG_W}px;height:${OG_H}px;background:${BG};font-family:Inter;">
      <div style="display:flex;flex-direction:column;flex:1;align-items:center;justify-content:center;padding:40px 80px;">
        <div style="display:flex;margin-bottom:34px;">${logo}</div>
        <div style="display:flex;color:${INK};font-size:40px;font-weight:600;text-align:center;line-height:1.3;max-width:920px;margin-bottom:18px;">Find, analyze, and understand interval genomic data - all in one place</div>
        <div style="display:flex;color:${MUTED};font-size:26px;font-weight:400;text-align:center;">A unified platform for aggregating, analyzing, and serving genomic region data</div>
      </div>
      ${peakTrack('bedbase-home')}
    </div>`;
  return image(html);
}

// ---------------------------------------------------------------------------
// OG image routing (served to everyone, cached at the edge)
// ---------------------------------------------------------------------------
async function handleOgImage(
  url: URL,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  const cache = caches.default;
  const cacheKey = new Request(url.toString());
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const logos = await getLogos(env, url.origin);
  let resp: Response | null = null;

  if (url.pathname === '/og/home.png') {
    resp = await renderHomeCard(logos);
  } else {
    const bed = url.pathname.match(/^\/og\/bed\/([^/]+)\.png$/);
    const bedset = url.pathname.match(/^\/og\/bedset\/([^/]+)\.png$/);
    if (bed) {
      const meta = await fetchBedMeta(bed[1]);
      resp = meta ? await renderBedCard(meta, bed[1], logos) : await renderHomeCard(logos);
    } else if (bedset) {
      const meta = await fetchBedSetMeta(bedset[1]);
      resp = meta ? await renderBedSetCard(meta, bedset[1], logos) : await renderHomeCard(logos);
    }
  }

  if (!resp) return new Response('Not found', { status: 404 });
  ctx.waitUntil(cache.put(cacheKey, resp.clone()));
  return resp;
}

// ---------------------------------------------------------------------------
// Crawler meta-tag HTML
// ---------------------------------------------------------------------------
function buildOgHtml(meta: {
  title: string;
  description: string;
  url: string;
  image: string;
  imageAlt: string;
}): string {
  const title = escapeHtml(meta.title);
  const description = escapeHtml(meta.description);
  const url = escapeHtml(meta.url);
  const image = escapeHtml(meta.image);
  const imageAlt = escapeHtml(meta.imageAlt);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <meta name="description" content="${description}" />

  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="${SITE_NAME}" />
  <meta property="og:locale" content="en_US" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:width" content="${OG_W}" />
  <meta property="og:image:height" content="${OG_H}" />
  <meta property="og:image:alt" content="${imageAlt}" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@shefflab" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
  <meta name="twitter:image:alt" content="${imageAlt}" />

  <meta http-equiv="refresh" content="0;url=${url}" />
</head>
<body>
  <p>Redirecting to <a href="${url}">${title}</a></p>
</body>
</html>`;
}

function htmlResponse(html: string): Response {
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

// ---------------------------------------------------------------------------
// Worker entry
// ---------------------------------------------------------------------------
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // 1. Edge-generated OG images (any user agent)
    if (url.pathname.startsWith('/og/')) {
      return handleOgImage(url, env, ctx);
    }

    // 2. Humans get the SPA
    const userAgent = request.headers.get('user-agent') || '';
    if (!isCrawler(userAgent)) {
      return env.ASSETS.fetch(request);
    }

    // 3. Crawlers get route-specific OG meta tags
    const bedMatch = url.pathname.match(/^\/bed\/([^/]+)\/?$/);
    if (bedMatch) {
      const id = bedMatch[1];
      const meta = await fetchBedMeta(id);
      if (meta) {
        return htmlResponse(
          buildOgHtml({
            title: meta.name ? `${meta.name} | BEDbase` : `BED ${id.slice(0, 8)}… | BEDbase`,
            description: buildBedDescription(meta),
            url: `${SITE_URL}/bed/${id}`,
            image: OG_BED(id),
            imageAlt: `BEDbase stats card for BED file ${meta.name || id}`,
          }),
        );
      }
    }

    const bedsetMatch = url.pathname.match(/^\/bedset\/([^/]+)\/?$/);
    if (bedsetMatch) {
      const id = bedsetMatch[1];
      const meta = await fetchBedSetMeta(id);
      if (meta) {
        return htmlResponse(
          buildOgHtml({
            title: `${meta.name} | BEDbase`,
            description:
              meta.description || 'BED set hosted on BEDbase — a platform for genomic region data.',
            url: `${SITE_URL}/bedset/${id}`,
            image: OG_BEDSET(id),
            imageAlt: `BEDbase stats card for BED set ${meta.name || id}`,
          }),
        );
      }
    }

    // 4. Crawler on home/search/etc. — SPA shell carries the default OG tags
    return env.ASSETS.fetch(request);
  },
};
