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

const STATUS_PRIORITY: Record<string, number> = {
  Ready: 0,
  Running: 0,
  Active: 0,
  Pending: 1,
  Building: 1,
  'Not Ready': 2,
  Failed: 3,
  Error: 3,
};

export function sortAgents(
  agents: AgentWithCard[],
  key: 'name' | 'status' | 'newest',
): AgentWithCard[] {
  const sorted = [...agents];
  switch (key) {
    case 'name':
      sorted.sort((a, b) => {
        const an = (a.agentCard?.name || a.name).toLowerCase();
        const bn = (b.agentCard?.name || b.name).toLowerCase();
        return an.localeCompare(bn);
      });
      break;
    case 'status':
      sorted.sort((a, b) => {
        const ap = STATUS_PRIORITY[a.status] ?? 9;
        const bp = STATUS_PRIORITY[b.status] ?? 9;
        if (ap !== bp) return ap - bp;
        return (a.agentCard?.name || a.name).localeCompare(
          b.agentCard?.name || b.name,
        );
      });
      break;
    case 'newest':
      sorted.sort((a, b) => {
        const at = a.createdAt ?? '';
        const bt = b.createdAt ?? '';
        return bt.localeCompare(at);
      });
      break;
    default:
      break;
  }
  return sorted;
}

export function isAgentReady(status: string): boolean {
  return ['Ready', 'Running', 'Active'].includes(status);
}

/**
 * Strips markdown formatting and technical headings from agent descriptions,
 * returning a clean 1-2 sentence summary suitable for card display.
 */
export function sanitizeDescription(raw: string, maxLength = 160): string {
  let text = raw;

  // Remove everything after the first markdown heading (## or #)
  const headingIdx = text.search(/\n#{1,3}\s/);
  if (headingIdx > 0) {
    text = text.slice(0, headingIdx);
  }

  // Remove markdown bold/italic
  text = text.replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1');
  text = text.replace(/_{1,3}([^_]+)_{1,3}/g, '$1');

  // Remove markdown links [text](url) -> text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Remove inline code backticks
  text = text.replace(/`([^`]+)`/g, '$1');

  // Remove markdown headings at start of line
  text = text.replace(/^#{1,6}\s+/gm, '');

  // Remove bullet points
  text = text.replace(/^[\s]*[-*+]\s+/gm, '');

  // Remove "Input Parameters", "Key Features", etc. labels
  text = text.replace(
    /\b(Input Parameters|Key Features|Parameters|Usage|Description)\s*[-:·]\s*/gi,
    '',
  );

  // Collapse whitespace
  text = text.replace(/\s+/g, ' ').trim();

  // Truncate to max length at a word boundary
  if (text.length > maxLength) {
    const truncated = text.slice(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    text = `${truncated.slice(0, lastSpace > 80 ? lastSpace : maxLength)}...`;
  }

  return text || 'No description available';
}
