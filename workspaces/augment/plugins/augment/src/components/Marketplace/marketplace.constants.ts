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
 * Marketplace layout constants.
 * Change these to adjust grid density, card sizing, and pagination.
 */

export const GRID_COLUMNS = { xs: 1, sm: 2, md: 3, lg: 4 } as const;
export const GRID_GAP = 2.5;
export const CARD_HEIGHT = 150;
export const PAGE_SIZE = 16;
export const MAX_WIDTH = 1200;

export const HERO_PADDING = { xs: 2.5, sm: 3 } as const;
export const SEARCH_PADDING = { py: 1, px: 1.5 } as const;

export const AVATAR_SIZE = 40;
export const AVATAR_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1', '#ef4444'];

export const FRAMEWORK_COLORS: Record<string, string> = {
  ADK: '#0d9488',
  GoogleADK: '#3b82f6',
  LangGraph: '#8b5cf6',
  llamastack: '#f59e0b',
  Other: '#6b7280',
};

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function getFrameworkColor(framework?: string): string {
  if (!framework) return '#6b7280';
  return FRAMEWORK_COLORS[framework] ?? '#6b7280';
}

export const LIFECYCLE_STAGE_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: '#6b7280' },
  registered: { label: 'In Review', color: '#f59e0b' },
  deployed: { label: 'Published', color: '#10b981' },
};
