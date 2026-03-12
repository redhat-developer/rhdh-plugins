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

import { mockServices } from '@backstage/backend-test-utils';
import { MockEntityBuilder } from '../../__fixtures__/mockEntityBuilder';
import { isMetricIdDisabled } from './metricUtils';

describe('isMetricIdDisabled', () => {
  const metricId = 'openssf.maintained';
  let mockLogger: ReturnType<typeof mockServices.logger.mock>;

  function createConfig(
    scorecardOverrides: {
      disabledMetrics?: string[];
      entityOverrides?: {
        disabledMetrics?: { enabled?: boolean; except?: string[] };
      };
    } = {},
  ) {
    return mockServices.rootConfig({
      data: {
        scorecard: {
          ...scorecardOverrides,
        },
      },
    });
  }

  function createEntity(annotationValue?: string) {
    return new MockEntityBuilder()
      .withMetadata({
        name: 'test-entity',
        namespace: 'default',
        ...(annotationValue !== undefined && {
          annotations: {
            'scorecard.io/disabled-metrics': annotationValue,
          },
        }),
      })
      .build();
  }

  beforeEach(() => {
    mockLogger = mockServices.logger.mock();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns true when metric is in app-config disabledMetrics', () => {
    const config = createConfig({ disabledMetrics: [metricId] });
    const entity = createEntity();

    const result = isMetricIdDisabled(config, metricId, entity, mockLogger);

    expect(result).toBe(true);
  });

  it('returns true when disabled by annotation but metric is in entityOverrides.disabledMetrics.except but entityOverrides.disabledMetrics.enabled is false', () => {
    const config = createConfig({
      entityOverrides: {
        disabledMetrics: {
          enabled: false,
          except: [metricId],
        },
      },
    });

    const entity = createEntity(metricId);
    const result = isMetricIdDisabled(config, metricId, entity, mockLogger);

    expect(result).toBe(true);
  });

  it('returns true when disabled by annotation but metric is NOT in entityOverrides.disabledMetrics.except but entityOverrides.disabledMetrics.enabled is true', () => {
    const config = createConfig({
      entityOverrides: {
        disabledMetrics: {
          enabled: true,
          except: [],
        },
      },
    });

    const entity = createEntity(metricId);
    const result = isMetricIdDisabled(config, metricId, entity, mockLogger);

    expect(result).toBe(true);
  });

  it('returns false when disabled by annotation but metric is in entityOverrides.disabledMetrics.except but entityOverrides.disabledMetrics.enabled is true', () => {
    const config = createConfig({
      entityOverrides: {
        disabledMetrics: {
          enabled: true,
          except: [metricId],
        },
      },
    });

    const entity = createEntity(metricId);
    const result = isMetricIdDisabled(config, metricId, entity, mockLogger);

    expect(result).toBe(false);
  });

  it('returns true when disabled by annotation (no except list)', () => {
    const config = createConfig();
    const entity = createEntity(metricId);

    const result = isMetricIdDisabled(config, metricId, entity, mockLogger);

    expect(result).toBe(true);
  });

  it('returns false when not disabled by app-config or annotation', () => {
    const config = createConfig();
    const entity = createEntity();

    const result = isMetricIdDisabled(config, metricId, entity, mockLogger);

    expect(result).toBe(false);
  });

  it('returns false when entityOverrides.disabledMetrics.enabled is false and metric is not in entity annotation', () => {
    const config = createConfig({
      entityOverrides: {
        disabledMetrics: { enabled: false },
      },
    });
    const entity = createEntity(); // no annotation

    const result = isMetricIdDisabled(config, metricId, entity, mockLogger);

    expect(result).toBe(false);
  });

  it('returns false when no config and no annotation', () => {
    const config = createConfig();
    const entity = createEntity();

    const result = isMetricIdDisabled(config, metricId, entity, mockLogger);

    expect(result).toBe(false);
  });
});
