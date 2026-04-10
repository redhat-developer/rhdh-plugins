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
 * Deterministic string-to-HSL color assignment for agent names.
 * Inspired by ADK Web's StringToColorService — produces stable, visually
 * distinct colors so each agent in a multi-agent conversation has a
 * recognizable identity throughout the chat.
 */

const PALETTE = [
  { bg: '#e3f2fd', fg: '#1565c0' }, // blue
  { bg: '#f3e5f5', fg: '#7b1fa2' }, // purple
  { bg: '#e8f5e9', fg: '#2e7d32' }, // green
  { bg: '#fff3e0', fg: '#e65100' }, // orange
  { bg: '#fce4ec', fg: '#c62828' }, // red
  { bg: '#e0f7fa', fg: '#00838f' }, // cyan
  { bg: '#f9fbe7', fg: '#827717' }, // lime
  { bg: '#ede7f6', fg: '#4527a0' }, // deep purple
  { bg: '#e0f2f1', fg: '#00695c' }, // teal
  { bg: '#fff8e1', fg: '#ff8f00' }, // amber
] as const;

const DARK_PALETTE = [
  { bg: '#1565c01a', fg: '#90caf9' }, // blue
  { bg: '#7b1fa21a', fg: '#ce93d8' }, // purple
  { bg: '#2e7d321a', fg: '#a5d6a7' }, // green
  { bg: '#e651001a', fg: '#ffab91' }, // orange
  { bg: '#c628281a', fg: '#ef9a9a' }, // red
  { bg: '#00838f1a', fg: '#80deea' }, // cyan
  { bg: '#8277171a', fg: '#e6ee9c' }, // lime
  { bg: '#4527a01a', fg: '#b39ddb' }, // deep purple
  { bg: '#00695c1a', fg: '#80cbc4' }, // teal
  { bg: '#ff8f001a', fg: '#ffe082' }, // amber
] as const;

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export interface AgentColor {
  bg: string;
  fg: string;
}

export function getAgentColor(
  agentName: string,
  mode: 'light' | 'dark' = 'light',
): AgentColor {
  const palette = mode === 'dark' ? DARK_PALETTE : PALETTE;
  const index = hashString(agentName) % palette.length;
  return palette[index];
}
