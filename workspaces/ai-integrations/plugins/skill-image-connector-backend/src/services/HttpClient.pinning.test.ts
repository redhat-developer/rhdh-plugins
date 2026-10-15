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

import { promises as dns } from 'node:dns';
import { PassThrough, Duplex } from 'node:stream';
import { Agent } from 'undici';
import { fetchWithRedirects } from './HttpClient';

// SWC wraps namespace imports. Require the actual TLS module so the spy
// replaces the function used by Undici, not a copy on an import wrapper.
const tls = require('node:tls');

const realFetch = global.fetch;
const closeAgent = Agent.prototype.close;
let closing: Promise<unknown>[];
beforeEach(() => {
  closing = [];
  jest
    .spyOn(Agent.prototype, 'close')
    .mockImplementation(function trackClose(this: Agent, ...args: any[]) {
      const result = (closeAgent as any).apply(this, args);
      if (result?.then) closing.push(result);
      return result;
    } as any);
});
afterEach(async () => {
  // Retain the socket stub until asynchronous dispatcher teardown settles.
  await Promise.allSettled(closing);
  global.fetch = realFetch;
  jest.restoreAllMocks();
});

// Exercise real fetch/dispatcher/connector code; replace only the external
// socket boundary so no public network connection is made by the test.
it('offers validated IPv4 alternatives when DNS returns IPv6 first, without another lookup', async () => {
  global.fetch = require('undici').fetch;
  const lookup = jest
    .spyOn(dns, 'lookup')
    .mockResolvedValueOnce([
      { address: '2607:f8b0:4004:800::200e', family: 6 },
      { address: '93.184.216.34', family: 4 },
    ] as any)
    .mockResolvedValue([{ address: '127.0.0.1', family: 4 }] as any);
  let connectedAddress: unknown;
  let connectionHostname: unknown;
  let familyFallbackEnabled: unknown;
  jest.spyOn(tls, 'connect').mockImplementation(((options: any) => {
    const socket = new PassThrough() as any;
    socket.setKeepAlive = () => socket;
    socket.setNoDelay = () => socket;
    connectionHostname = options.servername;
    familyFallbackEnabled = options.autoSelectFamily;
    queueMicrotask(() => {
      if (!options.lookup) {
        socket.destroy(new Error('Unpinned connection'));
        return;
      }
      options.lookup(
        options.host,
        { all: true },
        (_error: unknown, addresses: unknown) => {
          connectedAddress = addresses;
          socket.destroy(new Error('socket boundary reached'));
        },
      );
    });
    return socket;
  }) as any);
  await expect(
    fetchWithRedirects('https://quay.io/v2/', {}, new AbortController().signal),
  ).rejects.toThrow();
  expect(connectedAddress).toEqual([
    { address: '2607:f8b0:4004:800::200e', family: 6 },
    { address: '93.184.216.34', family: 4 },
  ]);
  expect(familyFallbackEnabled).toBe(true);
  expect(connectionHostname).toBe('quay.io');
  expect(lookup).toHaveBeenCalledTimes(1);
});

it('rejects an unconfigured public redirect before resolving its hostname', async () => {
  const lookup = jest
    .spyOn(dns, 'lookup')
    .mockResolvedValue([{ address: '93.184.216.34', family: 4 }] as any);
  global.fetch = jest.fn().mockResolvedValue(
    new Response(null, {
      status: 307,
      headers: { location: 'https://other.example/blob' },
    }),
  );
  await expect(
    fetchWithRedirects(
      'https://quay.io/blob',
      {},
      new AbortController().signal,
    ),
  ).rejects.toThrow('origin');
  expect(lookup).toHaveBeenCalledTimes(1);
  expect(global.fetch).toHaveBeenCalledTimes(1);
});

function stubStreamingSocket(): void {
  jest.spyOn(tls, 'connect').mockImplementation(((options: any) => {
    const socket = new Duplex({
      read() {},
      write(_chunk, _encoding, callback) {
        this.push('HTTP/1.1 200 OK\r\nContent-Length: 6\r\n\r\nabc');
        setTimeout(() => {
          if (!this.destroyed) this.push('def');
        }, 20);
        callback();
      },
    }) as any;
    socket.encrypted = true;
    socket.alpnProtocol = 'http/1.1';
    socket.setKeepAlive = () => socket;
    socket.setNoDelay = () => socket;
    socket.setTimeout = () => socket;
    queueMicrotask(() => {
      options.lookup(options.host, {}, (error: Error | null) => {
        if (error) socket.destroy(error);
        else socket.emit('secureConnect');
      });
    });
    return socket;
  }) as any);
}

