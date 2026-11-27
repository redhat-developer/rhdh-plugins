/*
 * Copyright The Backstage Authors
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
import { fireEvent, render } from '@testing-library/react';
import {
  InstallationContextProvider,
  getPackageInstallationKey,
  getPendingInstallationAction,
  getPendingInstallationLabel,
  inferEnabledFromPending,
  resetInstallationStore,
  useInstallationContext,
  withPackageInstallationEntry,
  withoutPackageInstallationEntry,
} from './InstallationContext';

const t = ((key: string) => key) as any;

const Consumer = () => {
  const { installedPlugins, setInstalledPlugins } = useInstallationContext();
  return (
    <div>
      <span data-testid="plugins">
        {Object.keys(installedPlugins).join(',')}
      </span>
      <button
        type="button"
        onClick={() =>
          setInstalledPlugins({
            ...installedPlugins,
            'APIs with 3scale': 'disable',
          })
        }
      >
        record
      </button>
    </div>
  );
};

describe('InstallationContextProvider', () => {
  beforeEach(() => {
    resetInstallationStore();
  });

  afterEach(() => {
    resetInstallationStore();
  });

  it('infers enabled state from structured pending actions', () => {
    expect(inferEnabledFromPending('enable')).toBe(true);
    expect(inferEnabledFromPending('disable')).toBe(false);
    expect(inferEnabledFromPending('install')).toBeUndefined();
    expect(inferEnabledFromPending('update')).toBeUndefined();
    expect(inferEnabledFromPending(undefined)).toBeUndefined();
  });

  it('maps pending actions to localized display labels', () => {
    expect(getPendingInstallationLabel('disable', 'plugin', t)).toBe(
      'install.pluginDisabled',
    );
    expect(getPendingInstallationLabel('enable', 'package', t)).toBe(
      'install.packageEnabled',
    );
    expect(getPendingInstallationLabel('install', 'plugin', t)).toBe(
      'install.pluginInstalled',
    );
    expect(getPendingInstallationLabel('update', 'package', t)).toBe(
      'install.packageUpdated',
    );
  });

  it('uses catalog title as the package pending key', () => {
    expect(
      getPackageInstallationKey({
        title: 'App Auth',
        displayName: 'App Auth',
        name: 'app-auth',
      }),
    ).toBe('App Auth');
  });

  it('resolves pending actions from canonical key or aliases', () => {
    expect(
      getPendingInstallationAction(
        {
          '@red-hat-developer-hub/backstage-plugin-app-auth-dynamic': 'disable',
        },
        'App Auth',
        ['@red-hat-developer-hub/backstage-plugin-app-auth-dynamic'],
      ),
    ).toBe('disable');
    expect(
      getPendingInstallationAction({ 'App Auth': 'enable' }, 'App Auth', [
        '@scope/pkg',
      ]),
    ).toBe('enable');
    expect(
      getPendingInstallationAction({}, 'App Auth', ['@scope/pkg']),
    ).toBeUndefined();
  });

  it('collapses npm packageName aliases into a single pending entry', () => {
    const withDuplicate = {
      'App Auth': 'update' as const,
      '@red-hat-developer-hub/backstage-plugin-app-auth-dynamic':
        'disable' as const,
    };

    const collapsed = withPackageInstallationEntry(
      withDuplicate,
      'App Auth',
      'disable',
      ['@red-hat-developer-hub/backstage-plugin-app-auth-dynamic', 'app-auth'],
    );

    expect(collapsed).toEqual({ 'App Auth': 'disable' });
    expect(
      withoutPackageInstallationEntry(collapsed, 'App Auth', [
        '@red-hat-developer-hub/backstage-plugin-app-auth-dynamic',
      ]),
    ).toEqual({});
  });

  it('preserves pending restarts when the provider remounts', () => {
    const { getByText, getByTestId, unmount } = render(
      <InstallationContextProvider>
        <Consumer />
      </InstallationContextProvider>,
    );

    fireEvent.click(getByText('record'));
    expect(getByTestId('plugins')).toHaveTextContent('APIs with 3scale');

    unmount();

    const { getByTestId: getByTestIdAfterRemount } = render(
      <InstallationContextProvider>
        <Consumer />
      </InstallationContextProvider>,
    );

    expect(getByTestIdAfterRemount('plugins')).toHaveTextContent(
      'APIs with 3scale',
    );
  });
});
