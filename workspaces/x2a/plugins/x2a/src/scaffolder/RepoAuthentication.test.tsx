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

const mockSetSecrets = jest.fn();
const mockAuthenticate = jest.fn();

jest.mock('@backstage/plugin-scaffolder-react', () => ({
  ...jest.requireActual('@backstage/plugin-scaffolder-react'),
  useTemplateSecrets: () => ({
    secrets: {},
    setSecrets: mockSetSecrets,
  }),
}));

jest.mock('../hooks/useScmHostMap', () => ({
  useScmHostMap: () => new Map<string, string>(),
}));

jest.mock('../repoAuth', () => ({
  useRepoAuthentication: () => ({
    authenticate: mockAuthenticate,
  }),
}));

import { render, screen, waitFor, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@material-ui/core/styles';
import {
  RepoAuthentication,
  repoAuthenticationValidation,
} from './RepoAuthentication';
import type { FieldExtensionComponentProps } from '@backstage/plugin-scaffolder-react';
import { ApiHolder } from '@backstage/core-plugin-api';

const statusTheme = createTheme({
  palette: {
    status: {
      ok: '#71CF88',
      warning: '#FFB84D',
      error: '#F84C55',
      running: '#3E8635',
      pending: '#AAAAAA',
      background: '#FEFEFE',
    },
  },
} as any);

function toDataUrl(csv: string): string {
  return `data:text/csv;base64,${Buffer.from(csv).toString('base64')}`;
}

const VALID_CSV = toDataUrl(
  'name,abbreviation,sourceRepoUrl,sourceRepoBranch,targetRepoBranch\n' +
    'Project A,PA,https://github.com/org/repo-a,main,main',
);

const MIXED_CSV = toDataUrl(
  'name,abbreviation,sourceRepoUrl,sourceRepoBranch,targetRepoUrl,targetRepoBranch\n' +
    'GH Project,GH,https://github.com/org/gh-repo,main,https://github.com/org/gh-target,main\n' +
    'GL Project,GL,https://gitlab.com/org/gl-repo,main,https://gitlab.com/org/gl-target,main',
);

const CROSS_PROVIDER_CSV = toDataUrl(
  'name,abbreviation,sourceRepoUrl,sourceRepoBranch,targetRepoUrl,targetRepoBranch\n' +
    'Cross Project,CP,https://github.com/org/source,main,https://gitlab.com/org/target,main',
);

const flushAsync = () => new Promise(r => setTimeout(r, 0));

const validatorContext = {
  apiHolder: { get: jest.fn() } as unknown as ApiHolder,
  formData: {},
  schema: {},
};

function makeProps(
  overrides: Partial<FieldExtensionComponentProps<string>> = {},
): FieldExtensionComponentProps<string> {
  return {
    onChange: jest.fn(),
    onBlur: jest.fn(),
    onFocus: jest.fn(),
    rawErrors: [],
    required: false,
    disabled: false,
    readonly: false,
    schema: {
      title: 'Repo Auth',
      description: 'Authenticate with SCM providers',
    },
    uiSchema: {
      'ui:options': { csvFieldName: 'csvContent' },
    },
    formContext: {
      formData: {},
    },
    formData: undefined,
    name: 'repoAuthentication',
    idSchema: { $id: 'root_repoAuthentication' },
    registry: {},
    ...overrides,
  } as unknown as FieldExtensionComponentProps<string>;
}

async function renderComponent(
  overrides: Partial<FieldExtensionComponentProps<string>> = {},
) {
  const props = makeProps(overrides);
  let result!: ReturnType<typeof render>;
  await act(async () => {
    result = render(
      <ThemeProvider theme={statusTheme}>
        <RepoAuthentication {...props} />
      </ThemeProvider>,
    );
    // Yield to the macrotask queue so fire-and-forget async auth
    // effects settle their microtasks inside this act() scope.
    await flushAsync();
  });
  return result;
}

describe('RepoAuthentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthenticate.mockResolvedValue([
      { token: 'mock-augmented-token', provider: 'github' },
    ]);
  });

  describe('rendering', () => {
    it('should render title and description', async () => {
      await renderComponent();
      expect(screen.getByText('Repo Auth')).toBeInTheDocument();
      expect(
        screen.getByText('Authenticate with SCM providers'),
      ).toBeInTheDocument();
    });

    it('should show error when csvFieldName is not configured', async () => {
      await renderComponent({
        uiSchema: { 'ui:options': {} },
      });
      expect(
        screen.getByText(
          'CSV field name is required for RepoAuthentication extension',
        ),
      ).toBeInTheDocument();
    });

    it('should not show csvFieldName error when configured', async () => {
      await renderComponent();
      expect(
        screen.queryByText(
          'CSV field name is required for RepoAuthentication extension',
        ),
      ).not.toBeInTheDocument();
    });
  });

  describe('CSV parsing errors', () => {
    it('should show error for invalid CSV data-URL', async () => {
      await renderComponent({
        formContext: {
          formData: { csvContent: 'not-a-data-url' },
        },
      });

      expect(
        screen.getByText(/expected a base64-encoded data-URL/),
      ).toBeInTheDocument();
    });

    it('should show error for CSV missing required columns', async () => {
      const invalidCsv = toDataUrl('name,abbreviation\nProject,PRJ');
      await renderComponent({
        formContext: {
          formData: { csvContent: invalidCsv },
        },
      });

      expect(
        screen.getByText(/CSV is missing required column/),
      ).toBeInTheDocument();
    });

    it('should display parseError in the bottom error area and not render a table', async () => {
      await renderComponent({
        formContext: {
          formData: { csvContent: 'not-a-data-url' },
        },
      });

      expect(
        screen.getByText(/expected a base64-encoded data-URL/),
      ).toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('should not attempt authentication when CSV has a parse error', async () => {
      await renderComponent({
        formContext: {
          formData: { csvContent: 'not-a-data-url' },
        },
      });

      expect(mockAuthenticate).not.toHaveBeenCalled();
    });
  });

  describe('authentication flow', () => {
    it('should call authenticate for providers found in CSV', async () => {
      await renderComponent({
        formContext: {
          formData: { csvContent: VALID_CSV },
        },
      });

      await waitFor(() => {
        expect(mockAuthenticate).toHaveBeenCalled();
      });
    });

    it('should call onChange with "authenticated" on success', async () => {
      const onChange = jest.fn();
      await renderComponent({
        onChange,
        formContext: {
          formData: { csvContent: VALID_CSV },
        },
      });

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith('authenticated');
      });
    });

    it('should store tokens via setSecrets on success', async () => {
      await renderComponent({
        formContext: {
          formData: { csvContent: VALID_CSV },
        },
      });

      await waitFor(() => {
        expect(mockSetSecrets).toHaveBeenCalledWith(
          expect.objectContaining({
            OAUTH_TOKEN_github: 'mock-augmented-token',
          }),
        );
      });
    });

    it('should authenticate multiple distinct providers', async () => {
      mockAuthenticate.mockImplementation(descriptors => {
        const provider = descriptors[0]?.provider ?? 'unknown';
        return Promise.resolve([{ token: `token-for-${provider}`, provider }]);
      });

      await renderComponent({
        formContext: {
          formData: { csvContent: MIXED_CSV },
        },
      });

      await waitFor(() => {
        expect(mockAuthenticate).toHaveBeenCalledTimes(2);
      });

      await waitFor(() => {
        expect(mockSetSecrets).toHaveBeenCalledWith(
          expect.objectContaining({
            OAUTH_TOKEN_github: 'token-for-github',
            OAUTH_TOKEN_gitlab: 'token-for-gitlab',
          }),
        );
      });
    });

    it('should authenticate both providers when a single row has cross-provider source and target', async () => {
      mockAuthenticate.mockImplementation(descriptors => {
        const provider = descriptors[0]?.provider ?? 'unknown';
        return Promise.resolve([{ token: `token-for-${provider}`, provider }]);
      });

      await renderComponent({
        formContext: {
          formData: { csvContent: CROSS_PROVIDER_CSV },
        },
      });

      await waitFor(() => {
        expect(mockAuthenticate).toHaveBeenCalledTimes(2);
      });

      await waitFor(() => {
        expect(mockSetSecrets).toHaveBeenCalledWith(
          expect.objectContaining({
            OAUTH_TOKEN_github: 'token-for-github',
            OAUTH_TOKEN_gitlab: 'token-for-gitlab',
          }),
        );
      });
    });

    it('should not call authenticate when csvContent is absent', async () => {
      await renderComponent({
        formContext: { formData: {} },
      });

      expect(mockAuthenticate).not.toHaveBeenCalled();
    });

    it('should re-authenticate when CSV content changes', async () => {
      const onChange = jest.fn();
      const props = makeProps({
        onChange,
        formContext: { formData: { csvContent: VALID_CSV } },
      });

      let result!: ReturnType<typeof render>;
      await act(async () => {
        result = render(
          <ThemeProvider theme={statusTheme}>
            <RepoAuthentication {...props} />
          </ThemeProvider>,
        );
        await flushAsync();
      });

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith('authenticated');
      });

      const newCsv = toDataUrl(
        'name,abbreviation,sourceRepoUrl,sourceRepoBranch,targetRepoBranch\n' +
          'New Project,NP,https://gitlab.com/org/new-repo,main,main',
      );

      mockAuthenticate.mockResolvedValue([
        { token: 'new-token', provider: 'gitlab' },
      ]);

      await act(async () => {
        result.rerender(
          <ThemeProvider theme={statusTheme}>
            <RepoAuthentication
              {...makeProps({
                onChange,
                formContext: { formData: { csvContent: newCsv } },
              })}
            />
          </ThemeProvider>,
        );
        await flushAsync();
      });

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(undefined);
      });

      await waitFor(() => {
        expect(mockAuthenticate).toHaveBeenCalledTimes(2);
      });
    });

    it('should not call setSecrets when authentication partially fails', async () => {
      let callCount = 0;
      mockAuthenticate.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve([{ token: 'gh-token', provider: 'github' }]);
        }
        return Promise.reject(new Error('GitLab auth failed'));
      });

      await renderComponent({
        formContext: {
          formData: { csvContent: MIXED_CSV },
        },
      });

      await waitFor(() => {
        expect(mockAuthenticate).toHaveBeenCalledTimes(2);
      });

      await waitFor(() => {
        expect(screen.getByText('GitLab auth failed')).toBeInTheDocument();
      });

      expect(mockSetSecrets).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should show error and per-row Retry button when auth fails', async () => {
      mockAuthenticate.mockRejectedValue(new Error('OAuth dialog cancelled'));

      await renderComponent({
        formContext: {
          formData: { csvContent: VALID_CSV },
        },
      });

      await waitFor(() => {
        expect(screen.getByText('OAuth dialog cancelled')).toBeInTheDocument();
      });

      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('should call onChange with undefined when auth fails', async () => {
      mockAuthenticate.mockRejectedValue(new Error('Auth failed'));

      const onChange = jest.fn();
      await renderComponent({
        onChange,
        formContext: {
          formData: { csvContent: VALID_CSV },
        },
      });

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(undefined);
      });
    });

    it('should retry authentication for a single provider when Retry is clicked', async () => {
      mockAuthenticate.mockRejectedValueOnce(new Error('First failure'));

      await renderComponent({
        formContext: {
          formData: { csvContent: VALID_CSV },
        },
      });

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      mockAuthenticate.mockResolvedValue([
        { token: 'retry-token', provider: 'github' },
      ]);

      await act(async () => {
        await userEvent.click(screen.getByText('Retry'));
        await flushAsync();
      });

      await waitFor(() => {
        expect(mockAuthenticate).toHaveBeenCalledTimes(2);
      });
    });

    it('should call onChange and setSecrets after a successful retry completes all providers', async () => {
      mockAuthenticate.mockRejectedValueOnce(
        new Error('OAuth dialog cancelled'),
      );

      const onChange = jest.fn();
      await renderComponent({
        onChange,
        formContext: {
          formData: { csvContent: VALID_CSV },
        },
      });

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      expect(onChange).toHaveBeenCalledWith(undefined);
      expect(mockSetSecrets).not.toHaveBeenCalled();

      mockAuthenticate.mockResolvedValue([
        { token: 'retry-token', provider: 'github' },
      ]);

      await act(async () => {
        await userEvent.click(screen.getByText('Retry'));
        await flushAsync();
      });

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith('authenticated');
      });

      await waitFor(() => {
        expect(mockSetSecrets).toHaveBeenCalledWith(
          expect.objectContaining({
            OAUTH_TOKEN_github: 'retry-token',
          }),
        );
      });
    });

    it('should complete authentication after retrying only the failed provider in a mixed scenario', async () => {
      let callCount = 0;
      mockAuthenticate.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve([{ token: 'gh-token', provider: 'github' }]);
        }
        return Promise.reject(new Error('GitLab auth failed'));
      });

      const onChange = jest.fn();
      await renderComponent({
        onChange,
        formContext: {
          formData: { csvContent: MIXED_CSV },
        },
      });

      await waitFor(() => {
        expect(screen.getByText('GitLab auth failed')).toBeInTheDocument();
      });

      expect(onChange).toHaveBeenCalledWith(undefined);
      expect(mockSetSecrets).not.toHaveBeenCalled();

      mockAuthenticate.mockResolvedValue([
        { token: 'gl-retry-token', provider: 'gitlab' },
      ]);

      await act(async () => {
        await userEvent.click(screen.getByText('Retry'));
        await flushAsync();
      });

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith('authenticated');
      });

      await waitFor(() => {
        expect(mockSetSecrets).toHaveBeenCalledWith(
          expect.objectContaining({
            OAUTH_TOKEN_github: 'gh-token',
            OAUTH_TOKEN_gitlab: 'gl-retry-token',
          }),
        );
      });
    });

    it('should clear error message when retry starts', async () => {
      mockAuthenticate.mockRejectedValueOnce(new Error('Auth error'));

      await renderComponent({
        formContext: {
          formData: { csvContent: VALID_CSV },
        },
      });

      await waitFor(() => {
        expect(screen.getByText('Auth error')).toBeInTheDocument();
      });

      mockAuthenticate.mockImplementation(
        () => new Promise(() => {}), // never resolves
      );

      await act(async () => {
        await userEvent.click(screen.getByText('Retry'));
        await flushAsync();
      });

      await waitFor(() => {
        expect(screen.queryByText('Auth error')).not.toBeInTheDocument();
      });
    });

    it('should keep Retry available when retry fails again', async () => {
      mockAuthenticate
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'));

      await renderComponent({
        formContext: {
          formData: { csvContent: VALID_CSV },
        },
      });

      await waitFor(() => {
        expect(screen.getByText('First failure')).toBeInTheDocument();
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      await act(async () => {
        await userEvent.click(screen.getByText('Retry'));
        await flushAsync();
      });

      await waitFor(() => {
        expect(screen.getByText('Second failure')).toBeInTheDocument();
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      mockAuthenticate.mockResolvedValue([
        { token: 'third-token', provider: 'github' },
      ]);

      await act(async () => {
        await userEvent.click(screen.getByText('Retry'));
        await flushAsync();
      });

      await waitFor(() => {
        expect(mockSetSecrets).toHaveBeenCalledWith(
          expect.objectContaining({
            OAUTH_TOKEN_github: 'third-token',
          }),
        );
      });
    });

    it('should complete both providers when retried concurrently', async () => {
      mockAuthenticate.mockRejectedValue(new Error('Auth failed'));

      const onChange = jest.fn();
      let container!: HTMLElement;
      await act(async () => {
        const result = render(
          <ThemeProvider theme={statusTheme}>
            <RepoAuthentication
              {...makeProps({
                onChange,
                formContext: { formData: { csvContent: MIXED_CSV } },
              })}
            />
          </ThemeProvider>,
        );
        container = result.container;
        await flushAsync();
      });

      await waitFor(() => {
        expect(screen.getAllByText('Retry')).toHaveLength(2);
      });

      let resolveGithub!: (value: unknown) => void;
      let resolveGitlab!: (value: unknown) => void;

      mockAuthenticate
        .mockImplementationOnce(
          () =>
            new Promise(r => {
              resolveGithub = r;
            }),
        )
        .mockImplementationOnce(
          () =>
            new Promise(r => {
              resolveGitlab = r;
            }),
        );

      const rows = container.querySelectorAll('tbody tr');
      const githubRetry = within(rows[0] as HTMLElement).getByText('Retry');

      await act(async () => {
        await userEvent.click(githubRetry);
        await flushAsync();
      });

      // github is now pending; only gitlab's Retry remains
      await act(async () => {
        await userEvent.click(screen.getByText('Retry'));
        await flushAsync();
      });

      // Both auths are in-flight — resolve them concurrently
      await act(async () => {
        resolveGithub([{ token: 'gh-retry-token', provider: 'github' }]);
        resolveGitlab([{ token: 'gl-retry-token', provider: 'gitlab' }]);
        await flushAsync();
      });

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith('authenticated');
      });

      await waitFor(() => {
        expect(mockSetSecrets).toHaveBeenCalledWith(
          expect.objectContaining({
            OAUTH_TOKEN_github: 'gh-retry-token',
            OAUTH_TOKEN_gitlab: 'gl-retry-token',
          }),
        );
      });
    });

    it('should show Retry only for error rows, not for authenticated or pending', async () => {
      let callCount = 0;
      mockAuthenticate.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve([{ token: 'gh-token', provider: 'github' }]);
        }
        return Promise.reject(new Error('GitLab auth failed'));
      });

      const { container } = await renderComponent({
        formContext: {
          formData: { csvContent: MIXED_CSV },
        },
      });

      await waitFor(() => {
        expect(screen.getByText('GitLab auth failed')).toBeInTheDocument();
      });

      const rows = container.querySelectorAll('tbody tr');
      expect(rows).toHaveLength(2);

      const githubRow = rows[0] as HTMLElement;
      const gitlabRow = rows[1] as HTMLElement;

      expect(within(githubRow).queryByText('Retry')).not.toBeInTheDocument();
      expect(within(gitlabRow).getByText('Retry')).toBeInTheDocument();
    });

    it('should display per-provider error messages inline in each row', async () => {
      mockAuthenticate.mockImplementation(descriptors => {
        const provider = descriptors[0]?.provider ?? 'unknown';
        return Promise.reject(new Error(`${provider} auth failed`));
      });

      const { container } = await renderComponent({
        formContext: {
          formData: { csvContent: MIXED_CSV },
        },
      });

      await waitFor(() => {
        expect(mockAuthenticate).toHaveBeenCalledTimes(2);
      });

      const rows = container.querySelectorAll('tbody tr');
      expect(rows).toHaveLength(2);

      const githubRow = rows[0] as HTMLElement;
      const gitlabRow = rows[1] as HTMLElement;

      expect(
        within(githubRow).getByText('github auth failed'),
      ).toBeInTheDocument();
      expect(
        within(gitlabRow).getByText('gitlab auth failed'),
      ).toBeInTheDocument();
    });

    it('should retain other provider errors when retrying one provider', async () => {
      mockAuthenticate.mockImplementation(descriptors => {
        const provider = descriptors[0]?.provider ?? 'unknown';
        return Promise.reject(new Error(`${provider} auth failed`));
      });

      const { container } = await renderComponent({
        formContext: {
          formData: { csvContent: MIXED_CSV },
        },
      });

      await waitFor(() => {
        expect(screen.getByText('github auth failed')).toBeInTheDocument();
        expect(screen.getByText('gitlab auth failed')).toBeInTheDocument();
      });

      mockAuthenticate.mockImplementation(
        () => new Promise(() => {}), // never resolves
      );

      const rows = container.querySelectorAll('tbody tr');
      const githubRetry = within(rows[0] as HTMLElement).getByText('Retry');

      await act(async () => {
        await userEvent.click(githubRetry);
        await flushAsync();
      });

      // github error cleared, gitlab error remains
      await waitFor(() => {
        expect(
          screen.queryByText('github auth failed'),
        ).not.toBeInTheDocument();
      });
      expect(screen.getByText('gitlab auth failed')).toBeInTheDocument();
    });
  });

  describe('provider table', () => {
    it('should render a table with provider name, access, and scope for a single provider', async () => {
      await renderComponent({
        formContext: {
          formData: { csvContent: VALID_CSV },
        },
      });

      await waitFor(() => {
        expect(screen.getByText('github')).toBeInTheDocument();
      });

      expect(screen.getByText('Read / Write')).toBeInTheDocument();
      expect(screen.getByText('repo')).toBeInTheDocument();
    });

    it('should render rows for multiple distinct providers', async () => {
      mockAuthenticate.mockImplementation(descriptors => {
        const provider = descriptors[0]?.provider ?? 'unknown';
        return Promise.resolve([{ token: `token-for-${provider}`, provider }]);
      });

      await renderComponent({
        formContext: {
          formData: { csvContent: MIXED_CSV },
        },
      });

      await waitFor(() => {
        expect(screen.getByText('github')).toBeInTheDocument();
        expect(screen.getByText('gitlab')).toBeInTheDocument();
      });

      const rows = screen.getAllByRole('row');
      // header + 2 provider rows
      expect(rows).toHaveLength(3);
    });

    it('should show Read-only access for source-only providers', async () => {
      mockAuthenticate.mockImplementation(descriptors => {
        const provider = descriptors[0]?.provider ?? 'unknown';
        return Promise.resolve([{ token: `token-for-${provider}`, provider }]);
      });

      await renderComponent({
        formContext: {
          formData: { csvContent: CROSS_PROVIDER_CSV },
        },
      });

      await waitFor(() => {
        expect(screen.getByText('gitlab')).toBeInTheDocument();
        expect(screen.getByText('github')).toBeInTheDocument();
      });

      // gitlab is target → Read / Write; github is source-only → Read-only
      expect(screen.getByText('Read / Write')).toBeInTheDocument();
      expect(screen.getByText('Read-only')).toBeInTheDocument();

      // gitlab target scope is write_repository; github source scope is repo
      expect(screen.getByText('write_repository')).toBeInTheDocument();
      expect(screen.getByText('repo')).toBeInTheDocument();
    });

    it('should not render the table when no CSV content is provided', async () => {
      await renderComponent({
        formContext: { formData: {} },
      });

      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('should show correct OAuth scope per provider and access level', async () => {
      await renderComponent({
        formContext: {
          formData: { csvContent: VALID_CSV },
        },
      });

      await waitFor(() => {
        // github target scope is "repo"
        expect(screen.getByText('repo')).toBeInTheDocument();
      });
    });
  });

  describe('provider status tracking', () => {
    it('should show authenticated status after successful auth', async () => {
      const { container } = await renderComponent({
        formContext: {
          formData: { csvContent: VALID_CSV },
        },
      });

      await waitFor(() => {
        expect(mockSetSecrets).toHaveBeenCalled();
      });

      const rows = container.querySelectorAll('tbody tr');
      expect(rows).toHaveLength(1);
      const statusCell = within(rows[0] as HTMLElement).getAllByRole('cell')[3];
      // StatusOK renders with the status--ok class
      expect(statusCell.querySelector('[class*="status"]')).toBeInTheDocument();
    });

    it('should show error status when authentication fails', async () => {
      mockAuthenticate.mockRejectedValue(new Error('Auth failed'));

      const { container } = await renderComponent({
        formContext: {
          formData: { csvContent: VALID_CSV },
        },
      });

      await waitFor(() => {
        expect(screen.getByText('Auth failed')).toBeInTheDocument();
      });

      const rows = container.querySelectorAll('tbody tr');
      expect(rows).toHaveLength(1);
      const statusCell = within(rows[0] as HTMLElement).getAllByRole('cell')[3];
      expect(statusCell.querySelector('[class*="status"]')).toBeInTheDocument();
    });

    it('should show mixed statuses when one provider succeeds and another fails', async () => {
      let callCount = 0;
      mockAuthenticate.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve([{ token: 'gh-token', provider: 'github' }]);
        }
        return Promise.reject(new Error('GitLab auth failed'));
      });

      const { container } = await renderComponent({
        formContext: {
          formData: { csvContent: MIXED_CSV },
        },
      });

      await waitFor(() => {
        expect(mockAuthenticate).toHaveBeenCalledTimes(2);
      });

      await waitFor(() => {
        expect(screen.getByText('GitLab auth failed')).toBeInTheDocument();
      });

      const rows = container.querySelectorAll('tbody tr');
      expect(rows).toHaveLength(2);
    });

    it('should reset provider statuses when CSV content changes', async () => {
      const onChange = jest.fn();
      const props = makeProps({
        onChange,
        formContext: { formData: { csvContent: VALID_CSV } },
      });

      let result!: ReturnType<typeof render>;
      await act(async () => {
        result = render(
          <ThemeProvider theme={statusTheme}>
            <RepoAuthentication {...props} />
          </ThemeProvider>,
        );
        await flushAsync();
      });

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith('authenticated');
      });

      // Table has 1 provider row with authenticated status
      expect(screen.getByText('github')).toBeInTheDocument();

      const newCsv = toDataUrl(
        'name,abbreviation,sourceRepoUrl,sourceRepoBranch,targetRepoBranch\n' +
          'New Project,NP,https://gitlab.com/org/new-repo,main,main',
      );

      mockAuthenticate.mockResolvedValue([
        { token: 'new-token', provider: 'gitlab' },
      ]);

      await act(async () => {
        result.rerender(
          <ThemeProvider theme={statusTheme}>
            <RepoAuthentication
              {...makeProps({
                onChange,
                formContext: { formData: { csvContent: newCsv } },
              })}
            />
          </ThemeProvider>,
        );
        await flushAsync();
      });

      // After CSV change, onChange is called with undefined (reset)
      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(undefined);
      });

      // New provider appears in the table
      await waitFor(() => {
        expect(screen.getByText('gitlab')).toBeInTheDocument();
      });
    });
  });

  describe('concurrent auth failure resilience', () => {
    it('should not strand providers as pending when one fails while another is in-flight', async () => {
      let resolveGithub!: (value: unknown) => void;

      mockAuthenticate.mockImplementation(descriptors => {
        const provider = descriptors[0]?.provider ?? 'unknown';
        if (provider === 'github') {
          return new Promise(r => {
            resolveGithub = r;
          });
        }
        return Promise.reject(new Error('GitLab auth failed'));
      });

      const onChange = jest.fn();
      await renderComponent({
        onChange,
        formContext: {
          formData: { csvContent: MIXED_CSV },
        },
      });

      // GitLab fails immediately; GitHub is still in-flight
      await waitFor(() => {
        expect(screen.getByText('GitLab auth failed')).toBeInTheDocument();
      });

      // Now resolve GitHub — it should NOT be stranded as pending
      await act(async () => {
        resolveGithub([{ token: 'gh-token', provider: 'github' }]);
        await flushAsync();
      });

      // GitHub should become authenticated, not stuck at pending
      const { container } = {
        container: screen.getByRole('table').closest('div')!.parentElement!,
      };
      const rows = container.querySelectorAll('tbody tr');
      const githubRow = rows[0] as HTMLElement;

      await waitFor(() => {
        expect(within(githubRow).queryByText('Retry')).not.toBeInTheDocument();
      });

      // GitLab should have a Retry button
      const gitlabRow = rows[1] as HTMLElement;
      expect(within(gitlabRow).getByText('Retry')).toBeInTheDocument();

      // Retry GitLab to complete everything
      mockAuthenticate.mockResolvedValue([
        { token: 'gl-token', provider: 'gitlab' },
      ]);
      await act(async () => {
        await userEvent.click(within(gitlabRow).getByText('Retry'));
        await flushAsync();
      });

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith('authenticated');
      });
    });
  });

  describe('retry staleness', () => {
    it('should discard retry results when CSV changes during a retry', async () => {
      mockAuthenticate.mockRejectedValueOnce(new Error('First failure'));

      const onChange = jest.fn();
      const props = makeProps({
        onChange,
        formContext: { formData: { csvContent: VALID_CSV } },
      });

      let result!: ReturnType<typeof render>;
      await act(async () => {
        result = render(
          <ThemeProvider theme={statusTheme}>
            <RepoAuthentication {...props} />
          </ThemeProvider>,
        );
        await flushAsync();
      });

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      // Start a retry that will hang (never resolve yet)
      let resolveRetry!: (value: unknown) => void;
      mockAuthenticate.mockImplementation(
        () =>
          new Promise(r => {
            resolveRetry = r;
          }),
      );

      await act(async () => {
        await userEvent.click(screen.getByText('Retry'));
        await flushAsync();
      });

      // Now change CSV before the retry resolves
      const newCsv = toDataUrl(
        'name,abbreviation,sourceRepoUrl,sourceRepoBranch,targetRepoBranch\n' +
          'New Project,NP,https://gitlab.com/org/new-repo,main,main',
      );

      mockAuthenticate.mockResolvedValue([
        { token: 'new-token', provider: 'gitlab' },
      ]);

      await act(async () => {
        result.rerender(
          <ThemeProvider theme={statusTheme}>
            <RepoAuthentication
              {...makeProps({
                onChange,
                formContext: { formData: { csvContent: newCsv } },
              })}
            />
          </ThemeProvider>,
        );
        await flushAsync();
      });

      // Resolve the stale retry — it should be discarded
      await act(async () => {
        resolveRetry([{ token: 'stale-token', provider: 'github' }]);
        await flushAsync();
      });

      // The new CSV's provider (gitlab) should be authenticated, not github
      await waitFor(() => {
        expect(mockSetSecrets).toHaveBeenCalledWith(
          expect.objectContaining({
            OAUTH_TOKEN_gitlab: 'new-token',
          }),
        );
      });

      // The stale github token should NOT be in secrets
      expect(mockSetSecrets).not.toHaveBeenCalledWith(
        expect.objectContaining({
          OAUTH_TOKEN_github: 'stale-token',
        }),
      );
    });
  });

  describe('unmount safety', () => {
    it('should not update state after unmount', async () => {
      let resolveAuth!: (value: unknown) => void;
      mockAuthenticate.mockImplementation(
        () =>
          new Promise(r => {
            resolveAuth = r;
          }),
      );

      const onChange = jest.fn();
      const { unmount } = await renderComponent({
        onChange,
        formContext: {
          formData: { csvContent: VALID_CSV },
        },
      });

      // Auth is in-flight, unmount the component
      unmount();

      // Resolve auth after unmount — should not throw or warn
      await act(async () => {
        resolveAuth([{ token: 'post-unmount-token', provider: 'github' }]);
        await flushAsync();
      });

      // onChange should never have been called with 'authenticated'
      expect(onChange).not.toHaveBeenCalledWith('authenticated');
      expect(mockSetSecrets).not.toHaveBeenCalled();
    });
  });

  describe('csvFieldName', () => {
    it('should read CSV from the field specified by csvFieldName', async () => {
      await renderComponent({
        uiSchema: { 'ui:options': { csvFieldName: 'myCustomCsv' } },
        formContext: {
          formData: { myCustomCsv: VALID_CSV },
        },
      });

      await waitFor(() => {
        expect(mockAuthenticate).toHaveBeenCalled();
      });
    });

    it('should not attempt auth when csvFieldName points to empty field', async () => {
      await renderComponent({
        uiSchema: { 'ui:options': { csvFieldName: 'myCustomCsv' } },
        formContext: {
          formData: { csvContent: VALID_CSV },
        },
      });

      expect(mockAuthenticate).not.toHaveBeenCalled();
    });
  });

  describe('non-Error exception handling', () => {
    it('should display "Unknown error" when auto-auth throws a non-Error value', async () => {
      mockAuthenticate.mockRejectedValue('string-error');

      await renderComponent({
        formContext: {
          formData: { csvContent: VALID_CSV },
        },
      });

      await waitFor(() => {
        expect(screen.getByText('Unknown error')).toBeInTheDocument();
      });
    });

    it('should display "Unknown error" when retry throws a non-Error value', async () => {
      mockAuthenticate.mockRejectedValueOnce(new Error('Initial failure'));

      await renderComponent({
        formContext: {
          formData: { csvContent: VALID_CSV },
        },
      });

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      mockAuthenticate.mockRejectedValue(42);

      await act(async () => {
        await userEvent.click(screen.getByText('Retry'));
        await flushAsync();
      });

      await waitFor(() => {
        expect(screen.getByText('Unknown error')).toBeInTheDocument();
      });
    });
  });

  describe('CSV lifecycle edge cases', () => {
    it('should reset state and show "CSV content is required" when CSV is cleared', async () => {
      const onChange = jest.fn();
      const props = makeProps({
        onChange,
        formContext: { formData: { csvContent: VALID_CSV } },
      });

      let result!: ReturnType<typeof render>;
      await act(async () => {
        result = render(
          <ThemeProvider theme={statusTheme}>
            <RepoAuthentication {...props} />
          </ThemeProvider>,
        );
        await flushAsync();
      });

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith('authenticated');
      });
      expect(screen.getByRole('table')).toBeInTheDocument();

      // Clear the CSV
      await act(async () => {
        result.rerender(
          <ThemeProvider theme={statusTheme}>
            <RepoAuthentication
              {...makeProps({
                onChange,
                formContext: { formData: {} },
              })}
            />
          </ThemeProvider>,
        );
        await flushAsync();
      });

      expect(onChange).toHaveBeenCalledWith(undefined);
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
      expect(
        screen.getByText(
          'CSV content is required for RepoAuthentication extension',
        ),
      ).toBeInTheDocument();
    });

    it('should re-authenticate from scratch when CSV is cleared then restored', async () => {
      const onChange = jest.fn();
      const props = makeProps({
        onChange,
        formContext: { formData: { csvContent: VALID_CSV } },
      });

      let result!: ReturnType<typeof render>;
      await act(async () => {
        result = render(
          <ThemeProvider theme={statusTheme}>
            <RepoAuthentication {...props} />
          </ThemeProvider>,
        );
        await flushAsync();
      });

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith('authenticated');
      });
      expect(mockAuthenticate).toHaveBeenCalledTimes(1);

      // Clear CSV
      await act(async () => {
        result.rerender(
          <ThemeProvider theme={statusTheme}>
            <RepoAuthentication
              {...makeProps({ onChange, formContext: { formData: {} } })}
            />
          </ThemeProvider>,
        );
        await flushAsync();
      });

      mockAuthenticate.mockResolvedValue([
        { token: 'restored-token', provider: 'github' },
      ]);

      // Restore the same CSV
      await act(async () => {
        result.rerender(
          <ThemeProvider theme={statusTheme}>
            <RepoAuthentication
              {...makeProps({
                onChange,
                formContext: { formData: { csvContent: VALID_CSV } },
              })}
            />
          </ThemeProvider>,
        );
        await flushAsync();
      });

      await waitFor(() => {
        expect(mockAuthenticate).toHaveBeenCalledTimes(2);
      });

      await waitFor(() => {
        expect(mockSetSecrets).toHaveBeenLastCalledWith(
          expect.objectContaining({
            OAUTH_TOKEN_github: 'restored-token',
          }),
        );
      });
    });

    it('should cancel in-flight auto-auth when CSV changes mid-authentication', async () => {
      let resolveFirstAuth!: (value: unknown) => void;
      mockAuthenticate.mockImplementation(
        () =>
          new Promise(r => {
            resolveFirstAuth = r;
          }),
      );

      const onChange = jest.fn();
      const props = makeProps({
        onChange,
        formContext: { formData: { csvContent: VALID_CSV } },
      });

      let result!: ReturnType<typeof render>;
      await act(async () => {
        result = render(
          <ThemeProvider theme={statusTheme}>
            <RepoAuthentication {...props} />
          </ThemeProvider>,
        );
        await flushAsync();
      });

      // Auth is in-flight for first CSV. Change CSV now.
      const newCsv = toDataUrl(
        'name,abbreviation,sourceRepoUrl,sourceRepoBranch,targetRepoBranch\n' +
          'New Project,NP,https://gitlab.com/org/new-repo,main,main',
      );

      mockAuthenticate.mockResolvedValue([
        { token: 'new-csv-token', provider: 'gitlab' },
      ]);

      await act(async () => {
        result.rerender(
          <ThemeProvider theme={statusTheme}>
            <RepoAuthentication
              {...makeProps({
                onChange,
                formContext: { formData: { csvContent: newCsv } },
              })}
            />
          </ThemeProvider>,
        );
        await flushAsync();
      });

      // Resolve the stale first auth — it should be discarded
      await act(async () => {
        resolveFirstAuth([{ token: 'stale-token', provider: 'github' }]);
        await flushAsync();
      });

      // New CSV should authenticate successfully
      await waitFor(() => {
        expect(mockSetSecrets).toHaveBeenCalledWith(
          expect.objectContaining({
            OAUTH_TOKEN_gitlab: 'new-csv-token',
          }),
        );
      });

      // Stale token should not appear
      expect(mockSetSecrets).not.toHaveBeenCalledWith(
        expect.objectContaining({
          OAUTH_TOKEN_github: 'stale-token',
        }),
      );
    });

    it('should not reset when the same csvContent reference is re-rendered', async () => {
      const onChange = jest.fn();
      const csvData = { csvContent: VALID_CSV };
      const props = makeProps({
        onChange,
        formContext: { formData: csvData },
      });

      let result!: ReturnType<typeof render>;
      await act(async () => {
        result = render(
          <ThemeProvider theme={statusTheme}>
            <RepoAuthentication {...props} />
          </ThemeProvider>,
        );
        await flushAsync();
      });

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith('authenticated');
      });
      expect(mockAuthenticate).toHaveBeenCalledTimes(1);

      // Re-render with the same CSV content — should NOT re-auth
      onChange.mockClear();
      mockAuthenticate.mockClear();

      await act(async () => {
        result.rerender(
          <ThemeProvider theme={statusTheme}>
            <RepoAuthentication
              {...makeProps({
                onChange,
                formContext: { formData: csvData },
              })}
            />
          </ThemeProvider>,
        );
        await flushAsync();
      });

      expect(mockAuthenticate).not.toHaveBeenCalled();
      expect(onChange).not.toHaveBeenCalledWith(undefined);
    });

    it('should reset initialAuthFailed and re-auth after CSV changes following a failure', async () => {
      mockAuthenticate.mockRejectedValue(new Error('All fail'));

      const onChange = jest.fn();
      const props = makeProps({
        onChange,
        formContext: { formData: { csvContent: MIXED_CSV } },
      });

      let result!: ReturnType<typeof render>;
      await act(async () => {
        result = render(
          <ThemeProvider theme={statusTheme}>
            <RepoAuthentication {...props} />
          </ThemeProvider>,
        );
        await flushAsync();
      });

      await waitFor(() => {
        expect(screen.getAllByText('All fail')).toHaveLength(2);
      });

      // Now change CSV — should clear errors and re-authenticate
      mockAuthenticate.mockResolvedValue([
        { token: 'fresh-token', provider: 'github' },
      ]);

      await act(async () => {
        result.rerender(
          <ThemeProvider theme={statusTheme}>
            <RepoAuthentication
              {...makeProps({
                onChange,
                formContext: { formData: { csvContent: VALID_CSV } },
              })}
            />
          </ThemeProvider>,
        );
        await flushAsync();
      });

      await waitFor(() => {
        expect(mockSetSecrets).toHaveBeenCalledWith(
          expect.objectContaining({
            OAUTH_TOKEN_github: 'fresh-token',
          }),
        );
      });

      // No error messages should remain
      expect(screen.queryByText('All fail')).not.toBeInTheDocument();
    });
  });

  describe('completion effect edge cases', () => {
    it('should merge provider tokens with pre-existing secrets', async () => {
      const scaffolderMock = jest.requireMock(
        '@backstage/plugin-scaffolder-react',
      );
      const origUseTemplateSecrets = scaffolderMock.useTemplateSecrets;
      scaffolderMock.useTemplateSecrets = () => ({
        secrets: { EXISTING_SECRET: 'keep-me' },
        setSecrets: mockSetSecrets,
      });

      try {
        await renderComponent({
          formContext: {
            formData: { csvContent: VALID_CSV },
          },
        });

        await waitFor(() => {
          expect(mockSetSecrets).toHaveBeenCalledWith(
            expect.objectContaining({
              EXISTING_SECRET: 'keep-me',
              OAUTH_TOKEN_github: 'mock-augmented-token',
            }),
          );
        });
      } finally {
        scaffolderMock.useTemplateSecrets = origUseTemplateSecrets;
      }
    });

    it('should not call setSecrets twice when component re-renders after completion', async () => {
      const onChange = jest.fn();
      const props = makeProps({
        onChange,
        formContext: { formData: { csvContent: VALID_CSV } },
      });

      let result!: ReturnType<typeof render>;
      await act(async () => {
        result = render(
          <ThemeProvider theme={statusTheme}>
            <RepoAuthentication {...props} />
          </ThemeProvider>,
        );
        await flushAsync();
      });

      await waitFor(() => {
        expect(mockSetSecrets).toHaveBeenCalledTimes(1);
      });

      // Force a re-render with the same props (simulates parent re-render)
      await act(async () => {
        result.rerender(
          <ThemeProvider theme={statusTheme}>
            <RepoAuthentication
              {...makeProps({
                onChange,
                formContext: { formData: { csvContent: VALID_CSV } },
              })}
            />
          </ThemeProvider>,
        );
        await flushAsync();
      });

      // setSecrets should still be called exactly once
      expect(mockSetSecrets).toHaveBeenCalledTimes(1);
    });

    it('should not call onChange("authenticated") after isDone is set', async () => {
      const onChange = jest.fn();
      await renderComponent({
        onChange,
        formContext: {
          formData: { csvContent: VALID_CSV },
        },
      });

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith('authenticated');
      });

      const authenticatedCalls = onChange.mock.calls.filter(
        (args: unknown[]) => args[0] === 'authenticated',
      );
      expect(authenticatedCalls).toHaveLength(1);
    });
  });

  describe('provider deduplication', () => {
    it('should call authenticate once per distinct provider even with multiple CSV rows', async () => {
      const multiRowSameProvider = toDataUrl(
        'name,abbreviation,sourceRepoUrl,sourceRepoBranch,targetRepoBranch\n' +
          'Project A,PA,https://github.com/org/repo-a,main,main\n' +
          'Project B,PB,https://github.com/org/repo-b,main,main\n' +
          'Project C,PC,https://github.com/org/repo-c,main,main',
      );

      await renderComponent({
        formContext: {
          formData: { csvContent: multiRowSameProvider },
        },
      });

      await waitFor(() => {
        expect(mockAuthenticate).toHaveBeenCalledTimes(1);
      });

      await waitFor(() => {
        expect(mockSetSecrets).toHaveBeenCalled();
      });

      // Table should show only 1 provider row, not 3
      const rows = screen.getAllByRole('row');
      expect(rows).toHaveLength(2); // header + 1 provider
    });
  });

  describe('retry with deferred resolution', () => {
    it('should complete when a slow retry eventually resolves', async () => {
      mockAuthenticate.mockRejectedValueOnce(new Error('First failure'));

      await renderComponent({
        formContext: {
          formData: { csvContent: VALID_CSV },
        },
      });

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      let resolveRetry!: (value: unknown) => void;
      mockAuthenticate.mockImplementationOnce(
        () =>
          new Promise(r => {
            resolveRetry = r;
          }),
      );

      await act(async () => {
        await userEvent.click(screen.getByText('Retry'));
        await flushAsync();
      });

      // Provider is 'pending' — Retry button is hidden
      expect(screen.queryByText('Retry')).not.toBeInTheDocument();

      // Resolve the deferred retry
      await act(async () => {
        resolveRetry([{ token: 'deferred-token', provider: 'github' }]);
        await flushAsync();
      });

      await waitFor(() => {
        expect(mockSetSecrets).toHaveBeenCalledWith(
          expect.objectContaining({
            OAUTH_TOKEN_github: 'deferred-token',
          }),
        );
      });
    });
  });
});

describe('repoAuthenticationValidation', () => {
  it('should add error when data is undefined', () => {
    const field = { addError: jest.fn() } as any;
    repoAuthenticationValidation(
      undefined as unknown as string,
      field,
      validatorContext,
    );
    expect(field.addError).toHaveBeenCalledWith(
      'Authentication with all SCM providers is required before proceeding',
    );
  });

  it('should add error when data is empty string', () => {
    const field = { addError: jest.fn() } as any;
    repoAuthenticationValidation('', field, validatorContext);
    expect(field.addError).toHaveBeenCalledWith(
      'Authentication with all SCM providers is required before proceeding',
    );
  });

  it('should not add error when data is "authenticated"', () => {
    const field = { addError: jest.fn() } as any;
    repoAuthenticationValidation('authenticated', field, validatorContext);
    expect(field.addError).not.toHaveBeenCalled();
  });
});
