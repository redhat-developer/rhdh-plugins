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

import { render } from '@testing-library/react';
import { Trans } from './Trans';

describe('Trans', () => {
  it('renders translated text', () => {
    const { getByText } = render(<Trans message="header.title" />);
    expect(
      getByText("Let's get you started with Developer Hub"),
    ).toBeInTheDocument();
  });

  it('renders translated text with params', () => {
    const { getByText } = render(
      <Trans message="footer.progress" params={{ progress: '50' }} />,
    );
    expect(getByText('50% progress')).toBeInTheDocument();
  });
});
