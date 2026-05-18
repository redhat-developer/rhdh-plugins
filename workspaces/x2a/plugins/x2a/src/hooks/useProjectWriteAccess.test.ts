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

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useApi: jest.fn(() => ({
    getBackstageIdentity: jest.fn(),
  })),
}));

jest.mock('@backstage/plugin-permission-react', () => ({
  usePermission: jest.fn(),
}));

jest.mock('react-use/lib/useAsync');

import { renderHook } from '@testing-library/react';
import { usePermission } from '@backstage/plugin-permission-react';
import useAsync from 'react-use/lib/useAsync';
import { Project } from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { useProjectWriteAccess } from './useProjectWriteAccess';

const mockUsePermission = usePermission as jest.Mock;
const mockUseAsync = useAsync as jest.Mock;

type PermResult = { loading: boolean; allowed: boolean };

const makeProject = (overrides?: Partial<Project>): Project => ({
  id: 'proj-1',
  name: 'Test Project',
  sourceRepoUrl: 'https://github.com/org/source',
  targetRepoUrl: 'https://github.com/org/target',
  sourceRepoBranch: 'main',
  targetRepoBranch: 'main',
  createdAt: new Date('2024-01-01'),
  ownedBy: 'user:default/alice',
  ...overrides,
});

const setupMocks = ({
  adminWrite = { loading: false, allowed: false } as PermResult,
  userPerm = { loading: false, allowed: false } as PermResult,
  ownershipEntityRefs = [] as string[],
  identityLoading = false,
}: {
  adminWrite?: PermResult;
  userPerm?: PermResult;
  ownershipEntityRefs?: string[];
  identityLoading?: boolean;
} = {}) => {
  mockUsePermission.mockImplementation(({ permission }: any) => {
    if (permission.name === 'x2a.user') {
      return userPerm;
    }
    return adminWrite;
  });

  mockUseAsync.mockReturnValue({
    loading: identityLoading,
    value: identityLoading
      ? undefined
      : {
          type: 'user',
          userEntityRef: ownershipEntityRefs[0] ?? 'user:default/anonymous',
          ownershipEntityRefs,
        },
  });
};

