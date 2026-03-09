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
import { isMetricIdExcluded } from './metricUtils';

describe('isMetricIdExcluded', () => {
  const providerId = 'openssf.maintained';
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
    const config = createConfig({ disabledMetrics: [providerId] });
    const entity = createEntity();

    const result = isMetricIdExcluded(config, providerId, entity, mockLogger);

    expect(result).toBe(true);
    expect(mockLogger.info).toHaveBeenCalledWith(
      `Disabled metric by app-config: ${providerId}`,
    );
  });

  it('returns true when metric is in app-config disabledMetrics (disabled wins)', () => {
    const config = createConfig({ disabledMetrics: [providerId] });
    const entity = createEntity();

    const result = isMetricIdExcluded(config, providerId, entity, mockLogger);

    expect(result).toBe(true);
    expect(mockLogger.info).toHaveBeenCalledWith(
      `Disabled metric by app-config: ${providerId}`,
    );
  });

  it('returns false when disabled by annotation but metric is in entityOverrides.disabledMetrics.except (must run)', () => {
    const config = createConfig({
      entityOverrides: {
        disabledMetrics: { except: [providerId] },
      },
    });
    const entity = createEntity(providerId);

    const result = isMetricIdExcluded(config, providerId, entity, mockLogger);

    expect(result).toBe(false);
    expect(mockLogger.info).toHaveBeenCalledWith(
      `Entity override: metric disabled by annotation but in entityOverrides.disabledMetrics.except (must run): ${providerId}`,
    );
  });

  it('returns true when disabled by annotation (no except list)', () => {
    const config = createConfig();
    const entity = createEntity(providerId);

    const result = isMetricIdExcluded(config, providerId, entity, mockLogger);

    expect(result).toBe(true);
    expect(mockLogger.info).toHaveBeenCalledWith(
      `Disabled metric by annotation: ${providerId}`,
    );
  });

  it('returns true when disabled by annotation (entity in list)', () => {
    const config = createConfig();
    const entity = createEntity(providerId);

    const result = isMetricIdExcluded(config, providerId, entity, mockLogger);

    expect(result).toBe(true);
    expect(mockLogger.info).toHaveBeenCalledWith(
      `Disabled metric by annotation: ${providerId}`,
    );
  });

  it('parses comma-separated annotation and excludes when providerId is in the list', () => {
    const config = createConfig();
    const entity = createEntity('github.test_metric,openssf.maintained');

    const result = isMetricIdExcluded(config, providerId, entity, mockLogger);

    expect(result).toBe(true);
    expect(mockLogger.info).toHaveBeenCalledWith(
      `Disabled metric by annotation: ${providerId}`,
    );
  });

  it('returns false when not disabled by app-config or annotation', () => {
    const config = createConfig();
    const entity = createEntity();

    const result = isMetricIdExcluded(config, providerId, entity, mockLogger);

    expect(result).toBe(false);
  });

  it('returns true when entityOverrides.disabledMetrics.enabled is false and metric is in entity annotation (union of app-config and entity list)', () => {
    const config = createConfig({
      entityOverrides: {
        disabledMetrics: { enabled: false },
      },
    });
    const entity = createEntity(providerId);

    const result = isMetricIdExcluded(config, providerId, entity, mockLogger);

    expect(result).toBe(true);
    expect(mockLogger.info).toHaveBeenCalledWith(
      `Disabled metric by annotation (entity overrides disabled): ${providerId}`,
    );
  });

  it('returns false when entityOverrides.disabledMetrics.enabled is false and metric is not in entity annotation', () => {
    const config = createConfig({
      entityOverrides: {
        disabledMetrics: { enabled: false },
      },
    });
    const entity = createEntity(); // no annotation

    const result = isMetricIdExcluded(config, providerId, entity, mockLogger);

    expect(result).toBe(false);
  });

  it('returns true when enabled is false with nested config and entity annotation (getOptionalConfig path)', () => {
    const config = createConfig({
      entityOverrides: {
        disabledMetrics: {
          enabled: false,
          except: [providerId],
        },
      },
    });
    const entity = createEntity(providerId);

    const result = isMetricIdExcluded(config, providerId, entity, mockLogger);

    expect(result).toBe(true);
    expect(mockLogger.info).toHaveBeenCalledWith(
      `Disabled metric by annotation (entity overrides disabled): ${providerId}`,
    );
  });

  it('returns false when disabled by annotation but metric is in entityOverrides.disabledMetrics.except', () => {
    const config = createConfig({
      entityOverrides: {
        disabledMetrics: { enabled: true, except: [providerId] },
      },
    });
    const entity = createEntity(providerId);

    const result = isMetricIdExcluded(config, providerId, entity, mockLogger);

    expect(result).toBe(false);
    expect(mockLogger.info).toHaveBeenCalledWith(
      `Entity override: metric disabled by annotation but in entityOverrides.disabledMetrics.except (must run): ${providerId}`,
    );
  });

  it('returns false when no config and no annotation', () => {
    const config = createConfig();
    const entity = createEntity();

    const result = isMetricIdExcluded(config, providerId, entity, mockLogger);

    expect(result).toBe(false);
  });
});
