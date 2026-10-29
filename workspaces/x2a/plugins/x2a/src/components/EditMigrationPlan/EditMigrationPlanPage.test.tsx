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

import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { renderInTestApp } from '@backstage/test-utils';
import { MIGRATION_PLAN_MAX_CONTENT_BYTES } from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { mockUseTranslation } from '../../test-utils/mockTranslations';
import { EditMigrationPlanPage } from './EditMigrationPlanPage';

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: mockUseTranslation,
}));

const mockNavigate = jest.fn();
let mockParams: Record<string, string> = { projectId: 'proj-1' };
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => mockParams,
}));

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useRouteRef: (ref: { id: string }) => {
    switch (ref.id) {
      case 'x2a.module':
        return (p: { projectId: string; moduleId: string }) =>
          `/x2a/projects/${p.projectId}/modules/${p.moduleId}`;
      case 'x2a.project':
        return (p: { projectId: string }) => `/x2a/projects/${p.projectId}`;
      default:
        return () => '/x2a';
    }
  },
}));

const clientServiceMock = {
  projectsProjectIdGet: jest.fn(),
  projectsProjectIdModulesModuleIdGet: jest.fn(),
  projectsProjectIdMigrationPlanReadPost: jest.fn(),
  projectsProjectIdMigrationPlanPut: jest.fn(),
  projectsProjectIdModulesModuleIdMigrationPlanReadPost: jest.fn(),
  projectsProjectIdModulesModuleIdMigrationPlanPut: jest.fn(),
};
jest.mock('../../ClientService', () => ({
  useClientService: () => clientServiceMock,
}));

const mockAuthenticate = jest.fn();
jest.mock('../../repoAuth', () => ({
  useRepoAuthentication: () => ({ authenticate: mockAuthenticate }),
}));

let mockWriteAccess = { loading: false, canWrite: true };
jest.mock('../../hooks/useProjectWriteAccess', () => ({
  useProjectWriteAccess: () => ({
    loading: mockWriteAccess.loading,
    hasAnyWriteAccess: mockWriteAccess.canWrite,
    canWriteProject: () => mockWriteAccess.canWrite,
  }),
}));

jest.mock('../../hooks/useScmHostMap', () => ({
  useScmHostMap: () => new Map(),
}));

const ok = (body: unknown) => ({
  ok: true,
  status: 200,
  json: async () => body,
});
const fail = (status: number, message: string) => ({
  ok: false,
  status,
  json: async () => ({ error: { name: 'Error', message } }),
});

const project = {
  id: 'proj-1',
  name: 'My Project',
  targetRepoUrl: 'https://github.com/org/repo.git',
  targetRepoBranch: 'main',
  ownedBy: 'user:default/mock',
};
const module_ = { id: 'mod-1', projectId: 'proj-1', name: 'My Module' };

const readPlan = clientServiceMock.projectsProjectIdMigrationPlanReadPost;
const savePlan = clientServiceMock.projectsProjectIdMigrationPlanPut;
const readModulePlan =
  clientServiceMock.projectsProjectIdModulesModuleIdMigrationPlanReadPost;
const saveModulePlan =
  clientServiceMock.projectsProjectIdModulesModuleIdMigrationPlanPut;

const renderPage = () => renderInTestApp(<EditMigrationPlanPage />);
const editor = () => screen.findByLabelText('Markdown source');
const type = async (value: string) =>
  fireEvent.change(await editor(), { target: { value } });
// A dialog stays in the DOM during its exit transition
const dialogClosed = () =>
  waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
const click = (name: string | RegExp) =>
  fireEvent.click(screen.getByRole('button', { name }));