describe('useProjectWriteAccess', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loading state', () => {
    it('reports loading when admin permission is loading', () => {
      setupMocks({
        adminWrite: { loading: true, allowed: false },
        ownershipEntityRefs: ['user:default/alice'],
      });

      const { result } = renderHook(() => useProjectWriteAccess());
      expect(result.current.loading).toBe(true);
    });

    it('reports loading when user permission is loading', () => {
      setupMocks({
        userPerm: { loading: true, allowed: false },
        ownershipEntityRefs: ['user:default/alice'],
      });

      const { result } = renderHook(() => useProjectWriteAccess());
      expect(result.current.loading).toBe(true);
    });

    it('reports loading when identity has not resolved yet', () => {
      setupMocks({ identityLoading: true });

      const { result } = renderHook(() => useProjectWriteAccess());
      expect(result.current.loading).toBe(true);
    });

    it('is not loading once all dependencies resolve', () => {
      setupMocks({
        ownershipEntityRefs: ['user:default/alice'],
      });

      const { result } = renderHook(() => useProjectWriteAccess());
      expect(result.current.loading).toBe(false);
    });

    it('canWriteProject returns false while loading', () => {
      setupMocks({
        adminWrite: { loading: true, allowed: false },
        identityLoading: true,
      });

      const { result } = renderHook(() => useProjectWriteAccess());
      expect(result.current.canWriteProject(makeProject())).toBe(false);
    });

    it('hasAnyWriteAccess is false while loading', () => {
      setupMocks({
        adminWrite: { loading: true, allowed: false },
        userPerm: { loading: true, allowed: false },
        identityLoading: true,
      });

      const { result } = renderHook(() => useProjectWriteAccess());
      expect(result.current.hasAnyWriteAccess).toBe(false);
    });
  });

  describe('admin write permission', () => {
    it('grants write to a project owned by any user', () => {
      setupMocks({
        adminWrite: { loading: false, allowed: true },
        ownershipEntityRefs: ['user:default/admin'],
      });

      const { result } = renderHook(() => useProjectWriteAccess());

      expect(result.current.hasAnyWriteAccess).toBe(true);
      expect(
        result.current.canWriteProject(
          makeProject({ ownedBy: 'user:default/alice' }),
        ),
      ).toBe(true);
      expect(
        result.current.canWriteProject(
          makeProject({ ownedBy: 'user:default/bob' }),
        ),
      ).toBe(true);
    });

    it('grants write to a project owned by any group', () => {
      setupMocks({
        adminWrite: { loading: false, allowed: true },
        ownershipEntityRefs: ['user:default/admin'],
      });

      const { result } = renderHook(() => useProjectWriteAccess());

      expect(
        result.current.canWriteProject(
          makeProject({ ownedBy: 'group:default/team-x' }),
        ),
      ).toBe(true);
    });
  });

  describe('user permission (ownership-based)', () => {
    it('grants write to a project owned by the user', () => {
      setupMocks({
        userPerm: { loading: false, allowed: true },
        ownershipEntityRefs: ['user:default/alice'],
      });

      const { result } = renderHook(() => useProjectWriteAccess());

      expect(result.current.hasAnyWriteAccess).toBe(true);
      expect(
        result.current.canWriteProject(
          makeProject({ ownedBy: 'user:default/alice' }),
        ),
      ).toBe(true);
    });

    it('denies write to a project owned by another user', () => {
      setupMocks({
        userPerm: { loading: false, allowed: true },
        ownershipEntityRefs: ['user:default/alice'],
      });

      const { result } = renderHook(() => useProjectWriteAccess());

      expect(
        result.current.canWriteProject(
          makeProject({ ownedBy: 'user:default/bob' }),
        ),
      ).toBe(false);
    });

    it('grants write to a project owned by a group the user belongs to', () => {
      setupMocks({
        userPerm: { loading: false, allowed: true },
        ownershipEntityRefs: [
          'user:default/alice',
          'group:default/team-a',
          'group:default/org',
        ],
      });

      const { result } = renderHook(() => useProjectWriteAccess());

      expect(
        result.current.canWriteProject(
          makeProject({ ownedBy: 'group:default/team-a' }),
        ),
      ).toBe(true);
      expect(
        result.current.canWriteProject(
          makeProject({ ownedBy: 'group:default/org' }),
        ),
      ).toBe(true);
    });

    it('denies write to a project owned by a group the user is not in', () => {
      setupMocks({
        userPerm: { loading: false, allowed: true },
        ownershipEntityRefs: ['user:default/alice', 'group:default/team-a'],
      });

      const { result } = renderHook(() => useProjectWriteAccess());

      expect(
        result.current.canWriteProject(
          makeProject({ ownedBy: 'group:default/other-team' }),
        ),
      ).toBe(false);
    });
  });

  describe('no write permissions', () => {
    it('denies write even if project is owned by the user', () => {
      setupMocks({
        ownershipEntityRefs: ['user:default/alice'],
      });

      const { result } = renderHook(() => useProjectWriteAccess());

      expect(result.current.hasAnyWriteAccess).toBe(false);
      expect(
        result.current.canWriteProject(
          makeProject({ ownedBy: 'user:default/alice' }),
        ),
      ).toBe(false);
    });
  });

  describe('hasAnyWriteAccess', () => {
    it('is true when only admin write is allowed', () => {
      setupMocks({
        adminWrite: { loading: false, allowed: true },
        ownershipEntityRefs: ['user:default/admin'],
      });

      const { result } = renderHook(() => useProjectWriteAccess());
      expect(result.current.hasAnyWriteAccess).toBe(true);
    });

    it('is true when only user permission is allowed', () => {
      setupMocks({
        userPerm: { loading: false, allowed: true },
        ownershipEntityRefs: ['user:default/alice'],
      });

      const { result } = renderHook(() => useProjectWriteAccess());
      expect(result.current.hasAnyWriteAccess).toBe(true);
    });

    it('is true when both permissions are allowed', () => {
      setupMocks({
        adminWrite: { loading: false, allowed: true },
        userPerm: { loading: false, allowed: true },
        ownershipEntityRefs: ['user:default/admin'],
      });

      const { result } = renderHook(() => useProjectWriteAccess());
      expect(result.current.hasAnyWriteAccess).toBe(true);
    });

    it('is false when neither permission is allowed', () => {
      setupMocks({
        ownershipEntityRefs: ['user:default/alice'],
      });

      const { result } = renderHook(() => useProjectWriteAccess());
      expect(result.current.hasAnyWriteAccess).toBe(false);
    });
  });
});
