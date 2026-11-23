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

/** HTML link target values supported for sidebar menu items. */
export type SidebarHtmlLinkTarget = '_blank' | '_self';

/** Raw config value before validation. */
export type SidebarHtmlLinkTargetInput = string | undefined;

/**
 * Whether the sidebar `to` URL is external (same heuristic as global-header
 * {@link MenuItemLink}).
 */
export function isExternalSidebarUrl(to: string): boolean {
  return to.startsWith('http://') || to.startsWith('https://');
}

/**
 * Normalizes configured `target` to supported HTML values; invalid values are
 * treated as unset.
 */
export function parseSidebarHtmlLinkTarget(
  value: SidebarHtmlLinkTargetInput,
): SidebarHtmlLinkTarget | undefined {
  if (value === '_blank' || value === '_self') {
    return value;
  }
  return undefined;
}

export interface ResolvedSidebarLinkAttributes {
  target?: SidebarHtmlLinkTarget;
  rel?: string;
  externalLinkIcon?: boolean;
}

/**
 * Resolves `target`, `rel`, and external-link icon for a sidebar row.
 * Icon follows global-header: external URL with `_blank` only.
 */
export function resolveSidebarLinkAttributes(
  to: string | undefined,
  configuredTarget: SidebarHtmlLinkTargetInput,
): ResolvedSidebarLinkAttributes {
  const target = parseSidebarHtmlLinkTarget(configuredTarget);
  if (!to || !target) {
    return {};
  }
  const external = isExternalSidebarUrl(to);
  if (target === '_blank') {
    return {
      target: '_blank',
      rel: 'noopener noreferrer',
      externalLinkIcon: external,
    };
  }
  return { target: '_self' };
}
