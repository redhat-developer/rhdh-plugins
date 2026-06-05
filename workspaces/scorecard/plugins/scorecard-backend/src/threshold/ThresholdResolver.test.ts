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

import { ConfigReader } from '@backstage/config';
import { MockNumberProvider } from '../../__fixtures__/mockProviders';
import { MockEntityBuilder } from '../../__fixtures__/mockEntityBuilder';
import { ThresholdResolver } from './ThresholdResolver';

describe('ThresholdResolver', () => {
  const customThresholds = {
    scorecard: {
      plugins: {
        github: {
          number_metric: {
            thresholds: {
              rules: [
                { key: 'error', expression: '>100' },
                { key: 'warning', expression: '>50' },
                { key: 'success', expression: '<=50' },
              ],
            },
          },
        },
      },
    },
  };

  it('uses default provider thresholds when no custom thresholds', () => {
    const provider = new MockNumberProvider('github.number_metric', 'github');
    const resolver = new ThresholdResolver(
      new ConfigReader({
        scorecard: {
          plugins: {
            github: {
              other_metric: {
                thresholds: {
                  rules: [
                    { key: 'error', expression: '>100' },
                    { key: 'warning', expression: '>50' },
                    { key: 'success', expression: '<=50' },
                  ],
                },
              },
            },
          },
        },
      }),
      [provider, new MockNumberProvider('github.other_netric', 'github')],
    );

    expect(resolver.resolveProviderThresholds(provider)).toEqual({
      rules: [
        { key: 'error', expression: '>40' },
        { key: 'warning', expression: '>20' },
        { key: 'success', expression: '<=20' },
      ],
    });
  });

  it('uses configured thresholds before provider default thresholds', () => {
    const provider = new MockNumberProvider('github.number_metric', 'github');
    const resolver = new ThresholdResolver(new ConfigReader(customThresholds), [
      new MockNumberProvider('github.other_netric', 'github'),
      provider,
    ]);

    expect(resolver.resolveProviderThresholds(provider)).toEqual({
      rules: [
        { key: 'error', expression: '>100' },
        { key: 'warning', expression: '>50' },
        { key: 'success', expression: '<=50' },
      ],
    });
  });

  it('merges entity annotation overrides on top of default provider thresholds', () => {
    const provider = new MockNumberProvider('github.number_metric', 'github');
    const resolver = new ThresholdResolver(new ConfigReader({}), [provider]);
    const entity = new MockEntityBuilder()
      .withAnnotations({
        'scorecard.io/github.number_metric.thresholds.rules.warning': '>10',
        'scorecard.io/github.number_metric.thresholds.rules.success': '<=10',
      })
      .build();

    expect(resolver.resolveEntityThresholds(entity, provider)).toEqual({
      rules: [
        { key: 'error', expression: '>40' },
        { key: 'warning', expression: '>10' },
        { key: 'success', expression: '<=10' },
      ],
    });
  });

  it('merges entity annotation overrides on top of default provider thresholds when provider is unexpectedly not loaded on startup', () => {
    const provider = new MockNumberProvider('github.number_metric', 'github');
    const resolver = new ThresholdResolver(new ConfigReader({}), []);
    const entity = new MockEntityBuilder()
      .withAnnotations({
        'scorecard.io/github.number_metric.thresholds.rules.warning': '>10',
        'scorecard.io/github.number_metric.thresholds.rules.success': '<=10',
      })
      .build();

    expect(resolver.resolveEntityThresholds(entity, provider)).toEqual({
      rules: [
        { key: 'error', expression: '>40' },
        { key: 'warning', expression: '>10' },
        { key: 'success', expression: '<=10' },
      ],
    });
  });

  it('merges entity annotation overrides on top of custom provider thresholds', () => {
    const provider = new MockNumberProvider('github.number_metric', 'github');
    const resolver = new ThresholdResolver(new ConfigReader(customThresholds), [
      provider,
    ]);
    const entity = new MockEntityBuilder()
      .withAnnotations({
        'scorecard.io/github.number_metric.thresholds.rules.warning': '>10',
        'scorecard.io/github.number_metric.thresholds.rules.success': '<=10',
      })
      .build();

    expect(resolver.resolveEntityThresholds(entity, provider)).toEqual({
      rules: [
        { key: 'error', expression: '>100' },
        { key: 'warning', expression: '>10' },
        { key: 'success', expression: '<=10' },
      ],
    });
  });

  it('loads configured thresholds at startup', () => {
    const mockConfig = {
      getOptional: jest.fn().mockReturnValue({
        rules: [
          { key: 'error', expression: '>100' },
          { key: 'warning', expression: '>50' },
          { key: 'success', expression: '<=50' },
        ],
      }),
    } as any;
    const provider = new MockNumberProvider('github.number_metric', 'github');
    const resolver = new ThresholdResolver(mockConfig, [provider]);

    resolver.resolveProviderThresholds(provider);
    resolver.resolveProviderThresholds(provider);

    expect(mockConfig.getOptional).toHaveBeenCalledTimes(1);
  });

  it('validates configured thresholds at startup', () => {
    const mockConfig = {
      getOptional: jest.fn().mockReturnValue({
        rules: [{ key: 'error', expression: 'INVALID' }],
      }),
    } as any;
    const provider = new MockNumberProvider('github.number_metric', 'github');

    expect(() => new ThresholdResolver(mockConfig, [provider])).toThrow(
      'Invalid thresholds configuration at scorecard.plugins.github.number_metric.thresholds',
    );
  });
});
