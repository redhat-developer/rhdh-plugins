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

import { TestApiProvider } from '@backstage/test-utils';
import { scmAuthApiRef } from '@backstage/integration-react';
import { scaffolderApiRef } from '@backstage/plugin-scaffolder-react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ConfigRepositoryPicker } from './ConfigRepositoryPicker';

describe('ConfigRepositoryPicker', () => {
  const scmAuth = {
    getCredentials: jest.fn().mockResolvedValue({
      token: 'raw-token', // NOSONAR
      headers: {},
    }),
  };
  const scaffolder = {
    autocomplete: jest.fn().mockResolvedValue({ results: [] }),
  };
  const hostProviderMap = new Map([
    ['github.com', 'github' as const],
    ['gitlab.com', 'gitlab' as const],
    ['bitbucket.org', 'bitbucket' as const],
  ]);

  const renderPicker = async () => {
    const onChange = jest.fn();
    const onError = jest.fn();

    render(
      <TestApiProvider
        apis={[
          [scmAuthApiRef, scmAuth],
          [scaffolderApiRef, scaffolder],
        ]}
      >
        <ConfigRepositoryPicker
          open
          hostProviderMap={hostProviderMap}
          value={{ repositoryUrl: '', repositoryBranch: 'main' }}
          onChange={onChange}
          onError={onError}
        />
      </TestApiProvider>,
    );

    await waitFor(() => expect(scmAuth.getCredentials).toHaveBeenCalled());

    return { onChange, onError };
  };

  beforeEach(() => {
    scmAuth.getCredentials.mockClear();
    scaffolder.autocomplete.mockClear();
  });

  it('offers configured Bitbucket hosts and uses the raw token for autocomplete', async () => {
    await renderPicker();

    fireEvent.mouseDown(screen.getByRole('button', { name: /github.com/ }));
    expect(
      await screen.findByRole('option', { name: 'bitbucket.org (bitbucket)' }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(scaffolder.autocomplete).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'raw-token',
          provider: 'github',
        }),
      );
    });
  });

  it('authenticates a configured HTTPS manual URL and augments its Git token', async () => {
    const { onChange } = await renderPicker();
    const repositoryInput = screen
      .getAllByRole('combobox')[1]
      .querySelector('input') as HTMLInputElement;

    fireEvent.change(repositoryInput, {
      target: { value: 'https://gitlab.com/group/repository.git' },
    });
    fireEvent.blur(repositoryInput);

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith({
        repositoryUrl: 'https://gitlab.com/group/repository.git',
        repositoryBranch: 'main',
        token: 'oauth2:raw-token', // NOSONAR
      });
    });
  });

  it('rejects manual URLs from unsupported hosts', async () => {
    const { onChange, onError } = await renderPicker();
    const repositoryInput = screen
      .getAllByRole('combobox')[1]
      .querySelector('input') as HTMLInputElement;

    fireEvent.change(repositoryInput, {
      target: { value: 'https://example.com/org/repository.git' },
    });
    fireEvent.blur(repositoryInput);

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(
        'Repository host is not a configured supported SCM host.',
      );
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('rejects manual URLs with embedded credentials', async () => {
    const { onChange, onError } = await renderPicker();
    const repositoryInput = screen
      .getAllByRole('combobox')[1]
      .querySelector('input') as HTMLInputElement;

    fireEvent.change(repositoryInput, {
      target: {
        value: 'https://user:password@github.com/org/repository.git',
      },
    });
    fireEvent.blur(repositoryInput);

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(
        'Repository URL must not contain embedded credentials.',
      );
    });
    expect(onChange).not.toHaveBeenCalled();
  });
});
