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

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { SandboxCatalogCard } from '../SandboxCatalogCard';
import { Product } from '../productData';
import { AnsibleStatus } from '../../../utils/aap-utils';
import { useSandboxContext } from '../../../hooks/useSandboxContext';
import useGreenCorners from '../../../hooks/useGreenCorners';

jest.useFakeTimers(); // control timers
// Mock the hooks
jest.mock('../../../hooks/useGreenCorners');
jest.mock('../../../hooks/useSandboxContext');

const mockCreateAAP = jest.fn();
const configMock = {
  createAAP: mockCreateAAP,
};

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useApi: jest.fn(() => {
    return configMock;
  }),
}));

describe('SandboxCatalogCard', () => {
  const theme = createTheme();

  const mockSetGreenCorners = jest.fn();
  const mockGreenCorners = [{ id: 'openshift-console', show: false }];
  const mockRefetchUserData = jest.fn();
  const mockShowGreenCorner = jest.fn();
  const mockUseSandboxContext = useSandboxContext as jest.MockedFunction<
    typeof useSandboxContext
  >;
  const mockSignupUser = jest.fn();
  const mockRefetchAAP = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // refetching the user data will return the actual user provisioned
    mockRefetchUserData.mockReturnValue({
      name: 'bob',
      consoleURL: 'https://sandboxcluster.test/',
      cheDashboardURL: 'https://devspaces.test/',
      proxyURL: 'https://api-sandboxcluster.test',
      rhodsMemberURL: 'https://rhods-dashboard.test/',
      apiEndpoint: 'https://api.test:6443',
      clusterName: 'sandboxcluster.test',
      defaultUserNamespace: 'bob-2-dev',
      compliantUsername: 'bob-2',
      username: 'bob',
      status: {
        ready: true,
        reason: 'Provisioned',
        verificationRequired: false,
      },
    } as any);

    mockUseSandboxContext.mockReturnValue({
      refetchUserData: mockRefetchUserData,
      loading: false,
      userFound: false,
      userReady: false,
      ansibleStatus: AnsibleStatus.UNKNOWN,
      verificationRequired: false,
      userData: undefined,
      signupUser: mockSignupUser,
      refetchAAP: mockRefetchAAP,
      ansibleData: undefined,
      ansibleUIUser: undefined,
    } as any);
    (useGreenCorners as jest.Mock).mockReturnValue({
      greenCorners: mockGreenCorners,
      setGreenCorners: mockSetGreenCorners,
    });
  });

  const defaultProps = {
    id: Product.OPENSHIFT_CONSOLE,
    title: 'Openshift',
    image: 'sometestimage.svg',
    description: [
      { icon: <div>icon 1</div>, value: 'Description 1' },
      { icon: <div>icon 2</div>, value: 'Description 2' },
    ],
    link: 'https://openshiftconsole.url.com',
    greenCorner: false,
    showGreenCorner: mockShowGreenCorner,
  };

  const renderCard = (props = {}) => {
    return render(
      <ThemeProvider theme={theme}>
        <SandboxCatalogCard {...defaultProps} {...props} />
      </ThemeProvider>,
    );
  };

  it('renders the card', () => {
    renderCard();

    const cards = screen.getAllByTestId('catalog-card');
    expect(cards).toHaveLength(1);
    expect(screen.getByText('Openshift')).toBeInTheDocument(); // title
    expect(screen.getByText('Description 1')).toBeInTheDocument(); // description
    expect(screen.getByText('Description 2')).toBeInTheDocument(); // description
    expect(screen.getByText('icon 1')).toBeInTheDocument(); // icon
    const img = screen.getByAltText('Openshift') as HTMLImageElement;
    expect(img.src).toContain('sometestimage.svg');
    expect(screen.getByText('Try it')).toBeInTheDocument();
  });

  it('opens the link when user signs up', async () => {
    const mockOpen = jest.fn();
    window.open = mockOpen; // override window.open with mock
    renderCard();

    // Find and click try it button/icon
    const tryItButton = screen.getByRole('button', { name: /Try it/i });
    fireEvent.click(tryItButton);

    // advance timers to trigger all retries
    for (let i = 0; i < 5; i++) {
      jest.advanceTimersByTime(1000);
      await Promise.resolve(); // allow awaiting the timer to flush
    }

    expect(mockSignupUser).toHaveBeenCalled(); // check it signs up the user
    expect(mockRefetchUserData).toHaveBeenCalled();
    expect(mockOpen).toHaveBeenCalledWith(
      'https://sandboxcluster.test/',
      '_blank',
    ); // check it opens the url after signup
    expect(mockShowGreenCorner).toHaveBeenCalled();
  });

  it('starts provisioning AAP when user signs up', async () => {
    // AAP product card
    renderCard({ id: Product.AAP });

    // Find and click provision button/icon
    const tryItButton = screen.getByRole('button', { name: /Provision/i });
    fireEvent.click(tryItButton);

    // advance timers to trigger all retries
    for (let i = 0; i < 5; i++) {
      jest.advanceTimersByTime(1000);
      await Promise.resolve(); // allow awaiting the timer to flush
    }

    expect(mockSignupUser).toHaveBeenCalled(); // check it signs up the user
    expect(mockRefetchUserData).toHaveBeenCalled();
    expect(mockRefetchAAP).toHaveBeenCalled(); // check it calls the aap specific functionality
    expect(mockCreateAAP).toHaveBeenCalledWith('bob-2-dev'); // check it creates the app instance in the user namespace
    expect(mockShowGreenCorner).toHaveBeenCalled();
  });
});
