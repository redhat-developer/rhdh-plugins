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
import { useApi } from '@backstage/core-plugin-api';
import { registerApiRef } from '../../../api';
import { SandboxCatalogBanner } from '../SandboxCatalogBanner';
import { render } from '@testing-library/react';

jest.mock('../../../api/RegistrationBackendClient', () => {
  const mock = {
    getSignUpData: jest.fn(),
  };
  return {
    __esModule: true,
    default: () => mock,
  };
});

jest.mock('../../../hooks/useSandboxContext', () => {
  const mock = {
    refetchUserData: jest.fn(),
  };
  return {
    __esModule: true,
    default: () => mock,
  };
});

describe('SandboxCatalogBanner', () => {
  let getSignUpDataMock: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.resetAllMocks();
    // const registerApi = useApi(registerApiRef);
    // getSignUpDataMock = registerApi.getSignUpData as jest.Mock;
  });

  it('Should show givenName when present', () => {
    // getSignUpDataMock.mockReturnValue({
    //   name: "asdfasdfas-myname",
    //   compliantUsername: "mycompliantusername",
    //   username: "myusername",
    //   givenName: "mygivenname",
    //   status: {
    //     ready: true,
    //     reason: 'Provisioned',
    //   },
    // });
    // render(<SandboxCatalogBanner />);
  });
});
