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

import { ModelCapabilitiesCache } from './attachment-validation';

describe('ModelCapabilitiesCache', () => {
  beforeEach(() => {
    ModelCapabilitiesCache.clear();
  });

  it('should store and retrieve model capabilities', () => {
    ModelCapabilitiesCache.set('gpt-4-vision', true);
    expect(ModelCapabilitiesCache.get('gpt-4-vision')).toBe(true);
    expect(ModelCapabilitiesCache.has('gpt-4-vision')).toBe(true);
  });

  it('should return undefined for unknown models', () => {
    expect(ModelCapabilitiesCache.get('unknown-model')).toBeUndefined();
    expect(ModelCapabilitiesCache.has('unknown-model')).toBe(false);
  });

  it('should update existing entries', () => {
    ModelCapabilitiesCache.set('gpt-4', false);
    expect(ModelCapabilitiesCache.get('gpt-4')).toBe(false);

    ModelCapabilitiesCache.set('gpt-4', true);
    expect(ModelCapabilitiesCache.get('gpt-4')).toBe(true);
  });

  it('should handle multiple models independently', () => {
    ModelCapabilitiesCache.set('model-a', true);
    ModelCapabilitiesCache.set('model-b', false);
    ModelCapabilitiesCache.set('model-c', true);

    expect(ModelCapabilitiesCache.get('model-a')).toBe(true);
    expect(ModelCapabilitiesCache.get('model-b')).toBe(false);
    expect(ModelCapabilitiesCache.get('model-c')).toBe(true);
    expect(ModelCapabilitiesCache.has('model-a')).toBe(true);
    expect(ModelCapabilitiesCache.has('model-b')).toBe(true);
    expect(ModelCapabilitiesCache.has('model-c')).toBe(true);
    expect(ModelCapabilitiesCache.has('model-d')).toBe(false);
  });
});
