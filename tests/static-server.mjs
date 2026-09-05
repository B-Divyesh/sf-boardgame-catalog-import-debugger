import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';

const root = resolve(process.cwd(), 'dist');
const config = JSON.parse(await readFile(resolve(root, 'staticwebapp.config.json'), 'utf8'));
const port = Number(process.env.PORT ?? 4173);

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.xml': 'application/xml; charset=utf-8',
};

function matches(pattern, pathname) {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replaceAll('*', '.*');
  return new RegExp(`^${escaped}$`).test(pathname);
}

function routeHeaders(pathname) {
  const headers = { ...config.globalHeaders };
  for (const route of config.routes ?? []) {
    if (matches(route.route, pathname)) Object.assign(headers, route.headers ?? {});
  }
  return headers;
}

async function existingFile(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  const requested = resolve(root, `.${decoded}`);
  if (requested !== root && !requested.startsWith(`${root}${sep}`)) return null;
  for (const candidate of [requested, resolve(requested, 'index.html')]) {
    try {
      if ((await stat(candidate)).isFile()) return candidate;
    } catch {
      // Try the next physical-file form.
    }
  }
  return null;
}

function sendFile(response, file, statusCode, pathname) {
  response.writeHead(statusCode, {
    'Content-Type': contentTypes[extname(file)] ?? 'application/octet-stream',
    ...routeHeaders(pathname),
  });
  createReadStream(file).pipe(response);
}

createServer(async (request, response) => {
  const pathname = new URL(request.url ?? '/', `http://${request.headers.host}`).pathname;
  const file = await existingFile(pathname);
  if (file) {
    sendFile(response, file, 200, pathname);
    return;
  }

  const fallback = config.navigationFallback;
  const excluded = fallback?.exclude?.some((pattern) => matches(pattern.startsWith('/') ? pattern : `/${pattern}`, pathname));
  if (fallback && !excluded) {
    const fallbackFile = await existingFile(fallback.rewrite);
    if (fallbackFile) {
      sendFile(response, fallbackFile, 200, pathname);
      return;
    }
  }

  const notFound = config.responseOverrides?.['404'];
  const notFoundFile = notFound?.rewrite ? await existingFile(notFound.rewrite) : null;
  if (notFoundFile) {
    sendFile(response, notFoundFile, notFound.statusCode ?? 404, pathname);
    return;
  }
  response.writeHead(404, routeHeaders(pathname));
  response.end('Not found');
}).listen(port, '127.0.0.1');
