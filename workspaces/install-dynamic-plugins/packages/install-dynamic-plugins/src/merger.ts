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
import * as fs from 'node:fs/promises';
import { parse as parseYaml } from 'yaml';
import { InstallException } from './errors';
import { log } from './log';
import { type OciImageCache } from './image-cache';
import { npmPluginKey } from './npm-key';
import {
  isOciInherit,
  ociPluginKey,
  tryParseOciRegistryAndPath,
} from './oci-key';
import { extractPluginName } from './plugin-name';
import { isOciUrl, OCI_PROTO } from './protocols';
import {
  type DynamicPluginsConfig,
  type IncludePluginList,
  isPluginDisabled,
  type Plugin,
  type PluginMap,
  type PluginSpec,
  RECOGNIZED_ALGORITHMS,
} from './types';
import { isPlainObject } from './util';

/**
 * Reject `__proto__`, `constructor`, and `prototype` keys.
 *
 * Inlined string-literal comparisons (rather than a shared `Set.has()` call)
 * because CodeQL's `js/prototype-polluting-function` analysis only treats
 * this specific pattern as an exhaustive prototype-pollution sanitizer when
 * looking at the call site — a `Set` lookup gets flagged as "not guarded".
 */
function isForbiddenKey(key: string): boolean {
  return key === '__proto__' || key === 'constructor' || key === 'prototype';
}

/**
 * Safely assign `value` to `dst[key]` without touching the prototype chain.
 *
 * Two layers of defense:
 *   1. Reject the three prototype-pollution keys outright.
 *   2. `Object.defineProperty` over `dst[key] = value` so that even if a
 *      forbidden key somehow slipped through, the prototype chain is still
 *      not mutated (`defineProperty` bypasses the `__proto__` setter).
 */
function safeSet<T extends object>(dst: T, key: string, value: unknown): void {
  if (key === '__proto__' || key === 'constructor' || key === 'prototype')
    return;
  Object.defineProperty(dst, key, {
    value,
    writable: true,
    enumerable: true,
    configurable: true,
  });
}

/**
 * Recursively merges `src` into `dst` in place and returns `dst`. Raises on
 * conflicting scalar values so duplicate plugin configs never silently
 * overwrite each other (matches the Python `merge()` contract).
 *
 * Skips `__proto__`, `constructor`, and `prototype` keys to prevent prototype
 * pollution via user-supplied YAML.
 */
export function deepMerge<T extends Record<string, unknown>>(
  src: Record<string, unknown>,
  dst: T,
  prefix = '',
): T {
  for (const [key, value] of Object.entries(src)) {
    if (isForbiddenKey(key)) continue;
    const dstRecord = dst as Record<string, unknown>;
    if (isPlainObject(value)) {
      const existing = dstRecord[key];
      const node = isPlainObject(existing) ? existing : {};
      safeSet(dstRecord, key, node);
      deepMerge(value, node, `${prefix}${key}.`);
    } else {
      if (key in dst && !isEqual(dstRecord[key], value)) {
        throw new InstallException(
          `Config key '${prefix}${key}' defined differently for 2 dynamic plugins`,
        );
      }
      safeSet(dstRecord, key, value);
    }
  }
  return dst;
}

/**
 * Read a dynamic-plugins config file (main or included), parse its `plugins`,
 * and merge each into `allPlugins` using the OCI or NPM merger as appropriate.
 */
export async function mergePluginsFromFile(
  configFile: string,
  allPlugins: PluginMap,
  level: number,
  imageCache?: OciImageCache,
): Promise<void> {
  const content = parseYaml(await fs.readFile(configFile, 'utf8'));
  if (!isPlainObject(content)) {
    throw new InstallException(`${configFile} must contain a mapping`);
  }
  const plugins = (content as DynamicPluginsConfig).plugins;
  if (!Array.isArray(plugins)) {
    throw new InstallException(
      `${configFile} must contain a 'plugins' list (got ${typeof plugins})`,
    );
  }
  for (const plugin of plugins) {
    await mergePlugin(plugin, allPlugins, configFile, level, imageCache);
  }
}

export async function mergePlugin(
  plugin: Plugin,
  allPlugins: PluginMap,
  configFile: string,
  level: number,
  imageCache?: OciImageCache,
): Promise<void> {
  if (typeof plugin.package !== 'string') {
    throw new InstallException(
      `content of the 'plugins.package' field must be a string in ${configFile}`,
    );
  }
  if (isOciUrl(plugin.package)) {
    await mergeOciPlugin(plugin, allPlugins, configFile, level, imageCache);
  } else {
    mergeNpmPlugin(plugin, allPlugins, configFile, level);
  }
}

