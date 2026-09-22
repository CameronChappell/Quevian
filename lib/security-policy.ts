/** Shared request and download policy. This module never reads credentials. */
export class SecurityViolation extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'SecurityViolation';
    this.status = status;
  }
}

export function guardMutation(request: Request): void {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    throw new SecurityViolation(405, 'A state-changing request method is required.');
  }
  if (request.headers.get('x-quevian-request') !== '1' && request.headers.get('x-queuepilot-request') !== '1') {
    throw new SecurityViolation(403, 'Refresh the page and try again.');
  }
  const site = request.headers.get('sec-fetch-site');
  // A sibling subdomain is not a trusted origin.
  if (site === 'cross-site' || site === 'same-site') {
    throw new SecurityViolation(403, 'Cross-site requests are not allowed.');
  }
  const origin = request.headers.get('origin');
  if (origin !== null && origin !== new URL(request.url).origin) {
    throw new SecurityViolation(403, 'Cross-site requests are not allowed.');
  }
  // Header-only non-browser clients are supported. Never enable credentialed
  // cross-origin CORS: the required non-simple header is part of this defense.
}

export async function readBoundedBody(request: Request, limit: number): Promise<Uint8Array<ArrayBuffer>> {
  const declared = request.headers.get('content-length');
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > limit)) {
    throw new SecurityViolation(413, 'The submitted request is too large.');
  }
  const reader = request.body?.getReader();
  if (!reader) throw new SecurityViolation(400, 'A request body is required.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new SecurityViolation(413, 'The submitted request is too large.');
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const result = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; }
  return result;
}

export function parseObjectJson(bytes: Uint8Array): Record<string, unknown> {
  let value: unknown;
  try { value = JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(bytes)); }
  catch { throw new SecurityViolation(400, 'Invalid JSON.'); }
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new SecurityViolation(400, 'Expected a JSON object.');
  }
  const pending: {value: unknown; depth: number}[] = [{value, depth: 0}];
  while (pending.length) {
    const item = pending.pop()!;
    if (item.depth > 20) throw new SecurityViolation(400, 'The submitted structure is too deeply nested.');
    if (item.value !== null && typeof item.value === 'object') {
      for (const [key, child] of Object.entries(item.value)) {
        if (['__proto__', 'prototype', 'constructor'].includes(key)) {
          throw new SecurityViolation(400, 'The submitted object contains a reserved field.');
        }
        pending.push({value: child, depth: item.depth + 1});
      }
    }
  }
  return value as Record<string, unknown>;
}

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const fileTypes: Record<string, string[]> = {
  txt: ['text/plain'], log: ['text/plain'], csv: ['text/csv', 'text/plain', 'application/vnd.ms-excel'],
  json: ['application/json', 'text/plain'], pdf: ['application/pdf'],
  png: ['image/png'], jpg: ['image/jpeg'], jpeg: ['image/jpeg'], gif: ['image/gif'], webp: ['image/webp'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  pptx: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
};
const rejectedName = /[\x00-\x1f\x7f/\\:\u202a-\u202e\u2066-\u2069]|%(?:00|2f|5c)/i;
const activeExtension = /\.(?:exe|dll|com|bat|cmd|ps1|vbs|js|mjs|cjs|html?|svg|php\d*|phtml|sh|scr|msi|lnk|hta|jar|docm|xlsm|pptm)(?:\.|$)/i;

function officeArchive(bytes: Uint8Array, extension: string): boolean {
  // Inspect the ZIP central directory only; never decompress customer archives.
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50 && i + 22 + view.getUint16(i + 20, true) === bytes.length) { end = i; break; }
  }
  if (end < 0 || view.getUint16(end + 4, true) || view.getUint16(end + 6, true)) return false;
  const count = view.getUint16(end + 10, true), directorySize = view.getUint32(end + 12, true);
  let cursor = view.getUint32(end + 16, true), expanded = 0;
  const directoryStart = cursor;
  if (!count || count > 1000 || view.getUint16(end + 8, true) !== count || cursor + directorySize !== end) return false;
  const names = new Set<string>();
  for (let i = 0; i < count; i++) {
    if (cursor + 46 > end || view.getUint32(cursor, true) !== 0x02014b50) return false;
    const flags = view.getUint16(cursor + 8, true), method = view.getUint16(cursor + 10, true);
    const nameLength = view.getUint16(cursor + 28, true), extra = view.getUint16(cursor + 30, true), comment = view.getUint16(cursor + 32, true);
    if ((flags & 1) || ![0, 8].includes(method) || cursor + 46 + nameLength + extra + comment > end) return false;
    const nameBytes = bytes.subarray(cursor + 46, cursor + 46 + nameLength);
    const name = new TextDecoder().decode(nameBytes);
    const local = view.getUint32(cursor + 42, true);
    if (local + 30 > directoryStart || view.getUint32(local, true) !== 0x04034b50 || view.getUint16(local + 6, true) !== flags || view.getUint16(local + 8, true) !== method) return false;
    const localNameLength = view.getUint16(local + 26, true), localExtra = view.getUint16(local + 28, true);
    if (localNameLength !== nameLength || local + 30 + localNameLength + localExtra + view.getUint32(cursor + 20, true) > directoryStart) return false;
    if (!nameBytes.every((b, j) => bytes[local + 30 + j] === b)) return false;
    if (rejectedName.test(name.replaceAll('/', '')) || name.startsWith('/') || name.split('/').includes('..') || names.has(name)) return false;
    if (activeExtension.test(name) || /(?:^|\/)(?:activex|embeddings)(?:\/|$)|vbaproject|\.bin$/i.test(name)) return false;
    expanded += view.getUint32(cursor + 24, true);
    if (expanded > 25 * 1024 * 1024) return false;
    names.add(name);
    cursor += 46 + nameLength + extra + comment;
  }
  const required: Record<string, string> = {docx: 'word/document.xml', xlsx: 'xl/workbook.xml', pptx: 'ppt/presentation.xml'};
  return cursor === end && names.has('[Content_Types].xml') && names.has(required[extension]);
}

