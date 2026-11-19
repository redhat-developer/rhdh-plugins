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

/**
 * Renders the REAL Backstage RepoUrlPicker through X2ARepoUrlPicker, with no
 * stubbing of the upstream component, to prove two things for a self-hosted
 * SCM instance that is configured only under `integrations:`:
 *
 *  1. it shows up in the host dropdown, and
 *  2. an access token is obtained for it — through the provider-level auth
 *     API, never through the host-keyed `scmAuthApi` that would throw
 *     "No auth provider available" for a custom host.
 */

import { useState } from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderInTestApp, TestApiProvider } from '@backstage/test-utils';
import { ConfigReader } from '@backstage/config';
import type { JsonObject } from '@backstage/types';
import {
  configApiRef,
  gitlabAuthApiRef,
  githubAuthApiRef,
  bitbucketAuthApiRef,
} from '@backstage/core-plugin-api';
import {
  ScmIntegrationsApi,
  scmIntegrationsApiRef,
  scmAuthApiRef,
} from '@backstage/integration-react';
import {
  scaffolderApiRef,
  SecretsContextProvider,
  useTemplateSecrets,
  type FieldExtensionComponentProps,
} from '@backstage/plugin-scaffolder-react';

import { repoPickerValidation } from '@backstage/plugin-scaffolder';
import {
  X2ARepoUrlPicker,
  type X2ARepoUrlPickerUiOptions,
} from './X2ARepoUrlPicker';

const CUSTOM_HOST = 'gitlab.apps.example.com';
const GITHUB_HOST = 'ghe.example.com';
const SECRETS_KEY = 'SRC_USER_OAUTH_TOKEN';

const customGitlab = {
  host: CUSTOM_HOST,
  apiBaseUrl: `https://${CUSTOM_HOST}/api/v4`,
};