function mergeNpmPlugin(
  plugin: Plugin,
  allPlugins: PluginMap,
  configFile: string,
  level: number,
): void {
  const key = npmPluginKey(plugin.package);
  doMerge(key, plugin, allPlugins, configFile, level);
}

async function mergeOciPlugin(
  plugin: Plugin,
  allPlugins: PluginMap,
  configFile: string,
  level: number,
  imageCache: OciImageCache | undefined,
): Promise<void> {
  let parsed = await ociPluginKey(plugin.package, imageCache);

  if (parsed.inherit) {
    if (level === 0) {
      throw new InstallException(
        `Cannot use {{inherit}} in included plugin configuration '${plugin.package}' in ${configFile}. ` +
          `Define a concrete tag or digest in included files.`,
      );
    }
    const pluginName = extractPluginName(plugin.package);
    plugin.package = resolveInheritPackage(
      plugin.package,
      Object.values(allPlugins).map(base => ({ package: base.package })),
    );
    parsed = await ociPluginKey(plugin.package, imageCache);
    log(
      `\n======= Inheriting version \`${parsed.version}\` and plugin path \`${parsed.resolvedPath ?? ''}\` for '${pluginName ?? plugin.package}'`,
    );
  }

  if (!plugin.package.includes('!') && parsed.resolvedPath) {
    plugin.package = `${plugin.package}!${parsed.resolvedPath}`;
  }

  plugin.version = parsed.version;

  const existing = allPlugins[parsed.pluginKey];
  if (!existing) {
    log(
      `\n======= Adding new dynamic plugin configuration for version \`${parsed.version}\` of ${parsed.pluginKey}`,
    );
    plugin.last_modified_level = level;
    allPlugins[parsed.pluginKey] = plugin;
    return;
  }

  log(`\n======= Overriding dynamic plugin configuration ${parsed.pluginKey}`);
  if (existing.last_modified_level === level) {
    throw new InstallException(
      `Duplicate plugin configuration for ${plugin.package} found in ${configFile}.`,
    );
  }

  existing.package = plugin.package;
  if (existing.version !== parsed.version) {
    log(
      `INFO: Overriding version for ${parsed.pluginKey} from \`${existing.version ?? ''}\` to \`${parsed.version}\``,
    );
  }
  existing.version = parsed.version;
  copyPluginFields(plugin, existing, [
    'package',
    'version',
    'last_modified_level',
  ]);
  existing.last_modified_level = level;
}

export type InheritCandidate = {
  package: string;
  sourceFile?: string;
};

type ParsedInheritCandidate = InheritCandidate & {
  image: string;
  path: string | null;
  registry: string;
};

function formatInheritCandidates(candidates: ParsedInheritCandidate[]): string {
  return candidates
    .map(candidate => {
      const source = candidate.sourceFile
        ? ` (in ${candidate.sourceFile})`
        : '';
      return `  - ${candidate.package}${source}`;
    })
    .join('\n');
}

function ambiguousInheritError(
  pluginName: string,
  candidates: ParsedInheritCandidate[],
  hint: string,
): InstallException {
  return new InstallException(
    `Cannot use {{inherit}} for '${pluginName}': multiple included plugin configurations ` +
      `share this final OCI segment:\n${formatInheritCandidates(candidates)}\n${hint}`,
  );
}

/**
 * Resolve one `{{inherit}}` package by the final OCI path segment, matching the
 * operator's lookup behaviour. The returned package is concrete, so callers
 * resume the existing full registry + plugin-path merge semantics afterwards.
 */
