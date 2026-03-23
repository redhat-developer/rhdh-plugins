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

import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  RepoAuthentication,
  repoAuthenticationValidation,
} from './RepoAuthentication';
import type { FieldExtensionComponentProps } from '@backstage/plugin-scaffolder-react';
import { ApiHolder } from '@backstage/core-plugin-api';

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

const validatorContext = {
  apiHolder: { get: jest.fn() } as unknown as ApiHolder,
  formData: {},
  schema: {},
};

function renderComponent(
  overrides: Partial<FieldExtensionComponentProps<string>> = {},
) {
  const defaultProps = {
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

  return render(<RepoAuthentication {...defaultProps} />);
}

describe('RepoAuthentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthenticate.mockResolvedValue([
      { token: 'mock-augmented-token', provider: 'github' },
    ]);
  });

  describe('rendering', () => {
    it('should render title and description', () => {
      renderComponent();
      expect(screen.getByText('Repo Auth')).toBeInTheDocument();
      expect(
        screen.getByText('Authenticate with SCM providers'),
      ).toBeInTheDocument();
    });

    it('should show error when csvFieldName is not configured', () => {
      renderComponent({
        uiSchema: { 'ui:options': {} },
      });
      expect(
        screen.getByText(
          'CSV field name is required for RepoAuthentication extension',
        ),
      ).toBeInTheDocument();
    });

    it('should not show csvFieldName error when configured', () => {
      renderComponent();
      expect(
        screen.queryByText(
          'CSV field name is required for RepoAuthentication extension',
        ),
      ).not.toBeInTheDocument();
    });
  });

  describe('CSV parsing errors', () => {
    it('should show error for invalid CSV data-URL', async () => {
      renderComponent({
        formContext: {
          formData: { csvContent: 'not-a-data-url' },
        },
      });

      await waitFor(() => {
        expect(
          screen.getByText(/expected a base64-encoded data-URL/),
        ).toBeInTheDocument();
      });
    });

    it('should show error for CSV missing required columns', async () => {
      const invalidCsv = toDataUrl('name,abbreviation\nProject,PRJ');
      renderComponent({
        formContext: {
          formData: { csvContent: invalidCsv },
        },
      });

      await waitFor(() => {
        expect(
          screen.getByText(/CSV is missing required column/),
        ).toBeInTheDocument();
      });
    });
  });

  describe('authentication flow', () => {
    it('should call authenticate for providers found in CSV', async () => {
      renderComponent({
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
      renderComponent({
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
      renderComponent({
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

      renderComponent({
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

      renderComponent({
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

    it('should not call authenticate when csvContent is absent', () => {
      renderComponent({
        formContext: { formData: {} },
      });

      expect(mockAuthenticate).not.toHaveBeenCalled();
    });

    it('should re-authenticate when CSV content changes', async () => {
      const onChange = jest.fn();
      const { rerender } = render(
        <RepoAuthentication
          {...({
            onChange,
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
              formData: { csvContent: VALID_CSV },
            },
            formData: undefined,
            name: 'repoAuthentication',
            idSchema: { $id: 'root_repoAuthentication' },
            registry: {},
          } as unknown as FieldExtensionComponentProps<string>)}
        />,
      );

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

      rerender(
        <RepoAuthentication
          {...({
            onChange,
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
              formData: { csvContent: newCsv },
            },
            formData: undefined,
            name: 'repoAuthentication',
            idSchema: { $id: 'root_repoAuthentication' },
            registry: {},
          } as unknown as FieldExtensionComponentProps<string>)}
        />,
      );

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

      renderComponent({
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
    it('should show error and Try again button when auth fails', async () => {
      mockAuthenticate.mockRejectedValue(new Error('OAuth dialog cancelled'));

      renderComponent({
        formContext: {
          formData: { csvContent: VALID_CSV },
        },
      });

      await waitFor(() => {
        expect(screen.getByText('OAuth dialog cancelled')).toBeInTheDocument();
      });

      expect(screen.getByText('Try again')).toBeInTheDocument();
    });

    it('should call onChange with undefined when auth fails', async () => {
      mockAuthenticate.mockRejectedValue(new Error('Auth failed'));

      const onChange = jest.fn();
      renderComponent({
        onChange,
        formContext: {
          formData: { csvContent: VALID_CSV },
        },
      });

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(undefined);
      });
    });

    it('should retry authentication when Try again is clicked', async () => {
      mockAuthenticate.mockRejectedValueOnce(new Error('First failure'));

      renderComponent({
        formContext: {
          formData: { csvContent: VALID_CSV },
        },
      });

      await waitFor(() => {
        expect(screen.getByText('Try again')).toBeInTheDocument();
      });

      mockAuthenticate.mockResolvedValue([
        { token: 'retry-token', provider: 'github' },
      ]);

      await act(async () => {
        await userEvent.click(screen.getByText('Try again'));
      });

      await waitFor(() => {
        expect(mockAuthenticate).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('csvFieldName', () => {
    it('should read CSV from the field specified by csvFieldName', async () => {
      renderComponent({
        uiSchema: { 'ui:options': { csvFieldName: 'myCustomCsv' } },
        formContext: {
          formData: { myCustomCsv: VALID_CSV },
        },
      });

      await waitFor(() => {
        expect(mockAuthenticate).toHaveBeenCalled();
      });
    });

    it('should not attempt auth when csvFieldName points to empty field', () => {
      renderComponent({
        uiSchema: { 'ui:options': { csvFieldName: 'myCustomCsv' } },
        formContext: {
          formData: { csvContent: VALID_CSV },
        },
      });

      expect(mockAuthenticate).not.toHaveBeenCalled();
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
