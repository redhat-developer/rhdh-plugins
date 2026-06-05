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

// [@scope/]name[@version]
const NPM_PACKAGE_PATTERN = /^(@[^/]+\/)?([^@]+)(?:@(.+))?$/;
// alias@npm:[@scope/]name[@version]
const NPM_ALIAS_PATTERN = /^([^@]+)@npm:(@[^/]+\/)?([^@]+)(?:@(.+))?$/;
// user/repo
const GITHUB_SHORTHAND_PATTERN = /^([^/@]+)\/([^/#]+)(?:#(.+))?$/;

const GIT_URL_PATTERNS: RegExp[] = [
  /^git\+https?:\/\/[^#]+(?:#(.+))?$/,
  /^git\+ssh:\/\/[^#]+(?:#(.+))?$/,
  /^git:\/\/[^#]+(?:#(.+))?$/,
  /^https:\/\/github\.com\/[^/]+\/[^/#]+(?:\.git)?(?:#(.+))?$/,
  /^git@github\.com:[^/]+\/[^/#]+(?:\.git)?(?:#(.+))?$/,
  /^github:([^/@]+)\/([^/#]+)(?:#(.+))?$/,
];

export function npmPluginKey(pkg: string): string {
  // Local packages and tarballs have no version to strip.
  if (pkg.startsWith('./') || pkg.endsWith('.tgz')) return pkg;

  // Aliases: "my-alias@npm:real-pkg@1.2.3" -> "my-alias@npm:real-pkg"
  const aliasKey = tryParseAlias(pkg);
  if (aliasKey) return aliasKey;

  // Git URLs / GitHub shorthand: strip `#ref` suffix.
  if (isGitLikeSpec(pkg)) return stripRefSuffix(pkg);

  return stripStandardNpmVersion(pkg);
}

function tryParseAlias(pkg: string): string | null {
  const m = NPM_ALIAS_PATTERN.exec(pkg);
  if (!m) return null;
  const [, aliasName, scope, name] = m;
  return `${aliasName}@npm:${scope ?? ''}${name}`;
}

function isGitLikeSpec(pkg: string): boolean {
  if (GIT_URL_PATTERNS.some(re => re.test(pkg))) return true;
  // GitHub shorthand `user/repo#ref` — but not scoped packages or full URLs.
  if (pkg.includes('://') || pkg.startsWith('@')) return false;
  return GITHUB_SHORTHAND_PATTERN.test(pkg);
}

function stripRefSuffix(pkg: string): string {
  const hash = pkg.indexOf('#');
  return hash >= 0 ? pkg.slice(0, hash) : pkg;
}

function stripStandardNpmVersion(pkg: string): string {
  const m = NPM_PACKAGE_PATTERN.exec(pkg);
  if (!m) return pkg;
  const [, scope, name] = m;
  return `${scope ?? ''}${name}`;
}
