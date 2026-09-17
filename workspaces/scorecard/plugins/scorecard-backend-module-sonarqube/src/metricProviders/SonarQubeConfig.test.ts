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

import { sonarqubeEntity } from '../../__fixtures__/sonarqubeEntity';
import {
  parseProjectKeyAnnotation,
  SONARQUBE_METRIC_CONFIG,
  SONARQUBE_METRICS,
  SONARQUBE_NUMBER_METRICS,
  SONARQUBE_NUMBER_THRESHOLDS,
  SONARQUBE_PROJECT_KEY_ANNOTATION,
} from './SonarQubeConfig';

describe('parseProjectKeyAnnotation', () => {
  it('should throw when annotation is missing', () => {
    expect(() => parseProjectKeyAnnotation(sonarqubeEntity(null))).toThrow(
      `Missing annotation '${SONARQUBE_PROJECT_KEY_ANNOTATION}' for entity component:default/my-service`,
    );
  });

  it('should return projectKey when annotation has no instance prefix', () => {
    expect(parseProjectKeyAnnotation(sonarqubeEntity('my-project'))).toEqual({
      projectKey: 'my-project',
    });
  });

  it('should return instanceName and projectKey when annotation has instance prefix', () => {
    expect(
      parseProjectKeyAnnotation(sonarqubeEntity('internal/my-project')),
    ).toEqual({
      instanceName: 'internal',
      projectKey: 'my-project',
    });
  });

  it('should split on the first slash when project key contains additional slashes', () => {
    expect(parseProjectKeyAnnotation(sonarqubeEntity('a/b/c'))).toEqual({
      instanceName: 'a',
      projectKey: 'b/c',
    });
  });
});

describe('SONARQUBE_METRIC_CONFIG', () => {
  it.each(SONARQUBE_METRICS)(
    'should map %s to sonarqube.%s metric id',
    metricId => {
      expect(SONARQUBE_METRIC_CONFIG[metricId].id).toBe(
        `sonarqube.${metricId}`,
      );
    },
  );
});

describe('SONARQUBE_NUMBER_THRESHOLDS', () => {
  it.each(SONARQUBE_NUMBER_METRICS)(
    'should define default thresholds for %s',
    metricId => {
      expect(
        SONARQUBE_NUMBER_THRESHOLDS[metricId].rules.length,
      ).toBeGreaterThan(0);
    },
  );
});