export function resolveInheritPackage(
  packageUrl: string,
  candidates: readonly InheritCandidate[],
): string {
  const requested = tryParseOciRegistryAndPath(packageUrl);
  const pluginName = extractPluginName(packageUrl);
  if (!requested || !pluginName || !isOciInherit(packageUrl)) {
    throw new InstallException(
      `Cannot resolve invalid {{inherit}} OCI package '${packageUrl}'`,
    );
  }

  const matches: ParsedInheritCandidate[] = [];
  for (const candidate of candidates) {
    const parsed = tryParseOciRegistryAndPath(candidate.package);
    if (
      !parsed ||
      isOciInherit(candidate.package) ||
      extractPluginName(candidate.package) !== pluginName
    ) {
      continue;
    }
    const separator = candidate.package.indexOf('!');
    matches.push({
      ...candidate,
      image:
        separator === -1
          ? candidate.package
          : candidate.package.slice(0, separator),
      path: parsed.path,
      registry: parsed.registry,
    });
  }

  if (matches.length === 0) {
    throw new InstallException(
      `Cannot use {{inherit}} for '${pluginName}': no existing plugin configuration found. ` +
        `Ensure a plugin named '${pluginName}' is defined in an included file with an explicit version.`,
    );
  }

  if (new Set(matches.map(candidate => candidate.registry)).size > 1) {
    throw ambiguousInheritError(
      pluginName,
      matches,
      'The last OCI path segment must identify a single image in included files.',
    );
  }

  let selected: ParsedInheritCandidate;
  if (requested.path) {
    const exactPathMatches = matches.filter(
      candidate => candidate.path === requested.path,
    );
    if (exactPathMatches.length === 1) {
      selected = exactPathMatches[0] as ParsedInheritCandidate;
    } else if (exactPathMatches.length > 1) {
      throw ambiguousInheritError(
        pluginName,
        exactPathMatches,
        `The explicit plugin path '${requested.path}' does not identify a single included configuration.`,
      );
    } else if (new Set(matches.map(candidate => candidate.image)).size === 1) {
      // The operator allows an explicit user path to replace the catalog path.
      selected = matches[0] as ParsedInheritCandidate;
    } else {
      throw ambiguousInheritError(
        pluginName,
        matches,
        `Specify a plugin path that identifies one included configuration.`,
      );
    }
  } else {
    if (matches.length > 1) {
      throw ambiguousInheritError(
        pluginName,
        matches,
        `Specify which plugin to inherit using '${packageUrl}!<plugin-path>'.`,
      );
    }
    selected = matches[0] as ParsedInheritCandidate;
  }

  return requested.path
    ? `${selected.image}!${requested.path}`
    : selected.package;
}

function doMerge(
  key: string,
  plugin: Plugin,
  allPlugins: PluginMap,
  configFile: string,
  level: number,
): void {
  const existing = allPlugins[key];
  if (!existing) {
    log(`\n======= Adding new dynamic plugin configuration for ${key}`);
    plugin.last_modified_level = level;
    allPlugins[key] = plugin;
    return;
  }
  log(`\n======= Overriding dynamic plugin configuration ${key}`);
  if (existing.last_modified_level === level) {
    throw new InstallException(
      `Duplicate plugin configuration for ${plugin.package} found in ${configFile}.`,
    );
  }
  copyPluginFields(plugin, existing, ['last_modified_level']);
  existing.last_modified_level = level;
}

function copyPluginFields(
  src: Plugin,
  dst: Plugin,
  skip: ReadonlyArray<string>,
): void {
  const skipSet = new Set<string>(skip);
  for (const [k, v] of Object.entries(src)) {
    if (skipSet.has(k) || isForbiddenKey(k)) continue;
    safeSet(dst, k, v);
  }
  // When the override introduces a valid boolean activation field, clear the
  // opposite so the merged record never carries both (which would trigger a
  // spurious "specifies both" warning in isPluginDisabled).  Only act on
  // actual booleans — a non-boolean value is treated as "unset" by
  // isPluginDisabled and should not displace a valid value on dst.
  if (typeof src.enabled === 'boolean' && 'disabled' in dst)
    delete (dst as Record<string, unknown>).disabled;
  if (typeof src.disabled === 'boolean' && 'enabled' in dst)
    delete (dst as Record<string, unknown>).enabled;
}

function isEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) && Array.isArray(b)) return isArrayEqual(a, b);
  if (isPlainObject(a) && isPlainObject(b)) return isObjectEqual(a, b);
  return false;
}

