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
  buildLastGoodKey,
  formatMappingFailureMessage,
  hasNativeRemote,
  readServerIdentity,
} from './providerUtils';
import { createMockServerDoc } from './testUtils';

describe('buildLastGoodKey', () => {
  it('joins name and version with a double-colon separator', () => {
    expect(buildLastGoodKey('io.example/weather', '1.0.0')).toBe(
      'io.example/weather::1.0.0',
    );
  });
});

describe('hasNativeRemote', () => {
  it('returns true when a remote has a non-empty type and http(s) URL', () => {
    expect(
      hasNativeRemote(createMockServerDoc('io.example/weather', '1.0.0')),
    ).toBe(true);
  });

  it('returns false when remotes are missing or empty', () => {
    expect(
      hasNativeRemote(
        createMockServerDoc('io.example/weather', '1.0.0', {
          remotes: undefined,
        }),
      ),
    ).toBe(false);
    expect(
      hasNativeRemote(
        createMockServerDoc('io.example/weather', '1.0.0', { remotes: [] }),
      ),
    ).toBe(false);
    expect(hasNativeRemote(undefined)).toBe(false);
  });

  it('returns false for invalid remote URLs', () => {
    expect(
      hasNativeRemote(
        createMockServerDoc('io.example/weather', '1.0.0', {
          remotes: [{ type: 'streamable-http', url: 'not-a-url' }],
        }),
      ),
    ).toBe(false);
  });
});

describe('readServerIdentity', () => {
  it('returns name and version from a valid entry', () => {
    expect(
      readServerIdentity({
        server: createMockServerDoc('io.example/weather', '1.2.3'),
      }),
    ).toEqual({ name: 'io.example/weather', version: '1.2.3' });
  });

  it('returns undefined fields for null or undefined entries', () => {
    expect(readServerIdentity(null)).toEqual({
      name: undefined,
      version: undefined,
    });
    expect(readServerIdentity(undefined)).toEqual({
      name: undefined,
      version: undefined,
    });
  });

  it('ignores non-string name and version values', () => {
    expect(
      readServerIdentity({
        server: {
          ...createMockServerDoc('io.example/weather', '1.0.0'),
          name: 42 as unknown as string,
          version: { n: 1 } as unknown as string,
        },
      }),
    ).toEqual({ name: undefined, version: undefined });
  });
});

describe('formatMappingFailureMessage', () => {
  it('includes name and version when both are present', () => {
    expect(
      formatMappingFailureMessage('io.example/weather', '1.0.0', 'boom'),
    ).toBe(
      'Failed to map MCP Registry server entry "io.example/weather" (version "1.0.0"): boom',
    );
  });

  it('omits missing name and version segments', () => {
    expect(formatMappingFailureMessage(undefined, undefined, 'boom')).toBe(
      'Failed to map MCP Registry server entry: boom',
    );
  });

  it('includes only the version when name is missing', () => {
    expect(formatMappingFailureMessage(undefined, '1.0.0', 'boom')).toBe(
      'Failed to map MCP Registry server entry (version "1.0.0"): boom',
    );
  });
});