type Deferred = {
  promise: Promise<string>;
  resolve: (v: string) => void;
  reject: (e: Error) => void;
};
function deferred(): Deferred {
  let resolve!: Deferred['resolve'];
  let reject!: Deferred['reject'];
  const promise = new Promise<string>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const SecretProbe = () => {
  const { secrets } = useTemplateSecrets();
  return <div data-testid="src-secret">{secrets[SECRETS_KEY] ?? ''}</div>;
};

/**
 * Feeds `onChange` back in as `formData`, the way RJSF does — the picker only
 * learns which host was selected through that round trip.
 */
const StatefulPicker = (props: {
  uiSchema: FieldExtensionComponentProps<
    string,
    X2ARepoUrlPickerUiOptions
  >['uiSchema'];
  onFormData?: (v: string | undefined) => void;
}) => {
  const [formData, setFormData] = useState<string | undefined>(undefined);
  props.onFormData?.(formData);
  return (
    <X2ARepoUrlPicker
      {...({
        uiSchema: props.uiSchema,
        onChange: setFormData,
        formData,
        schema: { title: 'Conversion source repository' },
        rawErrors: [],
      } as unknown as FieldExtensionComponentProps<
        string,
        X2ARepoUrlPickerUiOptions
      >)}
    />
  );
};

async function renderPicker(
  options: {
    integrations?: JsonObject;
    gitlabToken?: (scope: string) => Promise<string>;
    githubToken?: (scope: string) => Promise<string>;
    getCredentials?: jest.Mock;
    onFormData?: (v: string | undefined) => void;
  } = {},
) {
  const config = new ConfigReader({
    integrations: options.integrations ?? { gitlab: [customGitlab] },
  });
  const scmIntegrationsApi = ScmIntegrationsApi.fromConfig(config);

  // Mirrors the real ScaffolderClient: allowedHosts is an inclusion filter.
  const scaffolderApi = {
    getIntegrationsList: async ({
      allowedHosts,
    }: {
      allowedHosts: string[];
    }) => ({
      integrations: [
        ...scmIntegrationsApi.github.list(),
        ...scmIntegrationsApi.gitlab.list(),
        ...scmIntegrationsApi.bitbucketCloud.list(),
        ...scmIntegrationsApi.azure.list(),
      ]
        .map(i => ({ type: i.type, title: i.title, host: i.config.host }))
        .filter(i => allowedHosts.includes(i.host)),
    }),
    autocomplete: jest.fn().mockResolvedValue({ results: [] }),
  };

  const getCredentials =
    options.getCredentials ??
    jest.fn().mockRejectedValue(
      // What the default ScmAuth mux really does for an unknown host.
      new Error(`No auth provider available for 'https://${CUSTOM_HOST}'`),
    );
  const getGitlabToken = jest
    .fn()
    .mockImplementation(options.gitlabToken ?? (async () => 'gl-token'));
  const getGithubToken = jest
    .fn()
    .mockImplementation(options.githubToken ?? (async () => 'gh-token'));

  const apiHolder = apiHolderFor(scmIntegrationsApi);

  await renderInTestApp(
    <TestApiProvider
      apis={[
        [configApiRef, config],
        [scmIntegrationsApiRef, scmIntegrationsApi],
        [scmAuthApiRef, { getCredentials }],
        [scaffolderApiRef, scaffolderApi],
        [gitlabAuthApiRef, { getAccessToken: getGitlabToken }],
        [githubAuthApiRef, { getAccessToken: getGithubToken }],
        [bitbucketAuthApiRef, { getAccessToken: jest.fn() }],
      ]}
    >
      <SecretsContextProvider>
        <StatefulPicker
          onFormData={options.onFormData}
          uiSchema={
            {
              'ui:options': {
                requestUserCredentials: { secretsKey: SECRETS_KEY },
              },
            } as FieldExtensionComponentProps<
              string,
              X2ARepoUrlPickerUiOptions
            >['uiSchema']
          }
        />
        <SecretProbe />
      </SecretsContextProvider>
    </TestApiProvider>,
  );

  return {
    getCredentials,
    getGitlabToken,
    getGithubToken,
    scaffolderApi,
    apiHolder,
  };
}

/** Minimal ApiHolder exposing only the real integrations API. */
function apiHolderFor(scmIntegrationsApi: ScmIntegrationsApi) {
  return {
    get: (ref: { id: string }) =>
      ref.id === scmIntegrationsApiRef.id ? scmIntegrationsApi : undefined,
  } as any;
}

const hostSelect = () => screen.findByTestId('host-select');

async function selectHost(host: string) {
  const select = await hostSelect();
  const native = select.matches('select')
    ? select
    : (select.querySelector('select') as HTMLElement);
  await userEvent.selectOptions(native, host);
}

describe('X2ARepoUrlPicker (real RepoUrlPicker)', () => {
  it('offers a self-hosted GitLab instance that only appears in integrations', async () => {
    await renderPicker();

    const select = await hostSelect();
    await waitFor(() => {
      expect(select.textContent).toContain(CUSTOM_HOST);
    });
  });

  it('does not offer providers x2a has no support for', async () => {
    await renderPicker({
      integrations: {
        gitlab: [customGitlab],
        // Azure is configured but must NOT be offered.
        azure: [{ host: 'dev.azure.com' }],
      },
    });

    const select = await hostSelect();
    await waitFor(() => {
      expect(select.textContent).toContain(CUSTOM_HOST);
    });
    expect(select.textContent).not.toContain('dev.azure.com');
  });

  it('obtains a token for the self-hosted host without going through the app scmAuthApi', async () => {
    const { getCredentials, getGitlabToken } = await renderPicker();

    await waitFor(() => {
      expect(screen.getByTestId('src-secret')).toHaveTextContent('gl-token');
    });
    expect(getGitlabToken).toHaveBeenCalledWith('write_repository');
    // The host-keyed path would have thrown for this host; we must not use it.
    expect(getCredentials).not.toHaveBeenCalled();
  });

  it('offers only bitbucket.org when no integrations are configured', async () => {
    await renderPicker({ integrations: {} });

    const select = await hostSelect();
    await waitFor(() => {
      expect(select.textContent).toContain('bitbucket.org');
    });
  });

  it('supports Bitbucket Cloud end to end', async () => {
    const { apiHolder } = await renderPicker({
      integrations: {
        bitbucketCloud: [{ username: 'u', token: 't' }],
      },
    });

    // bitbucket.org is the only host, so it is auto-selected.
    const workspace = await screen.findByLabelText(/workspace/i);
    const project = await screen.findByLabelText(/project/i);
    const repo = await screen.findByLabelText(/repository/i);
    await userEvent.type(workspace, 'my-ws');
    await userEvent.type(project, 'my-proj');
    await userEvent.type(repo, 'my-repo');

    // Validation runs against the app's REAL integrations (bitbucketCloud).
    const errors: string[] = [];
    const validation = { addError: (m: string) => errors.push(m) } as any;
    repoPickerValidation(
      'bitbucket.org?workspace=my-ws&project=my-proj&repo=my-repo',
      validation,
      { apiHolder } as any,
    );
    expect(errors).toEqual([]);
  });

  it('clears the previous host token and reports a failure on the new host', async () => {
    const { getGitlabToken, getGithubToken } = await renderPicker({
      integrations: {
        github: [{ host: GITHUB_HOST }],
        gitlab: [customGitlab],
      },
      gitlabToken: async () => {
        throw new Error('popup blocked');
      },
    });

    await waitFor(() => {
      expect(screen.getByTestId('src-secret')).toHaveTextContent('gh-token');
    });

    await selectHost(CUSTOM_HOST);

    await waitFor(() => {
      expect(screen.getByText(/popup blocked/)).toBeInTheDocument();
    });
    expect(screen.getByTestId('src-secret')).toHaveTextContent('');
    expect(getGitlabToken).toHaveBeenCalledTimes(1);

    // The failed-host memo is dropped on host change.
    await selectHost(GITHUB_HOST);
    await waitFor(() => expect(getGithubToken).toHaveBeenCalledTimes(2));
    await selectHost(CUSTOM_HOST);
    await waitFor(() => expect(getGitlabToken).toHaveBeenCalledTimes(2));
  });

  it('ignores an out-of-order response from a previously selected host', async () => {
    const gh = deferred();
    const gl = deferred();
    const { getGitlabToken, getGithubToken } = await renderPicker({
      integrations: {
        github: [{ host: GITHUB_HOST }],
        gitlab: [customGitlab],
      },
      githubToken: () => gh.promise,
      gitlabToken: () => gl.promise,
    });

    await waitFor(() => expect(getGithubToken).toHaveBeenCalled());
    await selectHost(CUSTOM_HOST);
    await waitFor(() => expect(getGitlabToken).toHaveBeenCalled());

    gl.resolve('gl-token');
    await waitFor(() => {
      expect(screen.getByTestId('src-secret')).toHaveTextContent('gl-token');
    });
    gh.resolve('gh-token');
    await new Promise(r => setTimeout(r, 100));
    expect(screen.getByTestId('src-secret')).toHaveTextContent('gl-token');
  });

  it('feeds the token to owner/repo autocomplete', async () => {
    const { scaffolderApi } = await renderPicker();

    await waitFor(
      () => {
        expect(scaffolderApi.autocomplete).toHaveBeenCalledWith(
          expect.objectContaining({ token: 'gl-token' }),
        );
      },
      { timeout: 4000 },
    );
  });
});
