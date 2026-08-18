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
      softDeleteModule: jest.Mock;
      restoreModule: jest.Mock;
    };
  } {
    return {
      projectId,
      artifacts,
      x2aDatabase: {
        listModules: jest.fn().mockResolvedValue([]),
        createModule: jest.fn().mockResolvedValue({ id: randomUUID() }),
        deleteModule: jest.fn().mockResolvedValue(1),
        softDeleteModule: jest.fn().mockResolvedValue(1),
        restoreModule: jest.fn().mockResolvedValue(1),
        updateModule: jest.fn().mockResolvedValue(1),
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
        technology: 'chef',
      });
      expect(context.x2aDatabase.createModule).toHaveBeenCalledWith({
        name: 'cookbook-b',
        sourcePath: '/cookbooks/b',
        projectId,
        technology: 'chef',
      });
    });

    it('should sync correctly: add new, soft-delete missing, keep matching', async () => {
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

      expect(context.x2aDatabase.softDeleteModule).toHaveBeenCalledTimes(1);
      expect(context.x2aDatabase.softDeleteModule).toHaveBeenCalledWith({
        id: 'id-2',
      });
      expect(context.x2aDatabase.createModule).toHaveBeenCalledTimes(1);
      expect(context.x2aDatabase.createModule).toHaveBeenCalledWith({
        name: 'added',
        sourcePath: '/cookbooks/added',
        projectId,
        technology: undefined,
      });
    });

    it('should update sourcePath when module name matches but path changed', async () => {
      const metadataModules = [
        { name: 'cookbook-a', path: '/cookbooks/a-new', technology: 'chef' },
      ];
      const existingModules = [
        {
          id: 'id-1',
          name: 'cookbook-a',
          sourcePath: '/cookbooks/a-old',
          projectId,
          technology: 'chef' as const,
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

      expect(context.x2aDatabase.updateModule).toHaveBeenCalledTimes(1);
      expect(context.x2aDatabase.updateModule).toHaveBeenCalledWith({
        id: 'id-1',
        sourcePath: '/cookbooks/a-new',
      });
      expect(context.x2aDatabase.createModule).not.toHaveBeenCalled();
      expect(context.x2aDatabase.softDeleteModule).not.toHaveBeenCalled();
    });

    it('should restore previously soft-deleted module when it reappears in metadata', async () => {
      const metadataModules = [
        { name: 'restored-module', path: '/cookbooks/restored' },
      ];
      const existingModules = [
        {
          id: 'id-1',
          name: 'restored-module',
          sourcePath: '/cookbooks/restored',
          projectId,
          removedAt: '2026-01-01T00:00:00.000Z',
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

      expect(context.x2aDatabase.restoreModule).toHaveBeenCalledTimes(1);
      expect(context.x2aDatabase.restoreModule).toHaveBeenCalledWith({
        id: 'id-1',
      });
      expect(context.x2aDatabase.createModule).not.toHaveBeenCalled();
      expect(context.x2aDatabase.softDeleteModule).not.toHaveBeenCalled();
    });

    it('should restore and update a soft-deleted module when it reappears with a different path', async () => {
      const metadataModules = [
        {
          name: 'restored-module',
          path: '/cookbooks/new-path',
          technology: 'ansible',
        },
      ];
      const existingModules = [
        {
          id: 'id-1',
          name: 'restored-module',
          sourcePath: '/cookbooks/old-path',
          projectId,
          technology: 'chef' as const,
          removedAt: '2026-01-01T00:00:00.000Z',
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

      expect(context.x2aDatabase.restoreModule).toHaveBeenCalledTimes(1);
      expect(context.x2aDatabase.restoreModule).toHaveBeenCalledWith({
        id: 'id-1',
      });
      expect(context.x2aDatabase.updateModule).toHaveBeenCalledTimes(1);
      expect(context.x2aDatabase.updateModule).toHaveBeenCalledWith({
        id: 'id-1',
        sourcePath: '/cookbooks/new-path',
        technology: 'ansible',
      });
      expect(context.x2aDatabase.createModule).not.toHaveBeenCalled();
      expect(context.x2aDatabase.softDeleteModule).not.toHaveBeenCalled();
    });

    it('should not soft-delete already removed modules', async () => {
      const metadataModules = [{ name: 'new-only', path: '/cookbooks/new' }];
      const existingModules = [
        {
          id: 'id-1',
          name: 'already-removed',
          sourcePath: '/cookbooks/old',
          projectId,
          removedAt: '2026-01-01T00:00:00.000Z',
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

      expect(context.x2aDatabase.softDeleteModule).not.toHaveBeenCalled();
      expect(context.x2aDatabase.createModule).toHaveBeenCalledTimes(1);
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

      expect(context.x2aDatabase.softDeleteModule).toHaveBeenCalledTimes(1);
      expect(context.x2aDatabase.softDeleteModule).toHaveBeenCalledWith({
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
      expect(context.x2aDatabase.softDeleteModule).not.toHaveBeenCalled();
    });

    it('should handle no artifacts at all', async () => {
      const context = createMockContext([]);

      await executePhaseActions('init', context);

      expect(context.x2aDatabase.listModules).not.toHaveBeenCalled();
      expect(context.x2aDatabase.createModule).not.toHaveBeenCalled();
    });

    it('should handle invalid JSON in metadata artifact gracefully', async () => {
      const context = createMockContext([
        {
          id: randomUUID(),
          type: 'project_metadata',
          value: 'not valid json {{',
        },
      ]);

      await executePhaseActions('init', context);

      expect(context.x2aDatabase.listModules).not.toHaveBeenCalled();
      expect(context.x2aDatabase.createModule).not.toHaveBeenCalled();
      expect(context.logger.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          'Failed to parse project_metadata artifact, skipping module sync',
        ),
      );
    });

    it('should handle non-array JSON (object) in metadata artifact', async () => {
      const context = createMockContext([
        {
          id: randomUUID(),
          type: 'project_metadata',
          value: JSON.stringify({ name: 'not-an-array', path: '/foo' }),
        },
      ]);

      await executePhaseActions('init', context);

      expect(context.x2aDatabase.listModules).not.toHaveBeenCalled();
      expect(context.x2aDatabase.createModule).not.toHaveBeenCalled();
      expect(context.logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('not an array'),
      );
    });

    it('should handle non-array JSON (null) in metadata artifact', async () => {
      const context = createMockContext([
        {
          id: randomUUID(),
          type: 'project_metadata',
          value: 'null',
        },
      ]);

      await executePhaseActions('init', context);

      expect(context.x2aDatabase.listModules).not.toHaveBeenCalled();
      expect(context.logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('not an array'),
      );
    });

    it('should handle non-array JSON (string) in metadata artifact', async () => {
      const context = createMockContext([
        {
          id: randomUUID(),
          type: 'project_metadata',
          value: '"just a string"',
        },
      ]);

      await executePhaseActions('init', context);

      expect(context.x2aDatabase.listModules).not.toHaveBeenCalled();
      expect(context.logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('not an array'),
      );
    });

    it('should log warning for unrecognized technology and store undefined', async () => {
      const metadataModules = [
        { name: 'mod-a', path: '/path/a', technology: 'unknown-tech' },
      ];
      const context = createMockContext([
        {
          id: randomUUID(),
          type: 'project_metadata',
          value: JSON.stringify(metadataModules),
        },
      ]);

      await executePhaseActions('init', context);

      expect(context.x2aDatabase.createModule).toHaveBeenCalledWith({
        name: 'mod-a',
        sourcePath: '/path/a',
        projectId,
        technology: undefined,
      });
      expect(context.logger.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          'Unrecognized source technology "unknown-tech"',
        ),
      );
    });

    it('should normalize technology aliases (e.g. legacy-ansible -> ansible)', async () => {
      const metadataModules = [
        { name: 'mod-a', path: '/path/a', technology: 'legacy-ansible' },
      ];
      const context = createMockContext([
        {
          id: randomUUID(),
          type: 'project_metadata',
          value: JSON.stringify(metadataModules),
        },
      ]);

      await executePhaseActions('init', context);

      expect(context.x2aDatabase.createModule).toHaveBeenCalledWith({
        name: 'mod-a',
        sourcePath: '/path/a',
        projectId,
        technology: 'ansible',
      });
      expect(context.logger.warn).not.toHaveBeenCalled();
    });

    it('should update technology when it changes from one valid value to another', async () => {
      const metadataModules = [
        { name: 'mod-a', path: '/path/a', technology: 'ansible' },
      ];
      const existingModules = [
        {
          id: 'id-1',
          name: 'mod-a',
          sourcePath: '/path/a',
          projectId,
          technology: 'chef' as const,
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

      expect(context.x2aDatabase.updateModule).toHaveBeenCalledWith({
        id: 'id-1',
        technology: 'ansible',
      });
      expect(context.x2aDatabase.createModule).not.toHaveBeenCalled();
    });

    it('should update technology when metadata omits it (valid -> undefined)', async () => {
      const metadataModules = [{ name: 'mod-a', path: '/path/a' }];
      const existingModules = [
        {
          id: 'id-1',
          name: 'mod-a',
          sourcePath: '/path/a',
          projectId,
          technology: 'chef' as const,
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

      expect(context.x2aDatabase.updateModule).toHaveBeenCalledWith({
        id: 'id-1',
        technology: undefined,
      });
    });

    it('should update technology when metadata adds it (undefined -> valid)', async () => {
      const metadataModules = [
        { name: 'mod-a', path: '/path/a', technology: 'powershell' },
      ];
      const existingModules = [
        {
          id: 'id-1',
          name: 'mod-a',
          sourcePath: '/path/a',
          projectId,
          technology: undefined,
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

      expect(context.x2aDatabase.updateModule).toHaveBeenCalledWith({
        id: 'id-1',
        technology: 'powershell',
      });
    });

    it('should not update when neither path nor technology changed', async () => {
      const metadataModules = [
        { name: 'mod-a', path: '/path/a', technology: 'chef' },
      ];
      const existingModules = [
        {
          id: 'id-1',
          name: 'mod-a',
          sourcePath: '/path/a',
          projectId,
          technology: 'chef' as const,
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

      expect(context.x2aDatabase.updateModule).not.toHaveBeenCalled();
      expect(context.x2aDatabase.createModule).not.toHaveBeenCalled();
      expect(context.x2aDatabase.softDeleteModule).not.toHaveBeenCalled();
    });

    it('should match module names after trimming whitespace', async () => {
      const metadataModules = [
        { name: '  mod-a  ', path: '/path/a', technology: 'chef' },
      ];
      const existingModules = [
        {
          id: 'id-1',
          name: 'mod-a',
          sourcePath: '/path/a',
          projectId,
          technology: 'chef' as const,
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

      expect(context.x2aDatabase.createModule).not.toHaveBeenCalled();
      expect(context.x2aDatabase.softDeleteModule).not.toHaveBeenCalled();
      expect(context.x2aDatabase.updateModule).not.toHaveBeenCalled();
    });

    it('should handle complex scenario: add, remove, restore, and update in one call', async () => {
      const metadataModules = [
        { name: 'kept-same', path: '/path/same', technology: 'chef' },
        { name: 'updated-path', path: '/path/new', technology: 'chef' },
        { name: 'restored', path: '/path/restored', technology: 'ansible' },
        {
          name: 'brand-new',
          path: '/path/brand-new',
          technology: 'powershell',
        },
      ];
      const existingModules = [
        {
          id: 'id-1',
          name: 'kept-same',
          sourcePath: '/path/same',
          projectId,
          technology: 'chef' as const,
        },
        {
          id: 'id-2',
          name: 'updated-path',
          sourcePath: '/path/old',
          projectId,
          technology: 'chef' as const,
        },
        {
          id: 'id-3',
          name: 'restored',
          sourcePath: '/path/restored',
          projectId,
          technology: 'chef' as const,
          removedAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'id-4',
          name: 'to-be-removed',
          sourcePath: '/path/removed',
          projectId,
          technology: 'chef' as const,
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

      expect(context.x2aDatabase.softDeleteModule).toHaveBeenCalledTimes(1);
      expect(context.x2aDatabase.softDeleteModule).toHaveBeenCalledWith({
        id: 'id-4',
      });
      expect(context.x2aDatabase.restoreModule).toHaveBeenCalledTimes(1);
      expect(context.x2aDatabase.restoreModule).toHaveBeenCalledWith({
        id: 'id-3',
      });
      expect(context.x2aDatabase.createModule).toHaveBeenCalledTimes(1);
      expect(context.x2aDatabase.createModule).toHaveBeenCalledWith({
        name: 'brand-new',
        sourcePath: '/path/brand-new',
        projectId,
        technology: 'powershell',
      });
      expect(context.x2aDatabase.updateModule).toHaveBeenCalledTimes(2);
      expect(context.x2aDatabase.updateModule).toHaveBeenCalledWith({
        id: 'id-2',
        sourcePath: '/path/new',
      });
      expect(context.x2aDatabase.updateModule).toHaveBeenCalledWith({
        id: 'id-3',
        technology: 'ansible',
      });
    });

    it('should call listModules with includeRemoved: true', async () => {
      const context = createMockContext([
        {
          id: randomUUID(),
          type: 'project_metadata',
          value: JSON.stringify([{ name: 'mod', path: '/p' }]),
        },
      ]);

      await executePhaseActions('init', context);

      expect(context.x2aDatabase.listModules).toHaveBeenCalledWith({
        projectId,
        includeRemoved: true,
      });
    });

    it('should propagate database errors from listModules', async () => {
      const context = createMockContext([
        {
          id: randomUUID(),
          type: 'project_metadata',
          value: JSON.stringify([{ name: 'mod', path: '/p' }]),
        },
      ]);
      context.x2aDatabase.listModules.mockRejectedValue(
        new Error('DB connection lost'),
      );

      await expect(executePhaseActions('init', context)).rejects.toThrow(
        'DB connection lost',
      );
    });

    it('should propagate database errors from createModule', async () => {
      const context = createMockContext([
        {
          id: randomUUID(),
          type: 'project_metadata',
          value: JSON.stringify([{ name: 'mod', path: '/p' }]),
        },
      ]);
      context.x2aDatabase.createModule.mockRejectedValue(
        new Error('Unique constraint violation'),
      );

      await expect(executePhaseActions('init', context)).rejects.toThrow(
        'Unique constraint violation',
      );
    });

    it('should propagate database errors from softDeleteModule', async () => {
      const existingModules = [
        { id: 'id-1', name: 'to-remove', sourcePath: '/p', projectId },
      ];
      const context = createMockContext([
        {
          id: randomUUID(),
          type: 'project_metadata',
          value: JSON.stringify([]),
        },
      ]);
      context.x2aDatabase.listModules.mockResolvedValue(existingModules);
      context.x2aDatabase.softDeleteModule.mockRejectedValue(
        new Error('Delete failed'),
      );

      await expect(executePhaseActions('init', context)).rejects.toThrow(
        'Delete failed',
      );
    });

    it('should handle duplicate module names in metadata (creates both)', async () => {
      const metadataModules = [
        { name: 'dup', path: '/path/first' },
        { name: 'dup', path: '/path/second' },
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
    });

    it('should use first artifact of type project_metadata when multiple exist', async () => {
      const context = createMockContext([
        {
          id: randomUUID(),
          type: 'project_metadata',
          value: JSON.stringify([{ name: 'first', path: '/first' }]),
        },
        {
          id: randomUUID(),
          type: 'project_metadata',
          value: JSON.stringify([{ name: 'second', path: '/second' }]),
        },
      ]);

      await executePhaseActions('init', context);

      expect(context.x2aDatabase.createModule).toHaveBeenCalledTimes(1);
      expect(context.x2aDatabase.createModule).toHaveBeenCalledWith({
        name: 'first',
        sourcePath: '/first',
        projectId,
        technology: undefined,
      });
    });

    it('should normalize technology case-insensitively', async () => {
      const metadataModules = [
        { name: 'mod-a', path: '/path/a', technology: 'CHEF' },
        { name: 'mod-b', path: '/path/b', technology: 'Ansible' },
      ];
      const context = createMockContext([
        {
          id: randomUUID(),
          type: 'project_metadata',
          value: JSON.stringify(metadataModules),
        },
      ]);

      await executePhaseActions('init', context);

      expect(context.x2aDatabase.createModule).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'mod-a', technology: 'chef' }),
      );
      expect(context.x2aDatabase.createModule).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'mod-b', technology: 'ansible' }),
      );
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
