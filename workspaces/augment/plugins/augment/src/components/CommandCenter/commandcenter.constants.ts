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
 * Command Center layout and behavior constants.
 * Modify these to adjust the ops admin experience.
 */

export const CONTENT_MAX_WIDTH = 960;
export const SECTION_GAP = 3;
export const CARD_GAP = 2;

export const HEALTH_THRESHOLDS = {
  healthyRatio: 0.9,
  warningRatio: 0.5,
} as const;

export const STATUS_COLORS = {
  healthy: '#10b981',
  warning: '#f59e0b',
  critical: '#ef4444',
  neutral: '#6b7280',
} as const;

export const LIFECYCLE_COLORS = {
  draft: '#6b7280',
  registered: '#f59e0b',
  deployed: '#10b981',
} as const;
