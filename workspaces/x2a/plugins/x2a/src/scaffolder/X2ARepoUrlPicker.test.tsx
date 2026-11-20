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

const mockStockPicker = jest.fn();
// Flips the unwrap of the stock component off, to exercise the
// "upstream contract changed" branch. A hoisted function declaration, so the
// hoisted jest.mock factory can read it at import time without hitting the
// temporal dead zone, and it survives jest.resetModules().
function mockStockPickerState() {}
mockStockPickerState.hidden = false;

jest.mock('@backstage/plugin-scaffolder', () => {
  const { attachComponentData } = jest.requireActual(
    '@backstage/core-plugin-api',
  );
  const actual = jest.requireActual('@backstage/plugin-scaffolder');

  // Mimics the part of the stock picker that matters here: it asks
  // `scmAuthApi` for credentials for the selected host and stores the token.
  const StockPickerStub = (props: any) => {
    mockStockPicker(props);
    const React = jest.requireActual('react');
    const { useApi } = jest.requireActual('@backstage/core-plugin-api');
    const { scmAuthApiRef } = jest.requireActual(
      '@backstage/integration-react',
    );
    const { useTemplateSecrets } = jest.requireActual(
      '@backstage/plugin-scaffolder-react',
    );
    const scmAuthApi = useApi(scmAuthApiRef);
    const { setSecrets } = useTemplateSecrets();
    const host = props.formData?.split('?')[0];
    const secretsKey =
      props.uiSchema?.['ui:options']?.requestUserCredentials?.secretsKey;
    React.useEffect(() => {
      if (!host || !secretsKey) return;
      scmAuthApi
        .getCredentials({ url: `https://${host}` })
        .then((c: { token: string }) => setSecrets({ [secretsKey]: c.token }));
    }, [host, secretsKey, props.uiSchema]); // eslint-disable-line react-hooks/exhaustive-deps
    return null;
  };

  const FieldExtensionDataHolder = () => null;
  attachComponentData(
    FieldExtensionDataHolder,
    'scaffolder.extensions.field.v1',
    {
      get component() {
        return mockStockPickerState.hidden ? undefined : StockPickerStub;
      },
      name: 'RepoUrlPicker',
    },
  );

  return {
    ...actual,
    RepoUrlPickerFieldExtension: FieldExtensionDataHolder,
  };
});

const mockHostMap = jest.fn();
jest.mock('../hooks/useScmHostMap', () => ({
  useScmHostMap: () => mockHostMap(),
}));

jest.mock('../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) =>
      params ? `${key}:${JSON.stringify(params)}` : key,
  }),
}));

const mockGetRawToken = jest.fn();
jest.mock('../repoAuth', () => ({
  AuthHostNotAllowedError:
    jest.requireActual('../repoAuth').AuthHostNotAllowedError,
  providerLabels: jest.requireActual('../repoAuth').providerLabels,
  useRepoAuthentication: () => ({
    getRawToken: mockGetRawToken,
    authenticate: jest.fn(),
  }),
}));

import { screen, waitFor } from '@testing-library/react';
import { renderInTestApp, TestApiProvider } from '@backstage/test-utils';
import { ConfigReader } from '@backstage/config';
import {
  ScmIntegrationsApi,
  scmIntegrationsApiRef,
} from '@backstage/integration-react';
import userEvent from '@testing-library/user-event';
import { configApiRef, getComponentData } from '@backstage/core-plugin-api';
import {
  SecretsContextProvider,
  useTemplateSecrets,
  type FieldExtensionComponentProps,
} from '@backstage/plugin-scaffolder-react';

import {
  X2ARepoUrlPicker,
  resetStockRepoUrlPickerForTests,
  x2aRepoUrlPickerValidation,
  type X2ARepoUrlPickerUiOptions,
} from './X2ARepoUrlPicker';

const scmIntegrationsApi = ScmIntegrationsApi.fromConfig(
  new ConfigReader({
    integrations: {
      github: [{ host: 'github.com' }],
      gitlab: [
        {
          host: 'gitlab.corp.example.com',
          apiBaseUrl: 'https://gitlab.corp.example.com/api/v4',
        },
      ],
    },
  }),
);

// Value of `x2a.scm.authHosts`; reset in beforeEach.
let authHosts: Record<string, string> | undefined;

