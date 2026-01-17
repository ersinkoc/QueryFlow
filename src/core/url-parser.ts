export interface ParsedURL {
  url: string;
  params: Set<string>;
}

export function parseURLTemplate(template: string): ParsedURL {
  const params = new Set<string>();
  const regex = /:([a-zA-Z_][a-zA-Z0-9_]*)/g;
  let match;

  while ((match = regex.exec(template)) !== null) {
    params.add(match[1]);
  }

  return { url: template, params };
}

export function buildURL(template: string, params: Record<string, string | number>): string {
  let url = template;
  for (const [key, value] of Object.entries(params)) {
    url = url.replace(`:${key}`, String(value));
  }
  return url;
}

export function buildSearchParams(searchParams: Record<string, string | number | boolean>): string {
  const entries = Object.entries(searchParams)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return entries ? `?${entries}` : '';
}

export function buildFullURL(
  baseUrl: string | undefined,
  template: string,
  params: Record<string, string | number>,
  searchParams?: Record<string, string | number | boolean>
): string {
  const url = buildURL(template, params);
  const queryString = searchParams ? buildSearchParams(searchParams) : '';
  const fullPath = url + queryString;
  return baseUrl ? `${baseUrl.replace(/\/$/, '')}${fullPath}` : fullPath;
}

export function generateCacheKey(url: string, params: Record<string, string | number>): string {
  const sortedParams = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join(',');
  return params ? `${url}|${sortedParams}` : url;
}