export function validateFileData(originalName: string, contentType: string, bytes: Uint8Array): string {
  const name = originalName.normalize('NFKC');
  if (!name || name.length > 220 || rejectedName.test(name) || name !== name.trim() || activeExtension.test(name)) {
    throw new SecurityViolation(400, 'Choose a file with a simple, safe filename.');
  }
  const extension = name.split('.').pop()!.toLowerCase();
  if (!name.includes('.') || !Object.hasOwn(fileTypes, extension)) {
    throw new SecurityViolation(415, 'Upload a PDF, image, text, CSV, JSON, or non-macro Office document.');
  }
  if (!bytes.length || bytes.length > MAX_UPLOAD_BYTES) throw new SecurityViolation(413, 'Choose a non-empty file up to 5 MB.');
  const mime = contentType.split(';')[0].trim().toLowerCase();
  if (mime && mime !== 'application/octet-stream' && !fileTypes[extension].includes(mime)) {
    throw new SecurityViolation(415, 'The file type does not match its filename.');
  }
  const start = new TextDecoder('latin1').decode(bytes.subarray(0, 16));
  let valid = false;
  if (['txt', 'log', 'csv', 'json'].includes(extension)) {
    try {
      const text = new TextDecoder('utf-8', {fatal: true}).decode(bytes);
      valid = !/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(text);
      if (extension === 'json') JSON.parse(text);
    } catch { valid = false; }
  } else if (extension === 'pdf') valid = /^%PDF-(?:1\.[0-7]|2\.0)/.test(start);
  else if (extension === 'png') valid = bytes.length >= 24 && [137,80,78,71,13,10,26,10].every((v,i) => bytes[i] === v);
  else if (extension === 'jpg' || extension === 'jpeg') valid = bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  else if (extension === 'gif') valid = bytes.length >= 13 && /^(GIF87a|GIF89a)/.test(start);
  else if (extension === 'webp') valid = bytes.length >= 16 && start.startsWith('RIFF') && start.slice(8,12) === 'WEBP';
  else valid = officeArchive(bytes, extension);
  if (!valid) throw new SecurityViolation(415, 'The file contents do not match a supported file type.');
  return name;
}

export async function readUpload(request: Request): Promise<{name: string; bytes: Uint8Array<ArrayBuffer>; visibility: 'Customer'|'Internal'}> {
  guardMutation(request);
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'multipart/form-data') {
    throw new SecurityViolation(415, 'Expected a file upload.');
  }
  const body = await readBoundedBody(request, MAX_UPLOAD_BYTES + 65536);
  let form: FormData;
  try { form = await new Request(request.url, {method: 'POST', headers: {'Content-Type': request.headers.get('content-type')!}, body}).formData(); }
  catch { throw new SecurityViolation(400, 'Choose a valid file.'); }
  const file = form.get('file'), visibility = form.get('visibility');
  if (form.getAll('file').length !== 1 || form.getAll('visibility').length > 1 || [...form.keys()].some(k => !['file','visibility'].includes(k))) {
    throw new SecurityViolation(400, 'Submit exactly one file and its visibility.');
  }
  if (!file || typeof file === 'string' || (visibility !== null && !['Customer','Internal'].includes(String(visibility)))) {
    throw new SecurityViolation(400, 'Choose a valid file and visibility.');
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  return {name: validateFileData(file.name, file.type, bytes), bytes, visibility: visibility === 'Customer' ? 'Customer' : 'Internal'};
}

export function applySecurityHeaders(headers: Headers, url: URL): void {
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'no-referrer');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  headers.set('Content-Security-Policy', "object-src 'none'; base-uri 'self'; frame-ancestors 'self' https://chatgpt.com; form-action 'self' https://checkout.stripe.com https://billing.stripe.com" + (url.protocol === 'https:' ? '; upgrade-insecure-requests' : ''));
  // Inline framework scripts require a verified nonce integration before this
  // stricter script policy can be enforced without breaking hydration.
  headers.set('Content-Security-Policy-Report-Only', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'");
  headers.delete('X-Powered-By');
  headers.delete('Server');
  if (url.protocol === 'https:') headers.set('Strict-Transport-Security', 'max-age=31536000');
  if (/^\/(?:api(?:\/|$)|app(?:\/|$)|portal(?:\/|$)|auth(?:\/|$)|login$|signup$|logout$|forgot-password$|reset-password$|verify-email$|review-terms$|invite(?:\/|$))/.test(url.pathname)) {
    headers.set('Cache-Control', 'private, no-store');
    headers.set('Pragma', 'no-cache');
    headers.set('X-Robots-Tag', 'noindex, nofollow');
    for (const name of ['Access-Control-Allow-Origin', 'Access-Control-Allow-Credentials', 'Access-Control-Allow-Headers', 'Access-Control-Allow-Methods']) headers.delete(name);
  }
}

export function isSensitiveDeploymentPath(path: string): boolean {
  let normalized: string;
  try { normalized = decodeURIComponent(path); } catch { return true; }
  return /(?:^|\/)(?:\.env(?:\.[^/]*)?|\.git|\.dev\.vars(?:\.[^/]*)?)(?:\/|$)/i.test(normalized)
    || /^\/(?:@vite|@fs|__vite|__nextjs|_debug)(?:\/|$)/.test(normalized)
    || /\.(?:map|sqlite|sqlite3|pem|p12|pfx)$/i.test(normalized);
}
