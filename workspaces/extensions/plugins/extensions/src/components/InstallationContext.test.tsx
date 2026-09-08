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
  resetInstallationStore,
  useInstallationContext,
} from './InstallationContext';

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
            'APIs with 3scale': 'disabled',
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
