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
import { areThresholdAnnotationOverridesAllowed } from './thresholdAnnotations';

describe('areThresholdAnnotationOverridesAllowed', () => {
  const metricId = 'github.openPRs';

  it('returns true when entityAnnotations config is unset', () => {
    expect(
      areThresholdAnnotationOverridesAllowed(
        mockServices.rootConfig({ data: { scorecard: {} } }),
        metricId,
      ),
    ).toBe(true);
  });

  it('returns false when entityAnnotations.enabled is false', () => {
    expect(
      areThresholdAnnotationOverridesAllowed(
        mockServices.rootConfig({
          data: {
            scorecard: {
              entityAnnotations: { enabled: false },
            },
          },
        }),
        metricId,
      ),
    ).toBe(false);
  });

  it('returns false when entityAnnotations.thresholds.enabled is false', () => {
    expect(
      areThresholdAnnotationOverridesAllowed(
        mockServices.rootConfig({
          data: {
            scorecard: {
              entityAnnotations: {
                thresholds: { enabled: false, except: [metricId] },
              },
            },
          },
        }),
        metricId,
      ),
    ).toBe(false);
  });

  it('returns false when metric is in entityAnnotations.thresholds.except', () => {
    expect(
      areThresholdAnnotationOverridesAllowed(
        mockServices.rootConfig({
          data: {
            scorecard: {
              entityAnnotations: {
                thresholds: { enabled: true, except: [metricId] },
              },
            },
          },
        }),
        metricId,
      ),
    ).toBe(false);
  });

  it('returns true when thresholds.enabled is true and metric is not in except', () => {
    expect(
      areThresholdAnnotationOverridesAllowed(
        mockServices.rootConfig({
          data: {
            scorecard: {
              entityAnnotations: {
                thresholds: { enabled: true, except: ['other.metric'] },
              },
            },
          },
        }),
        metricId,
      ),
    ).toBe(true);
  });

  it('returns true when thresholds.enabled is unset and except is empty', () => {
    expect(
      areThresholdAnnotationOverridesAllowed(
        mockServices.rootConfig({
          data: {
            scorecard: {
              entityAnnotations: { thresholds: {} },
            },
          },
        }),
        metricId,
      ),
    ).toBe(true);
  });

  it('returns false when entityAnnotations.enabled is true but thresholds.enabled is false', () => {
    expect(
      areThresholdAnnotationOverridesAllowed(
        mockServices.rootConfig({
          data: {
            scorecard: {
              entityAnnotations: {
                enabled: true,
                thresholds: { enabled: false },
              },
            },
          },
        }),
        metricId,
      ),
    ).toBe(false);
  });

  it('returns true when entityAnnotations.enabled is true and thresholds config is unset', () => {
    expect(
      areThresholdAnnotationOverridesAllowed(
        mockServices.rootConfig({
          data: {
            scorecard: {
              entityAnnotations: { enabled: true },
            },
          },
        }),
        metricId,
      ),
    ).toBe(true);
  });
});
