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

import { buildLabelSelector } from '../label-selector';
import {
  SubcomponentClusterConfig,
  Filters,
  PipelineRunLabel,
} from '@red-hat-developer-hub/backstage-plugin-konflux-common';

describe('label-selector', () => {
  describe('buildLabelSelector', () => {
    const createMockCombination = (
      overrides?: Partial<SubcomponentClusterConfig>,
    ): SubcomponentClusterConfig => ({
      subcomponent: 'sub1',
      cluster: 'cluster1',
      namespace: 'namespace1',
      applications: [],
      ...overrides,
    });

    const createMockFilters = (overrides?: Partial<Filters>): Filters => ({
      ...overrides,
    });

    it('should return undefined for resources that do not support labels', () => {
      const combination = createMockCombination({ applications: ['app1'] });
      const filters = createMockFilters();

      expect(buildLabelSelector('applications', combination, filters)).toBe(
        undefined,
      );
      expect(buildLabelSelector('components', combination, filters)).toBe(
        undefined,
      );
      expect(buildLabelSelector('unknown', combination, filters)).toBe(
        undefined,
      );
    });

    it('should return undefined when no applications and no component filter', () => {
      const combination = createMockCombination();
      const filters = createMockFilters();

      expect(
        buildLabelSelector('pipelineruns', combination, filters),
      ).toBeUndefined();
      expect(
        buildLabelSelector('releases', combination, filters),
      ).toBeUndefined();
    });

    it('should build selector for single application', () => {
      const combination = createMockCombination({ applications: ['app1'] });
      const filters = createMockFilters();

      const result = buildLabelSelector('pipelineruns', combination, filters);

      expect(result).toBe(`${PipelineRunLabel.APPLICATION}=app1`);
    });

    it('should build selector for multiple applications using "in" syntax', () => {
      const combination = createMockCombination({
        applications: ['app1', 'app2'],
      });
      const filters = createMockFilters();

      const result = buildLabelSelector('pipelineruns', combination, filters);

      expect(result).toBe(`${PipelineRunLabel.APPLICATION} in (app1,app2)`);
    });

    it('should build selector for component filter', () => {
      const combination = createMockCombination();
      const filters = createMockFilters({ component: 'comp1' });

      const result = buildLabelSelector('pipelineruns', combination, filters);

      expect(result).toBe(`${PipelineRunLabel.COMPONENT}=comp1`);
    });

    it('should build selector with both single application and component', () => {
      const combination = createMockCombination({ applications: ['app1'] });
      const filters = createMockFilters({ component: 'comp1' });

      const result = buildLabelSelector('pipelineruns', combination, filters);

      expect(result).toBe(
        `${PipelineRunLabel.APPLICATION}=app1,${PipelineRunLabel.COMPONENT}=comp1`,
      );
    });

    it('should build selector with multiple applications and component', () => {
      const combination = createMockCombination({
        applications: ['app1', 'app2', 'app3'],
      });
      const filters = createMockFilters({ component: 'comp1' });

      const result = buildLabelSelector('pipelineruns', combination, filters);

      expect(result).toBe(
        `${PipelineRunLabel.APPLICATION} in (app1,app2,app3),${PipelineRunLabel.COMPONENT}=comp1`,
      );
    });

    it('should handle empty applications array', () => {
      const combination = createMockCombination({ applications: [] });
      const filters = createMockFilters({ component: 'comp1' });

      const result = buildLabelSelector('pipelineruns', combination, filters);

      expect(result).toBe(`${PipelineRunLabel.COMPONENT}=comp1`);
    });

    it('should work with releases resource type', () => {
      const combination = createMockCombination({ applications: ['app1'] });
      const filters = createMockFilters({ component: 'comp1' });

      const result = buildLabelSelector('releases', combination, filters);

      expect(result).toBe(
        `${PipelineRunLabel.APPLICATION}=app1,${PipelineRunLabel.COMPONENT}=comp1`,
      );
    });

    it('should handle undefined filters', () => {
      const combination = createMockCombination({ applications: ['app1'] });

      const result = buildLabelSelector('pipelineruns', combination);

      expect(result).toBe(`${PipelineRunLabel.APPLICATION}=app1`);
    });
  });
});
