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
];

const API_BASE = 'https://api.bedbase.org/v1';
const SITE_URL = 'https://bedbase.org';
// Replace with a PNG (1200x630) for best compatibility across all platforms
const OG_IMAGE = `${SITE_URL}/bedbase_logo.svg`;

interface Env {
  ASSETS: Fetcher;
}

function isCrawler(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return CRAWLER_USER_AGENTS.some((bot) => ua.includes(bot.toLowerCase()));
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildOgHtml(meta: {
  title: string;
  description: string;
  url: string;
  image?: string;
}): string {
  const title = escapeHtml(meta.title);
  const description = escapeHtml(meta.description);
  const url = escapeHtml(meta.url);
  const image = meta.image ? escapeHtml(meta.image) : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <meta name="description" content="${description}" />

  <meta property="og:type" content="website" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:url" content="${url}" />
  ${image ? `<meta property="og:image" content="${image}" />` : ''}

  <meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />
  <meta name="twitter:site" content="@shefflab" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  ${image ? `<meta name="twitter:image" content="${image}" />` : ''}

  <meta http-equiv="refresh" content="0;url=${url}" />
</head>
<body>
  <p>Redirecting to <a href="${url}">${title}</a></p>
</body>
</html>`;
}

interface BedMetadata {
  name?: string | null;
  genome_alias?: string;
  bed_compliance?: string;
  stats?: {
    number_of_regions?: number;
    mean_region_width?: number;
  };
  annotation?: Record<string, unknown>;
}

interface BedSetMetadata {
  id: string;
  name: string;
  description?: string;
  statistics?: {
    mean?: {
      number_of_regions?: number;
    };
  };
}

async function fetchBedMeta(id: string): Promise<BedMetadata | null> {
  try {
    const res = await fetch(`${API_BASE}/bed/${id}/metadata`);
    if (!res.ok) return null;
    return (await res.json()) as BedMetadata;
  } catch {
    return null;
  }
}

async function fetchBedSetMeta(id: string): Promise<BedSetMetadata | null> {
  try {
    const res = await fetch(`${API_BASE}/bedset/${id}/metadata`);
    if (!res.ok) return null;
    return (await res.json()) as BedSetMetadata;
  } catch {
    return null;
  }
}

function buildBedDescription(meta: BedMetadata): string {
  const parts: string[] = [];
  if (meta.genome_alias) parts.push(`Genome: ${meta.genome_alias}`);
  if (meta.bed_compliance) parts.push(`Format: ${meta.bed_compliance}`);
  if (meta.stats?.number_of_regions) {
    parts.push(`${meta.stats.number_of_regions.toLocaleString()} regions`);
  }
  if (meta.stats?.mean_region_width) {
    parts.push(`Mean width: ${meta.stats.mean_region_width.toLocaleString()} bp`);
  }
  if (parts.length === 0) {
    return 'BED file hosted on BEDbase — a platform for genomic region data.';
  }
  return parts.join(' | ');
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const userAgent = request.headers.get('user-agent') || '';

    if (!isCrawler(userAgent)) {
      return env.ASSETS.fetch(request);
    }

    // Match /bed/:id
    const bedMatch = url.pathname.match(/^\/bed\/([^/]+)\/?$/);
    if (bedMatch) {
      const id = bedMatch[1];
      const meta = await fetchBedMeta(id);
      if (meta) {
        const title = meta.name
          ? `${meta.name} | BEDbase`
          : `BED ${id.slice(0, 8)}... | BEDbase`;
        const html = buildOgHtml({
          title,
          description: buildBedDescription(meta),
          url: `${SITE_URL}/bed/${id}`,
          image: OG_IMAGE,
        });
        return new Response(html, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }
    }

    // Match /bedset/:id
    const bedsetMatch = url.pathname.match(/^\/bedset\/([^/]+)\/?$/);
    if (bedsetMatch) {
      const id = bedsetMatch[1];
      const meta = await fetchBedSetMeta(id);
      if (meta) {
        const title = `${meta.name} | BEDbase`;
        const description =
          meta.description ||
          'BED set hosted on BEDbase — a platform for genomic region data.';
        const html = buildOgHtml({
          title,
          description,
          url: `${SITE_URL}/bedset/${id}`,
          image: OG_IMAGE,
        });
        return new Response(html, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }
    }

    // Crawler on non-dynamic routes (home, search, etc.) — serve SPA with default OG
    return env.ASSETS.fetch(request);
  },
};