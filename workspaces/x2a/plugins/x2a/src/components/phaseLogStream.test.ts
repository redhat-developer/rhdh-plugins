/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import '../test-utils/webStreamsJestPolyfill';

import { readPlainTextResponseStream } from './phaseLogStream';

const enc = new globalThis.TextEncoder();

function makeJsonLikeResponse(overrides: {
  ok?: boolean;
  status?: number;
  body?: globalThis.ReadableStream<Uint8Array> | null;
  textImpl?: () => Promise<string>;
}) {
  const {
    ok = true,
    status = 200,
    body,
    textImpl = async () => '',
  } = overrides;
  if (!ok) {
    return {
      ok: false,
      status: status,
      text: textImpl,
    } as globalThis.Response;
  }
  return {
    ok: true,
    status: 200,
    body: body,
    text: textImpl,
  } as globalThis.Response;
}

describe('readPlainTextResponseStream', () => {
  it('emits one chunk per enqueue for multiple small string parts', async () => {
    const body = new globalThis.ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(enc.encode('a'));
        c.enqueue(enc.encode('b'));
        c.enqueue(enc.encode('c'));
        c.close();
      },
    });
    const chunks: string[] = [];
    await readPlainTextResponseStream(makeJsonLikeResponse({ body }), {
      onChunk: s => chunks.push(s),
    });
    expect(chunks.join('')).toBe('abc');
  });

  it('reconstructs multi-line and longer payloads across many chunks', async () => {
    const lines = Array.from({ length: 20 }, (_, i) => `line ${i}\n`);
    const body = new globalThis.ReadableStream<Uint8Array>({
      start(c) {
        for (const l of lines) {
          c.enqueue(enc.encode(l));
        }
        c.close();
      },
    });
    const out: string[] = [];
    await readPlainTextResponseStream(makeJsonLikeResponse({ body }), {
      onChunk: s => out.push(s),
    });
    expect(out.join('')).toBe(lines.join(''));
  });

  it('decodes UTF-8 split across byte boundaries (multi-byte char)', async () => {
    // '€' is UTF-8 E2 82 AC — split as 1 byte, then 2 bytes
    const b = new Uint8Array([0xe2, 0x82, 0xac]);
    const body = new globalThis.ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(b.slice(0, 1));
        c.enqueue(b.slice(1, 3));
        c.close();
      },
    });
    const out: string[] = [];
    await readPlainTextResponseStream(makeJsonLikeResponse({ body }), {
      onChunk: s => out.push(s),
    });
    expect(out.join('')).toBe('€');
  });

  it('decodes when the first bytes arrive on a later turn (e.g. k8s follow stream back-pressure)', async () => {
    const body = new globalThis.ReadableStream<Uint8Array>({
      start(c) {
        setTimeout(() => {
          c.enqueue(enc.encode('ready\n'));
          c.close();
        }, 0);
      },
    });
    const out: string[] = [];
    await readPlainTextResponseStream(makeJsonLikeResponse({ body }), {
      onChunk: s => out.push(s),
    });
    expect(out.join('')).toBe('ready\n');
  });

  it('yields no chunks for an empty body stream (close without enqueue) - e.g. empty file', async () => {
    const body = new globalThis.ReadableStream<Uint8Array>({
      start(c) {
        c.close();
      },
    });
    const chunks: string[] = [];
    await readPlainTextResponseStream(makeJsonLikeResponse({ body }), {
      onChunk: s => chunks.push(s),
    });
    expect(chunks).toEqual([]);
  });

  it('handles single small chunk then immediate close (finished job, short DB log)', async () => {
    const body = new globalThis.ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(enc.encode('ok\n'));
        c.close();
      },
    });
    const chunks: string[] = [];
    await readPlainTextResponseStream(makeJsonLikeResponse({ body }), {
      onChunk: s => chunks.push(s),
    });
    expect(chunks.join('')).toBe('ok\n');
  });

  it('falls back to response.text() when body is null (polyfill / no stream)', async () => {
    const r = {
      ok: true,
      status: 200,
      body: null,
      text: async () => 'entire\nlog',
    } as globalThis.Response;
    const got: string[] = [];
    await readPlainTextResponseStream(r, { onChunk: c => got.push(c) });
    expect(got).toEqual(['entire\nlog']);
  });

  it('rejects on non-ok response and surfaces error body in message', async () => {
    const r = new globalThis.Response('you shall not pass', { status: 404 });
    await expect(
      readPlainTextResponseStream(r, { onChunk: () => undefined }),
    ).rejects.toThrow('you shall not pass');
  });

  it('rejects on non-ok when text() on error body fails', async () => {
    const r = {
      ok: false,
      status: 500,
      text: async () => {
        throw new Error('read failed');
      },
    } as unknown as globalThis.Response;
    await expect(
      readPlainTextResponseStream(r, { onChunk: () => undefined }),
    ).rejects.toThrow(/Log request failed \(500\)/);
  });

  it('throws DOMException(AbortError) if signal is already aborted before read', async () => {
    const ac = new AbortController();
    ac.abort();
    const body = new globalThis.ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(enc.encode('x'));
        c.close();
      },
    });
    await expect(
      readPlainTextResponseStream(makeJsonLikeResponse({ body }), {
        signal: ac.signal,
        onChunk: () => undefined,
      }),
    ).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('skips empty zero-length chunks (defensive, odd providers)', async () => {
    const body = new globalThis.ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(new Uint8Array(0));
        c.enqueue(enc.encode('x'));
        c.close();
      },
    });
    const chunks: string[] = [];
    await readPlainTextResponseStream(makeJsonLikeResponse({ body }), {
      onChunk: s => chunks.push(s),
    });
    expect(chunks.join('')).toBe('x');
  });

  it('stops and rejects with AbortError when signal aborts after first chunk (mid stream)', async () => {
    const ac = new AbortController();
    const firstPull = { done: false };
    const body = new globalThis.ReadableStream<Uint8Array>({
      pull(controller) {
        if (firstPull.done) {
          controller.enqueue(enc.encode('b'));
          controller.close();
        } else {
          firstPull.done = true;
          controller.enqueue(enc.encode('a'));
        }
      },
    });
    const chunks: string[] = [];
    const err = await readPlainTextResponseStream(
      makeJsonLikeResponse({ body }),
      {
        signal: ac.signal,
        onChunk: s => {
          chunks.push(s);
          if (s === 'a') {
            ac.abort();
          }
        },
      },
    ).then(
      () => null,
      e => e,
    );
    expect(err).toMatchObject({ name: 'AbortError' });
    expect(chunks.join('')).toBe('a');
  });
});
