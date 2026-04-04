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

import type {
  KagentiAgentSummary,
  KagentiAgentCard,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';

export interface AgentWithCard extends KagentiAgentSummary {
  agentCard?: KagentiAgentCard;
}

export const STATUS_COLORS: Record<
  string,
  'success' | 'warning' | 'error' | 'default'
> = {
  Running: 'success',
  Ready: 'success',
  Active: 'success',
  Pending: 'warning',
  Building: 'warning',
  Failed: 'error',
  Error: 'error',
};

export const PINNED_KEY = 'augment:pinned-agents';
export const RECENT_KEY = 'augment:recent-agents';
export const MAX_RECENT = 5;

export function readJsonArray(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function writeJsonArray(key: string, arr: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(arr));
  } catch {
    /* storage unavailable */
  }
}

export function getAgentAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 50%)`;
}
