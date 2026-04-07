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
 * The frontend route base path for the plugin.
 *
 * When running against a local dev server the plugin is mounted at
 * `/redhat-resource-optimization`.  When deployed as a dynamic plugin
 * inside RHDH the route is `/cost-management/optimizations`.
 *
 * Override via `PLUGIN_ROUTE_BASE` env var for custom deployments.
 */
const isLiveCluster = !!process.env.PLAYWRIGHT_URL;

/**
 * True when the deployed ROS plugin is the legacy `redhat-resource-optimization`
 * bundle (1.2.x) rather than the newer `cost-management` bundle (1.3.x+).
 *
 * Detection: if ROS_DYNAMIC_PLUGINS_VERSION starts with "1.2" we treat it as
 * legacy. The env var is already set by the deploy script and can be forwarded
 * to the Playwright container via the Jenkins pipeline.
 */
export const isLegacyRos: boolean = (
  process.env.ROS_DYNAMIC_PLUGINS_VERSION ?? ''
).startsWith('1.2');

const useCostManagementRoutes = isLiveCluster && !isLegacyRos;

export const PLUGIN_ROUTE_BASE: string =
  process.env.PLUGIN_ROUTE_BASE ??
  (useCostManagementRoutes
    ? '/cost-management/optimizations'
    : '/redhat-resource-optimization');

export const OPENSHIFT_ROUTE: string =
  process.env.OPENSHIFT_ROUTE_PATH ??
  (useCostManagementRoutes
    ? '/cost-management/openshift'
    : '/redhat-resource-optimization/ocp');

/**
 * The backend API base path.
 *
 * Local dev / legacy: `/api/redhat-resource-optimization`
 * Dynamic plugin 1.3.x+: `/api/cost-management`
 */
export const API_BASE: string =
  process.env.API_BASE ??
  (useCostManagementRoutes
    ? '/api/cost-management'
    : '/api/redhat-resource-optimization');

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
