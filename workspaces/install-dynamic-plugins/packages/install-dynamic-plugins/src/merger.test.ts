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
import { InstallException } from './errors';
import { deepMerge, mergePlugin, resolveRefPlugin } from './merger';
import type { PluginMap } from './types';

describe('deepMerge', () => {
  it('merges disjoint keys into the destination', () => {
    const dst: Record<string, unknown> = { a: 1 };
    deepMerge({ b: 2, c: { d: 3 } }, dst);
    expect(dst).toEqual({ a: 1, b: 2, c: { d: 3 } });
  });

  it('deep-merges nested objects', () => {
    const dst: Record<string, unknown> = { a: { x: 1 }, b: 2 };
    deepMerge({ a: { y: 2 }, c: 3 }, dst);
    expect(dst).toEqual({ a: { x: 1, y: 2 }, b: 2, c: 3 });
  });

  it('is idempotent when the same scalar is merged', () => {
    const dst: Record<string, unknown> = { a: 1 };
    expect(() => deepMerge({ a: 1 }, dst)).not.toThrow();
  });

  it('throws on conflicting scalars', () => {
    const dst: Record<string, unknown> = { a: { x: 1 } };
    expect(() => deepMerge({ a: { x: 2 } }, dst)).toThrow(
      /Config key 'a.x' defined differently/,
    );
  });

  it('ignores prototype-polluting keys (__proto__, constructor, prototype)', () => {
    const dst: Record<string, unknown> = {};
    const malicious = JSON.parse(
      '{"__proto__":{"polluted":true},"constructor":{"x":1},"prototype":{"y":2}}',
    ) as Record<string, unknown>;
    deepMerge(malicious, dst);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(Object.hasOwn(dst, '__proto__')).toBe(false);
    expect(Object.hasOwn(dst, 'constructor')).toBe(false);
    expect(Object.hasOwn(dst, 'prototype')).toBe(false);
  });
});

describe('mergePlugin — NPM', () => {
  it('adds a new plugin on first merge', async () => {
    const all: PluginMap = {};
    await mergePlugin({ package: 'pkg@1.0.0' }, all, 'cfg.yaml', 0);
    expect(all.pkg).toBeDefined();
    expect(all.pkg?.package).toBe('pkg@1.0.0');
    expect(all.pkg?.last_modified_level).toBe(0);
  });

  it('overrides a lower-level plugin from a higher level', async () => {
    const all: PluginMap = {};
    await mergePlugin(
      { package: 'pkg@1.0.0', disabled: false },
      all,
      'inc.yaml',
      0,
    );
    await mergePlugin(
      { package: 'pkg@2.0.0', disabled: true },
      all,
      'cfg.yaml',
      1,
    );
    expect(all.pkg?.package).toBe('pkg@2.0.0');
    expect(all.pkg?.disabled).toBe(true);
    expect(all.pkg?.last_modified_level).toBe(1);
  });

  it('overrides using the enabled field', async () => {
    const all: PluginMap = {};
    await mergePlugin(
      { package: 'pkg@1.0.0', enabled: true },
      all,
      'inc.yaml',
      0,
    );
    await mergePlugin(
      { package: 'pkg@2.0.0', enabled: false },
      all,
      'cfg.yaml',
      1,
    );
    expect(all.pkg?.package).toBe('pkg@2.0.0');
    expect(all.pkg?.enabled).toBe(false);
    expect(all.pkg?.last_modified_level).toBe(1);
  });

  it('handles enabled overriding disabled from a lower level', async () => {
    const all: PluginMap = {};
    await mergePlugin(
      { package: 'pkg@1.0.0', disabled: true },
      all,
      'inc.yaml',
      0,
    );
    await mergePlugin(
      { package: 'pkg@2.0.0', enabled: true },
      all,
      'cfg.yaml',
      1,
    );
    expect(all.pkg?.package).toBe('pkg@2.0.0');
    expect(all.pkg?.enabled).toBe(true);
    expect(all.pkg?.disabled).toBeUndefined();
    expect(all.pkg?.last_modified_level).toBe(1);
  });

  it('raises on duplicates within the same level', async () => {
    const all: PluginMap = {};
    await mergePlugin({ package: 'pkg@1.0.0' }, all, 'cfg.yaml', 0);
    await expect(
      mergePlugin({ package: 'pkg@2.0.0' }, all, 'cfg.yaml', 0),
    ).rejects.toBeInstanceOf(InstallException);
  });

  it('rejects non-string package values', async () => {
    const all: PluginMap = {};
    await expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mergePlugin({ package: 123 as any }, all, 'cfg.yaml', 0),
    ).rejects.toThrow(/must be a string/);
  });
});

describe('mergePlugin — ref://', () => {
  it('resolves ref to an OCI plugin by name', async () => {
    const all: PluginMap = {};
    await mergePlugin(
      {
        package:
          'oci://quay.io/rhdh/backstage-plugin-foo@sha256:abc123!backstage-plugin-foo',
      },
      all,
      'inc.yaml',
      0,
    );
    await mergePlugin(
      { package: 'ref://backstage-plugin-foo' },
      all,
      'cfg.yaml',
      1,
    );
    const key = 'oci://quay.io/rhdh/backstage-plugin-foo:!backstage-plugin-foo';
    expect(all[key]?.package).toBe(
      'oci://quay.io/rhdh/backstage-plugin-foo@sha256:abc123!backstage-plugin-foo',
    );
  });
});

describe('resolveRefPlugin', () => {
  it('resolves ref to an OCI plugin', () => {
    const all: PluginMap = {
      key: {
        package:
          'oci://quay.io/rhdh/backstage-plugin-foo@sha256:abc123!backstage-plugin-foo',
      },
    };
    expect(resolveRefPlugin('ref://backstage-plugin-foo', all)).toBe(
      'oci://quay.io/rhdh/backstage-plugin-foo@sha256:abc123!backstage-plugin-foo',
    );
  });

  it('resolves ref to an HTTP tarball plugin', () => {
    const all: PluginMap = {
      key: {
        package: 'https://example.com/plugins/backstage-plugin-bar-1.2.3.tgz',
      },
    };
    expect(resolveRefPlugin('ref://backstage-plugin-bar', all)).toBe(
      'https://example.com/plugins/backstage-plugin-bar-1.2.3.tgz',
    );
  });

  it('resolves ref to a local plugin', () => {
    const all: PluginMap = {
      key: { package: './dynamic-plugins/dist/backstage-plugin-baz' },
    };
    expect(resolveRefPlugin('ref://backstage-plugin-baz', all)).toBe(
      './dynamic-plugins/dist/backstage-plugin-baz',
    );
  });

  it('throws on unknown plugin name', () => {
    const all: PluginMap = {
      key: {
        package:
          'oci://quay.io/rhdh/backstage-plugin-foo@sha256:abc123!backstage-plugin-foo',
      },
    };
    expect(() => resolveRefPlugin('ref://unknown-plugin', all)).toThrow(
      "Cannot resolve ref:// reference: no plugin named 'unknown-plugin' found in included plugins",
    );
  });

  it('throws on empty ref', () => {
    expect(() => resolveRefPlugin('ref://', {})).toThrow(
      'Invalid ref:// reference: empty plugin name in ref://',
    );
  });
});
