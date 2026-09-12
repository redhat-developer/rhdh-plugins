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

import { renderInTestApp } from '@backstage/test-utils';
import { fireEvent, screen } from '@testing-library/react';

import { boostMessages } from '../../../translations/ref';
import { AvailableModelsDialog } from './AvailableModelsDialog';

const { catalog: msg } = boostMessages;

describe('AvailableModelsDialog', () => {
  it('searches the model list without rendering every model in the overview', async () => {
    const models = Array.from({ length: 25 }, (_, index) => `model-${index}`);

    await renderInTestApp(<AvailableModelsDialog models={models} />);

    expect(screen.queryByText('model-24')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: msg.card.viewModels }));

    expect(screen.getByText('model-0')).toBeInTheDocument();
    expect(screen.queryByText('model-24')).toBeNull();

    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'model-24' },
    });

    expect(screen.getByText('model-24')).toBeInTheDocument();
    expect(screen.queryByText('model-0')).toBeNull();
  });
});
