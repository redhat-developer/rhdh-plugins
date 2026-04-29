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

import {
  PROVIDER_REGISTRY,
  getProviderDescriptor,
  getAllProviderDescriptors,
  isValidProviderType,
} from './registry';

describe('provider registry', () => {
  it('PROVIDER_REGISTRY contains googleadk and kagenti entries', () => {
    expect(PROVIDER_REGISTRY.has('googleadk')).toBe(true);
    expect(PROVIDER_REGISTRY.has('kagenti')).toBe(true);
  });

  it('PROVIDER_REGISTRY does not contain llamastack', () => {
    expect(PROVIDER_REGISTRY.has('llamastack')).toBe(false);
  });

  it('getProviderDescriptor("kagenti") returns descriptor with implemented: true', () => {
    const d = getProviderDescriptor('kagenti');
    expect(d).toBeDefined();
    expect(d && d.id).toBe('kagenti');
    expect(d && d.implemented).toBe(true);
  });

  it('getProviderDescriptor("googleadk") returns descriptor with implemented: false', () => {
    const d = getProviderDescriptor('googleadk');
    expect(d).toBeDefined();
    expect(d && d.id).toBe('googleadk');
    expect(d && d.implemented).toBe(false);
  });

  it('getProviderDescriptor("unknown") returns undefined', () => {
    expect(
      getProviderDescriptor('unknown'),
    ).toBeUndefined();
  });

  it('getAllProviderDescriptors returns all providers sorted by displayName', () => {
    const all = getAllProviderDescriptors();
    expect(all).toHaveLength(2);
    expect(all[0].displayName).toBe('Google ADK');
    expect(all[1].displayName).toBe('Red Hat AI');
  });

  it('isValidProviderType("kagenti") returns true', () => {
    expect(isValidProviderType('kagenti')).toBe(true);
  });

  it('isValidProviderType("unknown") returns false', () => {
    expect(isValidProviderType('unknown')).toBe(false);
  });

  it('GoogleADK descriptor has chat, conversations, mcpTools true and others false', () => {
    const d = getProviderDescriptor('googleadk');
    expect(d).toBeDefined();
    if (d) {
      expect(d.capabilities.chat).toBe(true);
      expect(d.capabilities.conversations).toBe(true);
      expect(d.capabilities.mcpTools).toBe(true);
      expect(d.capabilities.rag).toBe(false);
      expect(d.capabilities.safety).toBe(false);
      expect(d.capabilities.evaluation).toBe(false);
    }
  });

  it('Kagenti has configFields with baseUrl', () => {
    const d = getProviderDescriptor('kagenti');
    expect(d).toBeDefined();
    if (d) {
      const keys = d.configFields.map(f => f.key);
      expect(keys).toContain('baseUrl');
    }
  });

  it('Kagenti exposes all platform capabilities', () => {
    const d = getProviderDescriptor('kagenti');
    expect(d).toBeDefined();
    if (d) {
      expect(d.capabilities.chat).toBe(true);
      expect(d.capabilities.rag).toBe(true);
      expect(d.capabilities.safety).toBe(true);
      expect(d.capabilities.evaluation).toBe(true);
      expect(d.capabilities.conversations).toBe(true);
      expect(d.capabilities.mcpTools).toBe(true);
      expect(d.capabilities.tools).toBe(true);
    }
  });
});
