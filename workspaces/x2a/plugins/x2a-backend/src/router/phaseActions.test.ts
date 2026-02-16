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

import { randomUUID } from 'node:crypto';
import { mockServices } from '@backstage/backend-test-utils';

import { executePhaseActions, PhaseActionContext } from './phaseActions';

describe('phaseActions', () => {
  const projectId = randomUUID();

  function createMockContext(
    artifacts: PhaseActionContext['artifacts'] = [],
  ): PhaseActionContext & {
    x2aDatabase: {
      listModules: jest.Mock;
      createModule: jest.Mock;
      deleteModule: jest.Mock;
    };
  } {
    return {
      projectId,
      artifacts,
      x2aDatabase: {
        listModules: jest.fn().mockResolvedValue([]),
        createModule: jest.fn().mockResolvedValue({ id: randomUUID() }),
        deleteModule: jest.fn().mockResolvedValue(1),
      } as any,
      logger: mockServices.logger.mock(),
    };
  }

  describe('init phase', () => {
    it('should parse metadata and create modules with correct name/sourcePath mapping', async () => {
      const metadataModules = [
        {
          name: 'cookbook-a',
          path: '/cookbooks/a',
          description: 'Cookbook A',
          technology: 'chef',
        },
        {
          name: 'cookbook-b',
          path: '/cookbooks/b',
          description: 'Cookbook B',
          technology: 'chef',
        },
      ];
      const context = createMockContext([
        {
          id: randomUUID(),
          type: 'project_metadata',
          value: JSON.stringify(metadataModules),
        },
      ]);

      await executePhaseActions('init', context);

      expect(context.x2aDatabase.createModule).toHaveBeenCalledTimes(2);
      expect(context.x2aDatabase.createModule).toHaveBeenCalledWith({
        name: 'cookbook-a',
        sourcePath: '/cookbooks/a',
        projectId,
      });
      expect(context.x2aDatabase.createModule).toHaveBeenCalledWith({
        name: 'cookbook-b',
        sourcePath: '/cookbooks/b',
        projectId,
      });
    });

    it('should sync correctly: add new, remove missing, keep matching', async () => {
      const metadataModules = [
        { name: 'kept', path: '/cookbooks/kept' },
        { name: 'added', path: '/cookbooks/added' },
      ];
      const existingModules = [
        { id: 'id-1', name: 'kept', sourcePath: '/cookbooks/kept', projectId },
        {
          id: 'id-2',
          name: 'removed',
          sourcePath: '/cookbooks/removed',
          projectId,
        },
      ];
      const context = createMockContext([
        {
          id: randomUUID(),
          type: 'project_metadata',
          value: JSON.stringify(metadataModules),
        },
      ]);
      context.x2aDatabase.listModules.mockResolvedValue(existingModules);

      await executePhaseActions('init', context);

      expect(context.x2aDatabase.deleteModule).toHaveBeenCalledTimes(1);
      expect(context.x2aDatabase.deleteModule).toHaveBeenCalledWith({
        id: 'id-2',
      });
      expect(context.x2aDatabase.createModule).toHaveBeenCalledTimes(1);
      expect(context.x2aDatabase.createModule).toHaveBeenCalledWith({
        name: 'added',
        sourcePath: '/cookbooks/added',
        projectId,
      });
    });

    it('should handle empty metadata array', async () => {
      const existingModules = [
        {
          id: 'id-1',
          name: 'old-module',
          sourcePath: '/cookbooks/old',
          projectId,
        },
      ];
      const context = createMockContext([
        {
          id: randomUUID(),
          type: 'project_metadata',
          value: JSON.stringify([]),
        },
      ]);
      context.x2aDatabase.listModules.mockResolvedValue(existingModules);

      await executePhaseActions('init', context);

      expect(context.x2aDatabase.deleteModule).toHaveBeenCalledTimes(1);
      expect(context.x2aDatabase.deleteModule).toHaveBeenCalledWith({
        id: 'id-1',
      });
      expect(context.x2aDatabase.createModule).not.toHaveBeenCalled();
    });

    it('should handle missing metadata artifact gracefully', async () => {
      const context = createMockContext([
        {
          id: randomUUID(),
          type: 'migration_plan',
          value: 'https://example.com/plan.md',
        },
      ]);

      await executePhaseActions('init', context);

      expect(context.x2aDatabase.listModules).not.toHaveBeenCalled();
      expect(context.x2aDatabase.createModule).not.toHaveBeenCalled();
      expect(context.x2aDatabase.deleteModule).not.toHaveBeenCalled();
    });

    it('should handle no artifacts at all', async () => {
      const context = createMockContext([]);

      await executePhaseActions('init', context);

      expect(context.x2aDatabase.listModules).not.toHaveBeenCalled();
      expect(context.x2aDatabase.createModule).not.toHaveBeenCalled();
    });
  });

  describe('non-init phases', () => {
    it('should not execute any actions for analyze phase', async () => {
      const context = createMockContext([
        {
          id: randomUUID(),
          type: 'project_metadata',
          value: JSON.stringify([{ name: 'mod', path: '/p' }]),
        },
      ]);

      await executePhaseActions('analyze', context);

      expect(context.x2aDatabase.listModules).not.toHaveBeenCalled();
      expect(context.x2aDatabase.createModule).not.toHaveBeenCalled();
    });

    it('should not execute any actions for migrate phase', async () => {
      const context = createMockContext();

      await executePhaseActions('migrate', context);

      expect(context.x2aDatabase.listModules).not.toHaveBeenCalled();
    });

    it('should not execute any actions for publish phase', async () => {
      const context = createMockContext();

      await executePhaseActions('publish', context);

      expect(context.x2aDatabase.listModules).not.toHaveBeenCalled();
    });
  });
});