const WithApis = ({
  children,
  integrations = scmIntegrationsApi,
}: {
  children: React.ReactNode;
  integrations?: ScmIntegrationsApi;
}) => (
  <TestApiProvider
    apis={[
      [scmIntegrationsApiRef, integrations],
      [
        configApiRef,
        new ConfigReader(authHosts ? { x2a: { scm: { authHosts } } } : {}),
      ],
    ]}
  >
    {children}
  </TestApiProvider>
);

type Props = FieldExtensionComponentProps<string, X2ARepoUrlPickerUiOptions>;

/** Renders the live value of a scaffolder secret so tests can assert on it. */
const SecretProbe = ({ name }: { name: string }) => {
  const { secrets } = useTemplateSecrets();
  return <div data-testid={`secret-${name}`}>{secrets[name] ?? ''}</div>;
};

async function renderPicker(
  uiSchema: Props['uiSchema'] = {},
  extra: Partial<Props> = {},
  integrations?: ScmIntegrationsApi,
) {
  const props = {
    uiSchema,
    onChange: jest.fn(),
    schema: {},
    formData: undefined,
    rawErrors: [],
    ...extra,
  } as unknown as Props;
  return await renderInTestApp(
    <WithApis integrations={integrations}>
      <SecretsContextProvider>
        <X2ARepoUrlPicker {...props} />
        <SecretProbe name="SRC_USER_OAUTH_TOKEN" />
      </SecretsContextProvider>
    </WithApis>,
  );
}

const srcSecret = () =>
  screen.getByTestId('secret-SRC_USER_OAUTH_TOKEN').textContent;

function propsPassedToStockPicker() {
  return mockStockPicker.mock.calls[0][0];
}

function allowedHostsPassedToStockPicker(): string[] | undefined {
  return propsPassedToStockPicker().uiSchema?.['ui:options']?.allowedHosts;
}

const credentialsUiSchema = (
  extra: Record<string, unknown> = {},
): Props['uiSchema'] =>
  ({
    'ui:options': {
      requestUserCredentials: {
        secretsKey: 'SRC_USER_OAUTH_TOKEN',
        ...extra,
      },
    },
  }) as Props['uiSchema'];

