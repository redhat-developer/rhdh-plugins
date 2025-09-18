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

import { render, screen } from '@testing-library/react';

import { PermissionRequiredIcon } from '../PermissionRequiredIcon';

jest.mock(
  '../../../images/permission-required.svg',
  () => 'mocked-permission-required.svg',
);

describe('PermissionRequiredIcon Component', () => {
  it('should render the permission required image', () => {
    render(<PermissionRequiredIcon />);

    const image = screen.getByAltText('permission required icon');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'mocked-permission-required.svg');
  });
});