it('keeps the pinned connection alive until the caller consumes the streaming body', async () => {
  global.fetch = require('undici').fetch;
  jest
    .spyOn(dns, 'lookup')
    .mockResolvedValue([{ address: '93.184.216.34', family: 4 }] as any);
  stubStreamingSocket();
  const response = await fetchWithRedirects(
    'https://quay.io/blob',
    {},
    new AbortController().signal,
  );
  await expect(response.text()).resolves.toBe('abcdef');
});

it('cancels a pinned streaming response when its request signal is aborted', async () => {
  global.fetch = require('undici').fetch;
  jest
    .spyOn(dns, 'lookup')
    .mockResolvedValue([{ address: '93.184.216.34', family: 4 }] as any);
  stubStreamingSocket();
  const controller = new AbortController();
  const response = await fetchWithRedirects(
    'https://quay.io/blob',
    {},
    controller.signal,
  );
  const body = response.text();
  controller.abort();
  await expect(body).rejects.toHaveProperty('name', 'AbortError');
});

it.each([
  ['https://example.com/blob', 'https://cdn.example.com/blob'],
  [
    'https://registry.example.com/blob',
    'https://cdn.registry.example.com/blob',
  ],
  [
    'https://registry.example.com:8443/blob',
    'https://cdn.registry.example.com:8443/blob',
  ],
])(
  'allows registry subdomain redirects from %s to %s without extra origins',
  async (source, destination) => {
    jest
      .spyOn(dns, 'lookup')
      .mockResolvedValue([{ address: '93.184.216.34', family: 4 }] as any);
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(null, { status: 307, headers: { location: destination } }),
      )
      .mockResolvedValueOnce(new Response('blob'));
    const response = await fetchWithRedirects(
      source,
      {
        headers: { Authorization: 'Bearer registry-token' },
      },
      new AbortController().signal,
    );
    await expect(response.text()).resolves.toBe('blob');
    const request = (global.fetch as jest.Mock).mock.calls[1];
    expect(request[0]).toBe(destination);
    expect(new Headers(request[1].headers).has('authorization')).toBe(false);
  },
);

it.each([
  ['https://example.com/blob', 'https://example.com.evil.test/blob'],
  ['https://example.com/blob', 'https://notexample.com/blob'],
  ['https://registry.example.com/blob', 'https://cdn.example.com/blob'],
  ['https://example.com/blob', 'https://cdn.example.com:8443/blob'],
])(
  'rejects implicit registry trust from %s to %s',
  async (source, destination) => {
    const lookup = jest
      .spyOn(dns, 'lookup')
      .mockResolvedValue([{ address: '93.184.216.34', family: 4 }] as any);
    global.fetch = jest
      .fn()
      .mockResolvedValue(
        new Response(null, { status: 307, headers: { location: destination } }),
      );
    await expect(
      fetchWithRedirects(source, {}, new AbortController().signal),
    ).rejects.toThrow('unconfigured origin');
    expect(lookup).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  },
);

it('does not extend subdomain trust to an explicitly allowed external redirect origin', async () => {
  jest
    .spyOn(dns, 'lookup')
    .mockResolvedValue([{ address: '93.184.216.34', family: 4 }] as any);
  global.fetch = jest
    .fn()
    .mockResolvedValueOnce(
      new Response(null, {
        status: 307,
        headers: { location: 'https://external.example/blob' },
      }),
    )
    .mockResolvedValueOnce(
      new Response(null, {
        status: 307,
        headers: { location: 'https://child.external.example/blob' },
      }),
    );
  await expect(
    fetchWithRedirects(
      'https://registry.example.com/blob',
      {},
      new AbortController().signal,
      { allowedOrigins: ['https://external.example'] },
    ),
  ).rejects.toThrow('unconfigured origin');
  expect(global.fetch).toHaveBeenCalledTimes(2);
});

it('still rejects a registry subdomain resolving to a private address', async () => {
  jest
    .spyOn(dns, 'lookup')
    .mockResolvedValueOnce([{ address: '93.184.216.34', family: 4 }] as any)
    .mockResolvedValueOnce([{ address: '10.0.0.1', family: 4 }] as any);
  global.fetch = jest.fn().mockResolvedValue(
    new Response(null, {
      status: 307,
      headers: { location: 'https://cdn.example.com/blob' },
    }),
  );
  await expect(
    fetchWithRedirects(
      'https://example.com/blob',
      {},
      new AbortController().signal,
    ),
  ).rejects.toThrow('non-public address');
  expect(global.fetch).toHaveBeenCalledTimes(1);
});