describe('X2ARepoUrlPicker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStockPickerState.hidden = false;
    authHosts = { github: 'github.com', gitlab: 'gitlab.corp.example.com' };
    mockHostMap.mockReturnValue(
      new Map([
        ['github.com', 'github'],
        ['gitlab.corp.example.com', 'gitlab'],
      ]),
    );
    mockGetRawToken.mockResolvedValue('t0ken');
  });

  describe('allowedHosts', () => {
    it('passes configured GitHub/GitLab hosts, then bitbucket.org, as allowedHosts', async () => {
      await renderPicker();

      expect(mockStockPicker).toHaveBeenCalled();
      expect(allowedHostsPassedToStockPicker()).toEqual([
        'github.com',
        'gitlab.corp.example.com',
        'bitbucket.org',
      ]);
    });

    it('keeps other ui:options untouched', async () => {
      await renderPicker({
        'ui:options': { allowedOwners: ['my-org'] },
      } as Props['uiSchema']);

      expect(
        propsPassedToStockPicker().uiSchema['ui:options'].allowedOwners,
      ).toEqual(['my-org']);
    });

    it('lets an explicit allowedHosts from the template win', async () => {
      await renderPicker({
        'ui:options': { allowedHosts: ['gitlab.com'] },
      } as Props['uiSchema']);

      expect(allowedHostsPassedToStockPicker()).toEqual(['gitlab.com']);
    });
  });

  describe('hosts offered when credentials are requested', () => {
    const twoGitlabs = ScmIntegrationsApi.fromConfig(
      new ConfigReader({
        integrations: {
          github: [{ host: 'github.com' }],
          gitlab: [
            { host: 'gitlab.com' },
            {
              host: 'gitlab.corp.example.com',
              apiBaseUrl: 'https://gitlab.corp.example.com/api/v4',
            },
          ],
        },
      }),
    );

    beforeEach(() =>
      mockHostMap.mockReturnValue(
        new Map([
          ['github.com', 'github'],
          ['gitlab.com', 'gitlab'],
          ['gitlab.corp.example.com', 'gitlab'],
        ]),
      ),
    );

    it('offers only the host each OAuth provider is registered against', async () => {
      await renderPicker(credentialsUiSchema(), {}, twoGitlabs);

      expect(allowedHostsPassedToStockPicker()).toEqual([
        'github.com',
        'gitlab.corp.example.com',
        'bitbucket.org',
      ]);
    });

    it('offers no GitHub or GitLab host when x2a.scm.authHosts is unset', async () => {
      authHosts = undefined;
      await renderPicker(credentialsUiSchema(), {}, twoGitlabs);

      expect(allowedHostsPassedToStockPicker()).toEqual(['bitbucket.org']);
      // One notice per provider type whose hosts were left out.
      expect(
        screen.getAllByText(/^scaffolder\.repoUrlPicker\.hostsHiddenUnset/),
      ).toHaveLength(2);
    });

    it('says when the auth host is not among the integrations', async () => {
      authHosts = { github: 'github.com', gitlab: 'gitlab.elsewhere.example' };
      await renderPicker(credentialsUiSchema(), {}, twoGitlabs);

      expect(allowedHostsPassedToStockPicker()).toEqual([
        'github.com',
        'bitbucket.org',
      ]);
      expect(
        screen.getByText(/^scaffolder\.repoUrlPicker\.hostsHiddenNotListed/),
      ).toHaveTextContent('"authHost":"gitlab.elsewhere.example"');
      expect(screen.queryByText(/hostsHiddenOther/)).not.toBeInTheDocument();
    });

    it('matches hosts case-insensitively', async () => {
      authHosts = { gitlab: 'GitLab.Corp.Example.com' };
      await renderPicker(credentialsUiSchema(), {}, twoGitlabs);

      expect(allowedHostsPassedToStockPicker()).toContain(
        'gitlab.corp.example.com',
      );
    });

    it('offers every integration host when no credentials are requested', async () => {
      await renderPicker({}, {}, twoGitlabs);

      expect(allowedHostsPassedToStockPicker()).toEqual([
        'github.com',
        'gitlab.com',
        'gitlab.corp.example.com',
        'bitbucket.org',
      ]);
      expect(screen.queryByText(/hostsHidden/)).not.toBeInTheDocument();
    });
  });

  describe('credentials', () => {
    it('forwards requestUserCredentials to the stock picker', async () => {
      await renderPicker(credentialsUiSchema());

      expect(
        propsPassedToStockPicker().uiSchema['ui:options']
          .requestUserCredentials,
      ).toEqual({ secretsKey: 'SRC_USER_OAUTH_TOKEN' });
    });

    it('requests no token before a host has been selected', async () => {
      await renderPicker(credentialsUiSchema());

      expect(mockGetRawToken).not.toHaveBeenCalled();
      expect(srcSecret()).toBe('');
    });

    it('stores a raw token for the selected self-hosted host', async () => {
      await renderPicker(credentialsUiSchema(), {
        formData: 'gitlab.corp.example.com?owner=me&repo=thing',
      });

      // Raw, not augmented: createProjectAction adds the "oauth2:" prefix.
      await waitFor(() => expect(srcSecret()).toBe('t0ken'));
      expect(mockGetRawToken).toHaveBeenCalledWith(
        expect.objectContaining({ provider: 'gitlab' }),
        'gitlab.corp.example.com',
      );
    });

    it('asks for a write scope by default', async () => {
      await renderPicker(credentialsUiSchema(), {
        formData: 'gitlab.corp.example.com?owner=me&repo=thing',
      });

      await waitFor(() => expect(mockGetRawToken).toHaveBeenCalled());
      expect(mockGetRawToken).toHaveBeenCalledWith(
        expect.objectContaining({ scope: 'write_repository' }),
        'gitlab.corp.example.com',
      );
    });

    it('asks for a read-only scope when the template requests one', async () => {
      await renderPicker(credentialsUiSchema({ readOnly: true }), {
        formData: 'gitlab.corp.example.com?owner=me&repo=thing',
      });

      await waitFor(() => expect(mockGetRawToken).toHaveBeenCalled());
      expect(mockGetRawToken).toHaveBeenCalledWith(
        expect.objectContaining({ scope: 'read_repository' }),
        'gitlab.corp.example.com',
      );
    });

    it('surfaces an auth failure and can retry it', async () => {
      mockGetRawToken.mockRejectedValueOnce(new Error('popup blocked'));

      await renderPicker(credentialsUiSchema(), {
        formData: 'gitlab.corp.example.com?owner=me&repo=thing',
      });

      const retry = await screen.findByRole('button', {
        name: 'scaffolder.repoUrlPicker.authRetry',
      });
      expect(
        screen.getByText(/scaffolder\.repoUrlPicker\.authError/),
      ).toBeInTheDocument();
      expect(srcSecret()).toBe('');

      await userEvent.click(retry);

      await waitFor(() => expect(srcSecret()).toBe('t0ken'));
    });

    it('shows a refused host as a translated configuration error without Retry', async () => {
      const { AuthHostNotAllowedError } = jest.requireActual('../repoAuth');
      mockGetRawToken.mockRejectedValueOnce(
        new AuthHostNotAllowedError(
          'English guard message',
          'gitlab',
          'gitlab.other.example.com',
        ),
      );

      await renderPicker(credentialsUiSchema(), {
        formData: 'gitlab.corp.example.com?owner=me&repo=thing',
      });

      const message = await screen.findByText(
        /^scaffolder\.repoUrlPicker\.hostRefusedOther/,
      );
      expect(message).toHaveTextContent('"provider":"GitLab"');
      expect(message).toHaveTextContent('"host":"gitlab.other.example.com"');
      expect(message).toHaveTextContent('"authHost":"gitlab.corp.example.com"');
      expect(
        screen.queryByText(/English guard message/),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', {
          name: 'scaffolder.repoUrlPicker.authRetry',
        }),
      ).not.toBeInTheDocument();
    });

    it('names the key to set when the refused provider has no auth host', async () => {
      authHosts = { github: 'github.com' };
      const { AuthHostNotAllowedError } = jest.requireActual('../repoAuth');
      mockGetRawToken.mockRejectedValueOnce(
        new AuthHostNotAllowedError(
          'English guard message',
          'gitlab',
          'gitlab.corp.example.com',
        ),
      );

      await renderPicker(credentialsUiSchema(), {
        formData: 'gitlab.corp.example.com?owner=me&repo=thing',
      });

      expect(
        await screen.findByText(/^scaffolder\.repoUrlPicker\.hostRefusedUnset/),
      ).toHaveTextContent('"configKey":"x2a.scm.authHosts.gitlab"');
    });

    it('fails closed for a host that is not a supported integration', async () => {
      await renderPicker(credentialsUiSchema(), {
        formData: 'dev.azure.com?owner=me&repo=thing',
      });

      expect(
        await screen.findByText(/Unsupported SCM host 'dev\.azure\.com'/),
      ).toBeInTheDocument();
      expect(mockGetRawToken).not.toHaveBeenCalled();
      expect(srcSecret()).toBe('');
    });

    it('does nothing when the template asks for no credentials', async () => {
      await renderPicker({}, { formData: 'gitlab.corp.example.com?owner=me' });

      await waitFor(() => expect(mockStockPicker).toHaveBeenCalled());
      expect(mockGetRawToken).not.toHaveBeenCalled();
    });
  });

  it('reuses the stock RepoUrlPicker validation', () => {
    const actual = jest.requireActual('@backstage/plugin-scaffolder');
    expect(x2aRepoUrlPickerValidation).toBe(actual.repoPickerValidation);
  });

  // Canary: X2ARepoUrlPicker reaches into the attached component data of the
  // upstream field extension, because the stock RepoUrlPicker component is not
  // exported. This fails if a Backstage upgrade changes that contract.
  it('can still unwrap the real Backstage RepoUrlPicker component', () => {
    const actual = jest.requireActual('@backstage/plugin-scaffolder');
    const data = getComponentData<{ component?: unknown; name?: string }>(
      <actual.RepoUrlPickerFieldExtension />,
      'scaffolder.extensions.field.v1',
    );

    expect(data?.name).toBe('RepoUrlPicker');
    expect(typeof data?.component).toBe('function');
  });
});

describe('X2ARepoUrlPicker when the stock picker cannot be unwrapped', () => {
  it('reports a compatibility error rather than rendering nothing', async () => {
    jest.clearAllMocks();
    mockStockPickerState.hidden = true;
    mockHostMap.mockReturnValue(new Map([['github.com', 'github']]));

    // The unwrapped component is memoised at module level.
    resetStockRepoUrlPickerForTests();

    await renderInTestApp(
      <WithApis>
        <SecretsContextProvider>
          <X2ARepoUrlPicker
            {...({
              uiSchema: {},
              onChange: jest.fn(),
              schema: {},
              formData: undefined,
              rawErrors: [],
            } as unknown as Props)}
          />
        </SecretsContextProvider>
      </WithApis>,
    );

    expect(
      screen.getByText('scaffolder.repoUrlPicker.pickerUnavailable'),
    ).toBeInTheDocument();
    expect(mockStockPicker).not.toHaveBeenCalled();
  });
});
