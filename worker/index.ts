/** Cloudflare Worker entry point. Security policy covers normal and image responses. */
import {handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES} from 'vinext/server/image-optimization';
import handler from 'vinext/server/app-router-entry';
import {applySecurityHeaders, isSensitiveDeploymentPath} from '../lib/security-policy';
interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  IMAGES: {input(stream: ReadableStream): {transform(options: Record<string, unknown>): {output(options: {format: string; quality: number}): Promise<{response(): Response}>}}};
}
interface ExecutionContext {waitUntil(promise: Promise<unknown>): void; passThroughOnException(): void;}
const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const production = process.env.NODE_ENV === 'production';
    let response: Response;
    if (production && isSensitiveDeploymentPath(url.pathname)) response = new Response('Not found.', {status: 404});
    else if (production && url.protocol === 'http:' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
      const target = new URL(url); target.protocol = 'https:';
      response = new Response(null, {status: 308, headers: {Location: target.href}});
    } else {
      try {
        if (url.pathname === '/_vinext/image') {
          response = await handleImageOptimization(request, {
            fetchAsset: path => env.ASSETS.fetch(new Request(new URL(path, request.url))),
            transformImage: async (body, {width, format, quality}) => {
              const result = await env.IMAGES.input(body).transform(width > 0 ? {width} : {}).output({format, quality});
              return result.response();
            },
          }, [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES]);
        } else response = await handler.fetch(request, env, ctx);
      } catch (error) {
        const requestId = crypto.randomUUID();
        console.error(JSON.stringify({event: 'worker_request_failed', requestId, errorName: error instanceof Error ? error.name : 'Unknown'}));
        response = Response.json({error: 'The request could not be completed.', requestId}, {status: 500, headers: {'Cache-Control': 'private, no-store', 'X-Request-ID': requestId}});
      }
    }
    const secured = new Response(response.body, response);
    applySecurityHeaders(secured.headers, url);
    return secured;
  },
};
export default worker;