function isArrayEqual(a: readonly unknown[], b: readonly unknown[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((v, i) => isEqual(v, b[i]));
}

function isObjectEqual(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
): boolean {
  const keysA = Object.keys(a);
  if (keysA.length !== Object.keys(b).length) return false;
  return keysA.every(k => isEqual(a[k], b[k]));
}

type EntryState = { disabled: boolean; level: number };

type NameEntry = {
  package: string;
  registry: string;
  sourceFile: string;
};

type PreMergeState = {
  perEntryState: Map<string, EntryState>;
  pathlessRegistries: Map<string, string>;
  definedPaths: Map<string, Map<string, string>>;
  namesByLevel: Map<string, NameEntry>;
};

function entryKeyOf(registry: string, path: string | null): string {
  return `${registry} ${path ?? ''}`;
}

function logInvalidOciFormat(
  pkg: string,
  sourceFile: string,
  disabled: boolean,
): void {
  if (!disabled) {
    throw new InstallException(
      `oci package '${pkg}' is not in the expected format '${OCI_PROTO}<registry>:<tag>' ` +
        `or '${OCI_PROTO}<registry>@<algo>:<digest>' (optionally followed by '!<path>') in ${sourceFile} ` +
        `where <registry> may include a port (e.g. host:5000/path) ` +
        `and <algo> is one of ${RECOGNIZED_ALGORITHMS.join(', ')}`,
    );
  }
  log(
    `WARNING: Skipping disabled OCI plugin with invalid format: '${pkg}' in ${sourceFile}. ` +
      `Expected format: '${OCI_PROTO}<registry>:<tag>' or '${OCI_PROTO}<registry>@<algo>:<digest>' ` +
      `(optionally followed by '!<path>') where <registry> may include a port (e.g. host:5000/path) ` +
      `and <algo> is one of ${RECOGNIZED_ALGORITHMS.join(', ')}`,
  );
}

/**
 * Record the entry's disabled state at its level. Returns `false` when the
 * entry is a duplicate at the same level (warning logged for disabled-dups,
 * throws for enabled-dups) so the caller can skip recording its path/source.
 */
function recordEntryState(
  state: PreMergeState,
  registry: string,
  path: string | null,
  level: number,
  disabled: boolean,
  pkg: string,
  sourceFile: string,
): boolean {
  const key = entryKeyOf(registry, path);
  const existing = state.perEntryState.get(key);
  if (!existing) {
    state.perEntryState.set(key, { disabled, level });
    return true;
  }
  if (existing.level === level) {
    const pathSuffix = path ? `!${path}` : '';
    if (!disabled) {
      throw new InstallException(
        `Duplicate OCI plugin configuration for ${registry}${pathSuffix} ` +
          `found at the same level in ${sourceFile}: ${pkg}`,
      );
    }
    log(
      `WARNING: Skipping duplicate disabled OCI plugin configuration for ${registry}${pathSuffix} in ${sourceFile}`,
    );
    return false;
  }
  if (level > existing.level) state.perEntryState.set(key, { disabled, level });
  return true;
}

function recordRegistryPath(
  state: PreMergeState,
  registry: string,
  path: string | null,
  sourceFile: string,
): void {
  if (!path) {
    state.pathlessRegistries.set(registry, sourceFile);
    return;
  }
  let bucket = state.definedPaths.get(registry);
  if (!bucket) {
    bucket = new Map<string, string>();
    state.definedPaths.set(registry, bucket);
  }
  bucket.set(path, sourceFile);
}

/**
 * Reject ambiguous same-level image-name collisions while retaining concrete
 * registry/path identity for normal merging. Multiple explicit plugin paths
 * from the same image remain valid until RHIDP-16807 removes that syntax.
 */
function recordNameAtLevel(
  state: PreMergeState,
  registry: string,
  level: number,
  pkg: string,
  sourceFile: string,
): void {
  const pluginName = extractPluginName(pkg);
  if (!pluginName) return;
  const key = `${level}\0${pluginName}`;
  const existing = state.namesByLevel.get(key);
  if (!existing) {
    state.namesByLevel.set(key, { package: pkg, registry, sourceFile });
    return;
  }
  if (existing.registry === registry) return;
  throw new InstallException(
    `Duplicate OCI plugin configurations '${existing.package}' (in ${existing.sourceFile}) and ` +
      `'${pkg}' (in ${sourceFile}) both resolve to the plugin name '${pluginName}'. ` +
      `The last OCI path segment must identify a single image at each merge level.`,
  );
}

function processOciEntry(
  state: PreMergeState,
  plugin: PluginSpec,
  level: number,
  sourceFile: string,
): void {
  const pkg = plugin.package;
  if (typeof pkg !== 'string' || !isOciUrl(pkg)) return;
  const disabled = isPluginDisabled(plugin);
  const parsed = tryParseOciRegistryAndPath(pkg);
  if (!parsed) {
    logInvalidOciFormat(pkg, sourceFile, disabled);
    return;
  }
  const { registry, path } = parsed;
  recordNameAtLevel(state, registry, level, pkg, sourceFile);
  if (
    !recordEntryState(state, registry, path, level, disabled, pkg, sourceFile)
  )
    return;
  recordRegistryPath(state, registry, path, sourceFile);
}

function formatExplicitPaths(bucket: Map<string, string>): string {
  return [...bucket.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([p, src]) => `${p} (in ${src})`)
    .join('\n  - ');
}

function validateAmbiguousPathless(state: PreMergeState): void {
  for (const [registry, pathlessSource] of state.pathlessRegistries) {
    const bucket = state.definedPaths.get(registry);
    if (!bucket || bucket.size <= 1) continue;
    const formatted = formatExplicitPaths(bucket);
    const pathlessState = state.perEntryState.get(entryKeyOf(registry, null));
    if (pathlessState?.disabled) {
      log(
        `WARNING: Skipping disabled ambiguous path-less OCI reference for ${registry} in ${pathlessSource}: ` +
          `multiple path-specific entries exist:\n  - ${formatted}\n` +
          `Cannot use path-less syntax for multi-plugin images. ` +
          `Please specify a !<plugin-path> suffix for the plugin`,
      );
      continue;
    }
    throw new InstallException(
      `Ambiguous path-less OCI reference for ${registry} in ${pathlessSource}: ` +
        `multiple path-specific entries exist:\n  - ${formatted}\n` +
        `Cannot use path-less syntax for multi-plugin images. ` +
        `Please specify a !<plugin-path> suffix for the plugin.`,
    );
  }
}

function effectiveRegistryDisabled(
  state: PreMergeState,
  registry: string,
): boolean {
  const pathlessState = state.perEntryState.get(entryKeyOf(registry, null));
  if (!pathlessState) return false;
  const bucket = state.definedPaths.get(registry);
  if (bucket?.size !== 1) return pathlessState.disabled;
  const [singlePath] = bucket.keys();
  if (singlePath === undefined) return pathlessState.disabled;
  const definedState = state.perEntryState.get(
    entryKeyOf(registry, singlePath),
  );
  if (definedState && definedState.level > pathlessState.level)
    return definedState.disabled;
  return pathlessState.disabled;
}

function computeDisabledRegistries(state: PreMergeState): Set<string> {
  const out = new Set<string>();
  for (const registry of state.pathlessRegistries.keys()) {
    if (effectiveRegistryDisabled(state, registry)) out.add(registry);
  }
  return out;
}

/**
 * Pre-merge pass that walks every OCI plugin entry from the included files
 * (level 0) and the main config (level 1) and returns the set of OCI
 * registries that will be effectively disabled after the merge. Computed
 * BEFORE any skopeo work so disabled plugins never trigger a remote fetch.
 *
 * Ports `pre_merge_oci_disabled_state` from the Python installer
 * (`install-dynamic-plugins.py`). Only inspects `package` and `disabled` —
 * does NOT merge `pluginConfig`.
 *
 * Throws an `InstallException` for:
 *   - invalid OCI package strings on enabled entries,
 *   - duplicate enabled OCI entries declared at the same level,
 *   - different same-level images that share a final OCI path segment,
 *   - path-less enabled references that collide with multiple explicit-path
 *     entries from the same image (ambiguous).
 *
 * Logs a warning (and skips the offending entry) for the equivalent
 * `disabled: true` scenarios — operators can still ship a disabled
 * descriptor without aborting the install.
 */
export function preMergeOciDisabledState(
  includePluginLists: ReadonlyArray<IncludePluginList>,
  mainPlugins: ReadonlyArray<PluginSpec>,
  mainConfigFile: string,
): Set<string> {
  const state: PreMergeState = {
    perEntryState: new Map(),
    pathlessRegistries: new Map(),
    definedPaths: new Map(),
    namesByLevel: new Map(),
  };
  for (const [file, plugins] of includePluginLists) {
    for (const plugin of plugins) processOciEntry(state, plugin, 0, file);
  }
  for (const plugin of mainPlugins)
    processOciEntry(state, plugin, 1, mainConfigFile);

  validateAmbiguousPathless(state);
  return computeDisabledRegistries(state);
}

/**
 * Drop every OCI plugin whose registry is in the disabled set, plus invalid
 * OCI entries flagged `disabled: true` (a no-op the operator clearly intends
 * to remove). Non-OCI entries pass through unchanged.
 */
export function filterDisabledOciPlugins(
  plugins: ReadonlyArray<PluginSpec>,
  disabledRegistries: ReadonlySet<string>,
): PluginSpec[] {
  const out: PluginSpec[] = [];
  for (const plugin of plugins) {
    const pkg = plugin.package;
    if (typeof pkg === 'string' && isOciUrl(pkg)) {
      const parsed = tryParseOciRegistryAndPath(pkg);
      if (parsed && disabledRegistries.has(parsed.registry)) {
        log(`\n======= Disabling OCI plugin ${pkg}`);
        continue;
      }
      if (!parsed && isPluginDisabled(plugin)) {
        log(`\n======= Disabling OCI plugin ${pkg}`);
        continue;
      }
    }
    out.push(plugin);
  }
  return out;
}
