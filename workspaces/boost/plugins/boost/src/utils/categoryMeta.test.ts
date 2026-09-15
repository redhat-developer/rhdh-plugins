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

import { RiBrainLine, RiMagicLine } from '@remixicon/react';

import { getAllCategories, getCategoryMeta } from './categoryMeta';

describe('getCategoryMeta', () => {
  it('returns Skills metadata for skill', () => {
    const meta = getCategoryMeta('skill');
    expect(meta.label).toBe('Skills');
    expect(meta.icon).toBe(RiMagicLine);
  });

  it('matches specType case-insensitively', () => {
    expect(getCategoryMeta('MCP-Server').label).toBe('MCP Servers');
  });

  it('returns Unknown fallback for missing or unrecognized types', () => {
    expect(getCategoryMeta(undefined).label).toBe('Unknown');
    expect(getCategoryMeta('not-a-category').icon).toBe(RiBrainLine);
  });
});

describe('getAllCategories', () => {
  it('returns every known category id and label', () => {
    const categories = getAllCategories();
    expect(categories).toEqual(
      expect.arrayContaining([
        { id: 'skill', label: 'Skills' },
        { id: 'agent', label: 'Agents' },
        { id: 'mcp-server', label: 'MCP Servers' },
      ]),
    );
    expect(categories).toHaveLength(7);
  });
});
