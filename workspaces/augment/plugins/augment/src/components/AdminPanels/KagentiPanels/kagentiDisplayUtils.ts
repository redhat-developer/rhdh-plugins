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

export function formatValue(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'object') {
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
  return String(v);
}

export function formatDateTime(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

export function readSpecField(
  spec: Record<string, unknown>,
  ...keys: string[]
): unknown {
  for (const k of keys) {
    if (spec[k] !== undefined && spec[k] !== null) return spec[k];
  }
  return undefined;
}

export function statusChipColor(
  status: string | undefined,
): 'success' | 'error' | 'warning' | 'info' | 'default' {
  if (!status) return 'default';
  const s = status.toLowerCase();
  if (s === 'ready' || s === 'running' || s === 'active' || s === 'true')
    return 'success';
  if (s === 'error' || s === 'failed') return 'error';
  if (s === 'building' || s === 'pending') return 'info';
  if (s === 'warning' || s === 'degraded') return 'warning';
  return 'default';
}

export function buildRunPhaseChipColor(
  phase?: string,
): 'success' | 'error' | 'info' | 'default' {
  const p = phase?.toLowerCase();
  if (p === 'succeeded') return 'success';
  if (p === 'failed' || p === 'cancelled' || p === 'canceled') return 'error';
  if (p === 'running' || p === 'pending' || p === 'workqueue') return 'info';
  return 'default';
}

export function toolSummaryStatusChipColor(
  status: string | undefined,
): 'success' | 'warning' | 'default' {
  if (!status) return 'default';
  const s = status.toLowerCase();
  if (['running', 'ready', 'active'].includes(s)) return 'success';
  if (['pending', 'building'].includes(s)) return 'warning';
  return 'default';
}

export function routeReadyChipColor(
  ready: unknown,
): 'success' | 'warning' | 'default' {
  if (ready === true) return 'success';
  if (ready === false) return 'warning';
  return 'default';
}

export function routeStatusStringChipColor(
  statusField: unknown,
): 'success' | 'error' | 'default' {
  const s = String(statusField).toLowerCase();
  if (s === 'ready' || s === 'active') return 'success';
  if (s === 'failed') return 'error';
  return 'default';
}
