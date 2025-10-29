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
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { SandboxCatalogBanner } from '../SandboxCatalogBanner';
import { useSandboxContext } from '../../../hooks/useSandboxContext';
import { SignupData } from '../../../types/registration';
import { AnsibleStatus } from '../../../utils/aap-utils';

const SandboxContext = React.createContext<{
  loading: boolean;
  userData?: SignupData;
  verificationRequired: boolean;
  pendingApproval: boolean;
}>({
  loading: false,
  userData: undefined,
  verificationRequired: false,
  pendingApproval: false,
});

jest.mock(
  '../../../assets/images/sandbox-banner-image.svg',
  () => 'mocked-image-path',
);
jest.mock('../../../hooks/useSandboxContext', () => ({
  useSandboxContext: jest.fn(),
}));

describe('SandboxCatalogBanner', () => {
  const mockTheme = createTheme();
  const mockUseSandboxContext = useSandboxContext as jest.MockedFunction<
    typeof useSandboxContext
  >;

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderWithProviders = (
    contextValue: Partial<{
      loading: boolean;
      userData?: SignupData;
      userFound: boolean;
      userReady: boolean;
      verificationRequired: boolean;
      pendingApproval: boolean;
      ansibleError: string | null;
      ansibleStatus: AnsibleStatus;
    }> = {},
  ) => {
    mockUseSandboxContext.mockReturnValue({
      loading: false,
      userData: undefined,
      userFound: false,
      userReady: false,
      verificationRequired: false,
      pendingApproval: false,
      ansibleError: null,
      ansibleStatus: AnsibleStatus.NEW,
      refetchUserData: jest.fn(),
      signupUser: jest.fn(),
      refetchAAP: jest.fn(),
      ansibleData: undefined,
      ansibleUIUser: undefined,
      ansibleUIPassword: '',
      ansibleUILink: undefined,
      handleAAPInstance: jest.fn(),
      userStatus: '',
      ...contextValue,
    });
    return render(
      <ThemeProvider theme={mockTheme}>
        <SandboxContext.Provider
          value={{
            loading: false,
            userData: undefined,
            verificationRequired: false,
            pendingApproval: false,
            ...contextValue,
          }}
        >
          <SandboxCatalogBanner />
        </SandboxContext.Provider>
      </ThemeProvider>,
    );
  };

  it('renders loading skeleton when loading is true', () => {
    renderWithProviders({ loading: true });
    const skeletons = screen.getAllByTestId('MuiSkeleton-root');
    expect(skeletons).toHaveLength(3);
  });

  it('renders default banner when not logged in', () => {
    renderWithProviders();
    expect(screen.getByText('Try Red Hat products')).toBeInTheDocument();
    expect(
      screen.getByText("Explore, experiment, and see what's possible"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Click on "Try it" to initiate your free, no commitment 30-day trial.',
      ),
    ).toBeInTheDocument();
  });

  it('renders welcome message when user is logged in', () => {
    const userData: SignupData = {
      name: 'John Doe',
      username: 'john_doe',
      compliantUsername: 'john_doe',
      givenName: 'John',
      familyName: 'Doe',
      company: 'ACME Corp',
      status: { ready: true, reason: '', verificationRequired: false },
    };
    renderWithProviders({ userData });
    expect(
      screen.getByText(`Welcome, ${userData.givenName}`),
    ).toBeInTheDocument();
  });

  it('renders boilerplate message when verification is needed', () => {
    renderWithProviders({
      userData: {
        name: 'John Doe',
        username: 'john_doe',
        compliantUsername: 'john_doe',
        givenName: 'John',
        familyName: 'Doe',
        company: 'ACME Corp',
        status: {
          ready: false,
          reason: 'verification',
          verificationRequired: true,
        },
      },
      verificationRequired: true,
    });
    expect(
      screen.getByText(
        'Click on "Try it" to initiate your free, no commitment 30-day trial.',
      ),
    ).toBeInTheDocument();
  });

  it('renders pending approval message when in approval state', () => {
    renderWithProviders({
      userData: {
        name: 'John Doe',
        username: 'john_doe',
        compliantUsername: 'john_doe',
        givenName: 'John',
        familyName: 'Doe',
        company: 'ACME Corp',
        status: {
          ready: false,
          reason: 'pending approval',
          verificationRequired: false,
        },
      },
      pendingApproval: true,
    });
    expect(
      screen.getByText('Please wait for your trial to be approved.'),
    ).toBeInTheDocument();
  });

  it('renders trial expiry message when user has end date', () => {
    const mockDate = new Date(2024, 0, 1);
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

    const futureDate = new Date(2024, 0, 5);

    renderWithProviders({
      userData: {
        name: 'John Doe',
        username: 'john_doe',
        compliantUsername: 'john_doe',
        givenName: 'John',
        familyName: 'Doe',
        company: 'ACME Corp',
        endDate: futureDate.toISOString(),
        status: { ready: true, reason: '', verificationRequired: false },
      },
    });

    const text = screen.getByText(/Your free trial expires in \d+ days?/);
    expect(text).toBeInTheDocument();

    jest.restoreAllMocks();
  });

  it('does not render trial expiry message when endDate is not set', () => {
    renderWithProviders({
      userData: {
        name: 'John Doe',
        username: 'john_doe',
        compliantUsername: 'john_doe',
        givenName: 'John',
        familyName: 'Doe',
        company: 'ACME Corp',
        status: { ready: true, reason: '', verificationRequired: false },
      },
    });

    const text = screen.queryByText(/Your free trial expires in \d+ days?/);
    expect(text).not.toBeInTheDocument();
  });

  it('uses compliantUsername when givenName is not available', () => {
    renderWithProviders({
      userData: {
        name: 'John Doe',
        username: 'john_doe',
        compliantUsername: 'john_doe',
        givenName: '',
        familyName: 'Doe',
        company: 'ACME Corp',
        status: { ready: true, reason: '', verificationRequired: false },
      },
      userFound: true,
    });
    expect(screen.getByText('Welcome, john_doe')).toBeInTheDocument();
  });

  it('displays banner image', () => {
    renderWithProviders();
    const image = screen.getByAltText('Red Hat Trial');
    expect(image).toBeInTheDocument();
    expect(image.getAttribute('src')).toBe('mocked-image-path');
  });

  it('renders info icon when user has end date', () => {
    const mockDate = new Date(2024, 0, 1);
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

    const futureDate = new Date(2024, 0, 5);

    renderWithProviders({
      userData: {
        name: 'John Doe',
        username: 'john_doe',
        compliantUsername: 'john_doe',
        givenName: 'John',
        familyName: 'Doe',
        company: 'ACME Corp',
        endDate: futureDate.toISOString(),
        status: { ready: true, reason: '', verificationRequired: false },
      },
    });

    const infoButton = screen.getByLabelText('Show trial information');
    expect(infoButton).toBeInTheDocument();

    jest.restoreAllMocks();
  });

  it('does not render info icon when user has no end date', () => {
    renderWithProviders({
      userData: {
        name: 'John Doe',
        username: 'john_doe',
        compliantUsername: 'john_doe',
        givenName: 'John',
        familyName: 'Doe',
        company: 'ACME Corp',
        status: { ready: true, reason: '', verificationRequired: false },
      },
    });

    const infoButton = screen.queryByLabelText('Show trial information');
    expect(infoButton).not.toBeInTheDocument();
  });

  it('opens popover when info icon is clicked', async () => {
    const mockDate = new Date(2024, 0, 1);
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

    const futureDate = new Date(2024, 0, 5);

    renderWithProviders({
      userData: {
        name: 'John Doe',
        username: 'john_doe',
        compliantUsername: 'john_doe',
        givenName: 'John',
        familyName: 'Doe',
        company: 'ACME Corp',
        endDate: futureDate.toISOString(),
        status: { ready: true, reason: '', verificationRequired: false },
      },
    });

    const infoButton = screen.getByLabelText('Show trial information');
    fireEvent.click(infoButton);

    await waitFor(() => {
      expect(screen.getByText('Trial expiration')).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        /Once this trial expires, you can start a new one right afterwards/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('View documentation')).toBeInTheDocument();

    jest.restoreAllMocks();
  });

  it('closes popover when close button is clicked', async () => {
    const mockDate = new Date(2024, 0, 1);
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

    const futureDate = new Date(2024, 0, 5);

    renderWithProviders({
      userData: {
        name: 'John Doe',
        username: 'john_doe',
        compliantUsername: 'john_doe',
        givenName: 'John',
        familyName: 'Doe',
        company: 'ACME Corp',
        endDate: futureDate.toISOString(),
        status: { ready: true, reason: '', verificationRequired: false },
      },
    });

    const infoButton = screen.getByLabelText('Show trial information');
    fireEvent.click(infoButton);

    await waitFor(() => {
      expect(screen.getByText('Trial expiration')).toBeInTheDocument();
    });

    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Trial expiration')).not.toBeInTheDocument();
    });

    jest.restoreAllMocks();
  });

  it('includes correct documentation link in popover', async () => {
    const mockDate = new Date(2024, 0, 1);
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

    const futureDate = new Date(2024, 0, 5);

    renderWithProviders({
      userData: {
        name: 'John Doe',
        username: 'john_doe',
        compliantUsername: 'john_doe',
        givenName: 'John',
        familyName: 'Doe',
        company: 'ACME Corp',
        endDate: futureDate.toISOString(),
        status: { ready: true, reason: '', verificationRequired: false },
      },
    });

    const infoButton = screen.getByLabelText('Show trial information');
    fireEvent.click(infoButton);

    await waitFor(() => {
      expect(screen.getByText('Trial expiration')).toBeInTheDocument();
    });

    const docLink = screen.getByText('View documentation');
    expect(docLink).toHaveAttribute(
      'href',
      'https://developers.redhat.com/learn/openshift/export-your-application-sandbox-red-hat-openshift-service-aws?source=sso',
    );
    expect(docLink).toHaveAttribute('target', '_blank');
    expect(docLink).toHaveAttribute('rel', 'noopener noreferrer');

    jest.restoreAllMocks();
  });
});
