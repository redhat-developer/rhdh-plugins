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

/**
 * Frontend / API route helpers for the cost-management plugin.
 *
 * Defaults match the current workspace (cost-management 1.3.x / 2.x):
 * - Local app shell mounts Optimizations at `/cost-management/optimizations`
 * - Live RHDH dynamic plugin uses the same paths
 *
 * Override via env vars when testing a non-standard mount.
 */
const isLiveCluster = !!process.env.PLAYWRIGHT_URL;

export const PLUGIN_ROUTE_BASE: string =
  process.env.PLUGIN_ROUTE_BASE ??
  (isLiveCluster
    ? '/cost-management/optimizations'
    : '/cost-management/optimizations');

export const OPENSHIFT_ROUTE: string =
  process.env.OPENSHIFT_ROUTE_PATH ?? '/cost-management/openshift';

export const API_BASE: string = process.env.API_BASE ?? '/api/cost-management';

/** Legacy 1.2.x detection kept for optional CI overrides; defaults to false. */
export const isLegacyRos: boolean = (
  process.env.ROS_DYNAMIC_PLUGINS_VERSION ?? ''
).startsWith('1.2');

/**
 * Regex that matches the detail-page URL (list path + UUID segment).
 */
export function detailPageUrlPattern(): RegExp {
  const escaped = PLUGIN_ROUTE_BASE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`${escaped}/[a-f0-9]`);
}

/**
 * Regex that matches the list-page URL.
 */
export function listPageUrlPattern(): RegExp {
  const escaped = PLUGIN_ROUTE_BASE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(escaped);
}

/**
 * Regex that matches the OpenShift page URL.
 */
export function openshiftPageUrlPattern(): RegExp {
  const escaped = OPENSHIFT_ROUTE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(escaped);
}
