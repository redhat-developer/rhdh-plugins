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
import { spawn } from 'node:child_process';
import { InstallException } from './errors';
import { run } from './run';
import { which } from './which';

/**
 * Wrapper around the `skopeo` CLI with in-memory caching for `inspect` results.
 *
 * JS is single-threaded so the caches don't need locks, unlike the Python
 * version. Multiple concurrent callers inspecting the same image still share
 * the one in-flight request because we cache the promise, not just the value.
 */
export class Skopeo {
  private readonly path: string;
  private readonly inspectRawCache = new Map<string, Promise<unknown>>();
  private readonly inspectCache = new Map<string, Promise<SkopeoInspect>>();
  private readonly existsCache = new Map<string, Promise<boolean>>();

  constructor(skopeoPath?: string) {
    const resolved = skopeoPath ?? which('skopeo');
    if (!resolved) throw new InstallException('skopeo not found in PATH');
    this.path = resolved;
  }

  async copy(src: string, dst: string): Promise<void> {
    await run(
      [
        this.path,
        'copy',
        '--override-os=linux',
        '--override-arch=amd64',
        src,
        dst,
      ],
      `skopeo copy failed: ${src}`,
    );
  }

  async inspectRaw(url: string): Promise<unknown> {
    const cached = this.inspectRawCache.get(url);
    if (cached) return cached;
    const pending = this.runInspect(url, true);
    this.inspectRawCache.set(url, pending);
    try {
      return await pending;
    } catch (err) {
      this.inspectRawCache.delete(url);
      throw err;
    }
  }

  async inspect(url: string): Promise<SkopeoInspect> {
    const cached = this.inspectCache.get(url);
    if (cached) return cached;
    const pending = this.runInspect(url, false) as Promise<SkopeoInspect>;
    this.inspectCache.set(url, pending);
    try {
      return await pending;
    } catch (err) {
      this.inspectCache.delete(url);
      throw err;
    }
  }

  /**
   * Returns true iff `skopeo inspect` succeeds; never throws. Result is
   * memoized — subsequent calls for the same URL reuse the in-flight or
   * resolved promise. This dedups the `resolveImage` registry probe across
   * the many plugins that share the same OCI image (common for the RHDH
   * plugin catalog).
   */
  async exists(url: string): Promise<boolean> {
    const cached = this.existsCache.get(url);
    if (cached) return cached;
    const pending = new Promise<boolean>(resolve => {
      const child = spawn(this.path, ['inspect', '--no-tags', url], {
        stdio: 'ignore',
      });
      child.on('error', () => resolve(false));
      child.on('close', code => resolve(code === 0));
    });
    this.existsCache.set(url, pending);
    return pending;
  }

  private async runInspect(url: string, raw: boolean): Promise<unknown> {
    const args = ['inspect', '--no-tags', url];
    if (raw) args.splice(1, 0, '--raw'); // inspect --raw --no-tags <url>
    const { stdout } = await run(
      [this.path, ...args],
      `skopeo inspect failed: ${url}`,
    );
    return JSON.parse(stdout);
  }
}

export type SkopeoInspect = {
  Name?: string;
  Digest?: string;
  Labels?: Record<string, string>;
  [key: string]: unknown;
};