describe('EditMigrationPlanPage', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockParams = { projectId: 'proj-1' };
    mockWriteAccess = { loading: false, canWrite: true };
    mockAuthenticate.mockResolvedValue([
      { token: 'oauth-token', provider: 'github' },
    ]);
    clientServiceMock.projectsProjectIdGet.mockResolvedValue(ok(project));
    clientServiceMock.projectsProjectIdModulesModuleIdGet.mockResolvedValue(
      ok(module_),
    );
    readPlan.mockResolvedValue(ok({ content: '# Plan', version: 'v1' }));
    savePlan.mockResolvedValue(ok({ version: 'v2' }));
    readModulePlan.mockResolvedValue(
      ok({ content: '# Module plan', version: 'm1' }),
    );
    saveModulePlan.mockResolvedValue(ok({ version: 'm2' }));
  });

  describe('loading', () => {
    it('loads the project plan with the token for the write scope', async () => {
      await renderPage();

      expect(await editor()).toHaveValue('# Plan');
      expect(mockAuthenticate).toHaveBeenCalledWith([
        { provider: 'github', tokenType: 'oauth', scope: 'repo' },
      ]);
      expect(readPlan).toHaveBeenCalledWith({
        path: { projectId: 'proj-1' },
        body: { targetRepoAuth: { token: 'oauth-token' } },
      });
      expect(
        screen.getByText('Edit: Project Migration Plan'),
      ).toBeInTheDocument();
      expect(screen.getByText('My Project')).toBeInTheDocument();
      expect(
        screen.getByText(/module list is not updated by editing the document/),
      ).toBeInTheDocument();
    });

    it('requests the api scope for GitLab', async () => {
      clientServiceMock.projectsProjectIdGet.mockResolvedValue(
        ok({ ...project, targetRepoUrl: 'https://gitlab.com/g/r.git' }),
      );

      await renderPage();

      await editor();
      expect(mockAuthenticate).toHaveBeenCalledWith([
        { provider: 'gitlab', tokenType: 'oauth', scope: 'api' },
      ]);
    });

    it('loads the module plan', async () => {
      mockParams = { projectId: 'proj-1', moduleId: 'mod-1' };

      await renderPage();

      expect(await editor()).toHaveValue('# Module plan');
      expect(readModulePlan).toHaveBeenCalledWith({
        path: { projectId: 'proj-1', moduleId: 'mod-1' },
        body: { targetRepoAuth: { token: 'oauth-token' } },
      });
      expect(readPlan).not.toHaveBeenCalled();
      expect(
        screen.getByText('Edit: Module Migration Plan'),
      ).toBeInTheDocument();
      expect(screen.getByText('My Module')).toBeInTheDocument();
      expect(
        screen.queryByText(/module list is not updated/),
      ).not.toBeInTheDocument();
    });

    it('waits for the permissions before deciding', async () => {
      mockWriteAccess = { loading: true, canWrite: false };

      await renderPage();

      await waitFor(() =>
        expect(clientServiceMock.projectsProjectIdGet).toHaveBeenCalled(),
      );
      expect(
        screen.queryByText(/not allowed to edit this project/),
      ).not.toBeInTheDocument();
      expect(readPlan).not.toHaveBeenCalled();
    });

    it('refuses users who may not write the project', async () => {
      mockWriteAccess = { loading: false, canWrite: false };

      await renderPage();

      expect(
        await screen.findByText(/not allowed to edit this project/),
      ).toBeInTheDocument();
      expect(mockAuthenticate).not.toHaveBeenCalled();
      expect(readPlan).not.toHaveBeenCalled();
    });

    it('explains that Bitbucket is not supported', async () => {
      clientServiceMock.projectsProjectIdGet.mockResolvedValue(
        ok({ ...project, targetRepoUrl: 'https://bitbucket.org/ws/r.git' }),
      );

      await renderPage();

      expect(
        await screen.findByText(/isn't available for Bitbucket repositories/),
      ).toBeInTheDocument();
      expect(mockAuthenticate).not.toHaveBeenCalled();
      expect(readPlan).not.toHaveBeenCalled();
    });

    it('shows the backend message when the project can not be loaded', async () => {
      clientServiceMock.projectsProjectIdGet.mockResolvedValue(
        fail(404, 'Project not found for the "user" user.'),
      );

      await renderPage();

      expect(
        await screen.findByText('Project not found for the "user" user.'),
      ).toBeInTheDocument();
      expect(readPlan).not.toHaveBeenCalled();
    });

    it('shows the error when the module can not be loaded', async () => {
      mockParams = { projectId: 'proj-1', moduleId: 'mod-1' };
      clientServiceMock.projectsProjectIdModulesModuleIdGet.mockResolvedValue(
        fail(404, 'Module "mod-1" not found.'),
      );

      await renderPage();

      expect(
        await screen.findByText('Module "mod-1" not found.'),
      ).toBeInTheDocument();
    });

    it('shows the error when the request itself fails', async () => {
      clientServiceMock.projectsProjectIdGet.mockRejectedValue(
        new Error('Network down'),
      );

      await renderPage();

      expect(await screen.findByText('Network down')).toBeInTheDocument();
    });

    it('shows the SCM error with the next steps and lets the user retry with Reload', async () => {
      readPlan.mockResolvedValueOnce(
        fail(404, '"p/plan.md" was not found on branch "main". Check it.'),
      );

      await renderPage();

      expect(
        await screen.findByText(/was not found on branch "main"/),
      ).toBeInTheDocument();

      click('Reload');

      expect(await editor()).toHaveValue('# Plan');
      expect(readPlan).toHaveBeenCalledTimes(2);
    });

    it('shows a generic message when the failure carries none', async () => {
      readPlan.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('not json');
        },
      });

      await renderPage();

      expect(
        await screen.findByText(/Failed to load the document/),
      ).toBeInTheDocument();
    });

    it('asks to authorize when the token can not be obtained silently, then loads', async () => {
      mockAuthenticate.mockRejectedValueOnce(new Error('popup blocked'));

      await renderPage();

      expect(
        await screen.findByText(
          'Could not get an access token for GitHub: popup blocked',
        ),
      ).toBeInTheDocument();
      expect(readPlan).not.toHaveBeenCalled();

      click('Authorize GitHub');

      expect(await editor()).toHaveValue('# Plan');
      expect(readPlan).toHaveBeenCalledTimes(1);
    });

    it('asks to authorize again when the SCM rejects the token', async () => {
      readPlan.mockResolvedValueOnce(
        fail(401, 'GitHub rejected the access token.'),
      );

      await renderPage();

      expect(
        await screen.findByText('GitHub rejected the access token.'),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Authorize GitHub' }),
      ).toBeInTheDocument();
    });
  });

  describe('saving', () => {
    it('saves through the dialog with the default commit message', async () => {
      await renderPage();
      await type('# Changed');

      click('Save');
      const dialog = await screen.findByRole('dialog');
      expect(
        within(dialog).getByText(/branch "main" of the target repository/),
      ).toBeInTheDocument();
      expect(within(dialog).getByTestId('commit-message')).toHaveValue(
        'Manual update of migration plan',
      );
      fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

      expect(
        await screen.findByText(/A new commit was created/),
      ).toBeInTheDocument();
      await dialogClosed();
      expect(savePlan).toHaveBeenCalledWith({
        path: { projectId: 'proj-1' },
        body: {
          content: '# Changed',
          message: 'Manual update of migration plan',
          version: 'v1',
          targetRepoAuth: { token: 'oauth-token' },
        },
      });
      // The saved text is the new baseline: nothing left to save
      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Reload' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
      expect(screen.queryByText('You have unsaved changes.')).toBeNull();
    });

    it('sends the edited commit message and the version of the previous save', async () => {
      await renderPage();

      await type('one');
      click('Save');
      let dialog = await screen.findByRole('dialog');
      fireEvent.change(within(dialog).getByTestId('commit-message'), {
        target: { value: 'First' },
      });
      fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
      await screen.findByText(/A new commit was created/);
      await dialogClosed();

      await type('two');
      expect(screen.queryByText(/A new commit was created/)).toBeNull();
      click('Save');
      dialog = await screen.findByRole('dialog');
      fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
      await waitFor(() => expect(savePlan).toHaveBeenCalledTimes(2));

      expect(savePlan.mock.calls[0][0].body).toMatchObject({
        message: 'First',
        version: 'v1',
      });
      expect(savePlan.mock.calls[1][0].body).toMatchObject({
        message: 'Manual update of migration plan',
        version: 'v2',
      });
    });

    it('saves the module plan with the module name in the default message', async () => {
      mockParams = { projectId: 'proj-1', moduleId: 'mod-1' };
      await renderPage();
      await type('# Changed module');

      click('Save');
      const dialog = await screen.findByRole('dialog');
      expect(within(dialog).getByTestId('commit-message')).toHaveValue(
        'Manual update of My Module migration plan',
      );
      fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

      await waitFor(() => expect(saveModulePlan).toHaveBeenCalled());
      expect(saveModulePlan).toHaveBeenCalledWith({
        path: { projectId: 'proj-1', moduleId: 'mod-1' },
        body: {
          content: '# Changed module',
          message: 'Manual update of My Module migration plan',
          version: 'm1',
          targetRepoAuth: { token: 'oauth-token' },
        },
      });
      expect(savePlan).not.toHaveBeenCalled();
    });

    it('can not save without changes', async () => {
      await renderPage();
      await editor();

      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();

      await type('# Plan changed');
      expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();

      await type('# Plan');
      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    });

    it('keeps the changes and shows the message when the SCM rejects the save', async () => {
      savePlan.mockResolvedValueOnce(
        fail(409, 'The file was changed after you opened it. Use Reload.'),
      );
      await renderPage();
      await type('# Changed');

      click('Save');
      const dialog = await screen.findByRole('dialog');
      fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

      expect(
        await screen.findByText(
          'The file was changed after you opened it. Use Reload.',
        ),
      ).toBeInTheDocument();
      await dialogClosed();
      expect(await editor()).toHaveValue('# Changed');
      expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
      expect(screen.queryByText(/A new commit was created/)).toBeNull();
    });

    it('shows a generic message when the save fails without details', async () => {
      savePlan.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      });
      await renderPage();
      await type('# Changed');

      click('Save');
      fireEvent.click(
        within(await screen.findByRole('dialog')).getByRole('button', {
          name: 'Save',
        }),
      );

      expect(
        await screen.findByText(/Failed to save the document/),
      ).toBeInTheDocument();
    });

    it('shows a thrown error', async () => {
      savePlan.mockRejectedValueOnce(new Error('Socket hang up'));
      await renderPage();
      await type('# Changed');

      click('Save');
      fireEvent.click(
        within(await screen.findByRole('dialog')).getByRole('button', {
          name: 'Save',
        }),
      );

      expect(await screen.findByText('Socket hang up')).toBeInTheDocument();
    });

    it('does not save when the token can not be obtained', async () => {
      await renderPage();
      await type('# Changed');
      mockAuthenticate.mockRejectedValueOnce(new Error('consent denied'));

      click('Save');
      fireEvent.click(
        within(await screen.findByRole('dialog')).getByRole('button', {
          name: 'Save',
        }),
      );

      expect(
        await screen.findByText(
          'Could not get an access token for GitHub: consent denied',
        ),
      ).toBeInTheDocument();
      expect(savePlan).not.toHaveBeenCalled();
    });

    it('does not save when the dialog is dismissed', async () => {
      await renderPage();
      await type('# Changed');

      click('Save');
      fireEvent.click(
        within(await screen.findByRole('dialog')).getByRole('button', {
          name: 'Keep editing',
        }),
      );

      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      expect(savePlan).not.toHaveBeenCalled();
    });

    it('disables saving a document above the size limit', async () => {
      await renderPage();

      await type('x'.repeat(MIGRATION_PLAN_MAX_CONTENT_BYTES + 1));

      expect(
        screen.getByText(/too large to be saved from here/),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    });

    it('measures the size in bytes, not characters', async () => {
      await renderPage();

      // 2 bytes per character
      await type('č'.repeat(MIGRATION_PLAN_MAX_CONTENT_BYTES / 2 + 1));

      expect(
        screen.getByText(/too large to be saved from here/),
      ).toBeInTheDocument();
    });
  });

  describe('cancelling', () => {
    it('closes the unchanged document without asking', async () => {
      await renderPage();
      await editor();
      expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull();

      click('Close');

      expect(screen.queryByRole('dialog')).toBeNull();
      expect(mockNavigate).toHaveBeenCalledWith('/x2a/projects/proj-1');
    });

    it('closes an unchanged module plan to the module page', async () => {
      mockParams = { projectId: 'proj-1', moduleId: 'mod-1' };
      await renderPage();
      await editor();

      click('Close');

      expect(mockNavigate).toHaveBeenCalledWith(
        '/x2a/projects/proj-1/modules/mod-1',
      );
    });

    it('reads Cancel instead of Close once the document is edited', async () => {
      await renderPage();
      await type('# Changed');

      expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
      click('Cancel');
      expect(await screen.findByRole('dialog')).toBeInTheDocument();
    });

    it('returns to the project page after confirmation', async () => {
      await renderPage();
      await type('# Changed');

      click('Cancel');
      const dialog = await screen.findByRole('dialog');
      expect(mockNavigate).not.toHaveBeenCalled();
      fireEvent.click(
        within(dialog).getByRole('button', { name: 'Discard changes' }),
      );

      expect(mockNavigate).toHaveBeenCalledWith('/x2a/projects/proj-1');
    });

    it('returns to the module page for a module plan', async () => {
      mockParams = { projectId: 'proj-1', moduleId: 'mod-1' };
      await renderPage();
      await type('# Changed');

      click('Cancel');
      fireEvent.click(
        within(await screen.findByRole('dialog')).getByRole('button', {
          name: 'Discard changes',
        }),
      );

      expect(mockNavigate).toHaveBeenCalledWith(
        '/x2a/projects/proj-1/modules/mod-1',
      );
    });

    it('stays when the user keeps editing', async () => {
      await renderPage();
      await type('# Changed');

      click('Cancel');
      fireEvent.click(
        within(await screen.findByRole('dialog')).getByRole('button', {
          name: 'Keep editing',
        }),
      );

      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(await editor()).toHaveValue('# Changed');
    });
  });

  describe('reloading', () => {
    it('drops the changes and reads the document again after confirmation', async () => {
      await renderPage();
      await type('# Changed');
      readPlan.mockResolvedValueOnce(ok({ content: '# Newer', version: 'v7' }));

      click('Reload');
      const dialog = await screen.findByRole('dialog');
      expect(readPlan).toHaveBeenCalledTimes(1);
      fireEvent.click(within(dialog).getByRole('button', { name: 'Reload' }));

      await waitFor(async () => expect(await editor()).toHaveValue('# Newer'));
      expect(readPlan).toHaveBeenCalledTimes(2);
      await dialogClosed();

      // the new version is the one saved against
      await type('# Newer changed');
      click('Save');
      fireEvent.click(
        within(await screen.findByRole('dialog')).getByRole('button', {
          name: 'Save',
        }),
      );
      await waitFor(() => expect(savePlan).toHaveBeenCalled());
      expect(savePlan.mock.calls[0][0].body.version).toBe('v7');
    });

    it('keeps the changes when the user keeps editing', async () => {
      await renderPage();
      await type('# Changed');

      click('Reload');
      fireEvent.click(
        within(await screen.findByRole('dialog')).getByRole('button', {
          name: 'Keep editing',
        }),
      );

      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      expect(readPlan).toHaveBeenCalledTimes(1);
      expect(await editor()).toHaveValue('# Changed');
    });

    it('is disabled until the document is edited', async () => {
      await renderPage();
      await editor();
      expect(screen.getByRole('button', { name: 'Reload' })).toBeDisabled();

      await type('# Changed');

      expect(screen.getByRole('button', { name: 'Reload' })).toBeEnabled();
    });
  });

  describe('preview', () => {
    it('renders the Markdown and switches back to the editor', async () => {
      await renderPage();
      await type('# Heading\n\nSome **bold** text');

      fireEvent.click(screen.getByRole('tab', { name: 'Preview' }));

      expect(
        await screen.findByRole('heading', { name: 'Heading' }),
      ).toBeInTheDocument();
      expect(screen.queryByLabelText('Markdown source')).toBeNull();

      fireEvent.click(screen.getByRole('tab', { name: 'Edit' }));
      expect(await editor()).toHaveValue('# Heading\n\nSome **bold** text');
    });
  });

  describe('unsaved changes', () => {
    const beforeUnload = () => {
      const event = new Event('beforeunload', { cancelable: true });
      window.dispatchEvent(event);
      return event;
    };

    it('asks the browser to confirm leaving while there are unsaved changes', async () => {
      await renderPage();
      await editor();
      expect(beforeUnload().defaultPrevented).toBe(false);

      await type('# Changed');
      expect(
        await screen.findByText('You have unsaved changes.'),
      ).toBeInTheDocument();
      expect(beforeUnload().defaultPrevented).toBe(true);

      await type('# Plan');
      expect(beforeUnload().defaultPrevented).toBe(false);
    });

    it('stops asking after the changes were saved', async () => {
      await renderPage();
      await type('# Changed');
      click('Save');
      fireEvent.click(
        within(await screen.findByRole('dialog')).getByRole('button', {
          name: 'Save',
        }),
      );
      await screen.findByText(/A new commit was created/);
      await dialogClosed();

      expect(beforeUnload().defaultPrevented).toBe(false);
    });
  });
});
