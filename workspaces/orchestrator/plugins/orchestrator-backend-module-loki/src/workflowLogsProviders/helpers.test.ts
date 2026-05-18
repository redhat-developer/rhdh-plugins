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

import type { Config } from '@backstage/config';

import {
  assertSafeWorkflowInstanceIdForLineFilter,
  hostnameMatchesAllowedHosts,
  parseAndValidateLogPipelineFilters,
} from './helpers';

describe('assertSafeWorkflowInstanceIdForLineFilter', () => {
  it('continues when codePointAt returns undefined (defensive branch)', () => {
    const original = String.prototype.codePointAt;
    const spy = jest
      .spyOn(String.prototype, 'codePointAt')
      .mockImplementation(function mockCodePointAt(this: string, pos: number) {
        const s = String(this);
        if (s === '__codepoint_undefined_once__' && pos === 0) {
          return undefined as unknown as number;
        }
        return original.call(this, pos) as number | undefined;
      });
    try {
      expect(() =>
        assertSafeWorkflowInstanceIdForLineFilter(
          '__codepoint_undefined_once__',
        ),
      ).not.toThrow();
    } finally {
      spy.mockRestore();
    }
  });
});

describe('parseAndValidateLogPipelineFilters', () => {
  it('rejects empty string entries after trim (ConfigReader cannot supply this)', () => {
    const mockConfig = {
      getOptionalStringArray: () => [''],
    } as unknown as Config;
    expect(() =>
      parseAndValidateLogPipelineFilters(
        mockConfig,
        'orchestrator.workflowLogProvider.loki.logPipelineFilters',
      ),
    ).toThrow(
      /orchestrator\.workflowLogProvider\.loki\.logPipelineFilters\[0\]: entry must not be empty or whitespace-only/,
    );
  });

  it.each([
    ['| json\n| line'],
    ['| json\r| line'],
    [`| json${'\u2028'}| line`],
    [`| json${'\u2029'}| line`],
  ])('rejects entries that contain line breaks', raw => {
    const mockConfig = {
      getOptionalStringArray: () => [raw],
    } as unknown as Config;
    expect(() =>
      parseAndValidateLogPipelineFilters(
        mockConfig,
        'orchestrator.workflowLogProvider.loki.logPipelineFilters',
      ),
    ).toThrow(
      /orchestrator\.workflowLogProvider\.loki\.logPipelineFilters\[0\]: entry must not contain line breaks/,
    );
  });
});

describe('hostnameMatchesAllowedHosts', () => {
  it('treats empty and whitespace-only patterns as non-matches', () => {
    expect(
      hostnameMatchesAllowedHosts('loki.example.com', ['', '   ', '\t']),
    ).toBe(false);
  });

  it('still matches when a real pattern follows blank entries', () => {
    expect(
      hostnameMatchesAllowedHosts('loki.example.com', [
        '   ',
        'loki.example.com',
      ]),
    ).toBe(true);
  });
});
