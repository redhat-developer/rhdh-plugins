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

import { HeaderButton } from './HeaderButton';

describe('HeaderButton', () => {
  it('can render an internal link', async () => {
    const { getByRole } = await renderInTestApp(
      <HeaderButton title="Internal link" to="/internal-link" />,
    );
    expect(getByRole('button')).toBeInTheDocument();
    expect(getByRole('button')).toHaveTextContent('Internal link');
    expect(getByRole('button').getAttribute('href')).toEqual('/internal-link');
    expect(getByRole('button').getAttribute('target')).not.toEqual('_blank');
  });

  it('can render an external link', async () => {
    const { getByRole } = await renderInTestApp(
      <HeaderButton
        title="External link"
        to="https://access.redhat.com/products/red-hat-developer-hub"
      />,
    );
    expect(getByRole('button')).toBeInTheDocument();
    expect(getByRole('button')).toHaveTextContent('External link');
    expect(getByRole('button').getAttribute('href')).toEqual(
      'https://access.redhat.com/products/red-hat-developer-hub',
    );
    expect(getByRole('button').getAttribute('target')).toEqual('_blank');
  });
});
