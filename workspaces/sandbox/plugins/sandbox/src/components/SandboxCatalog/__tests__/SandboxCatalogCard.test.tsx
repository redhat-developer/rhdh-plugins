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
import { render, screen } from '@testing-library/react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { wrapInTestApp } from '@backstage/test-utils';
import { SandboxCatalogCard } from '../SandboxCatalogCard';
import { Product } from '../productData';
import { AnsibleStatus } from '../../../utils/aap-utils';
import { useSandboxContext } from '../../../hooks/useSandboxContext';

// Mock the hooks
jest.mock('@backstage/core-plugin-api');
jest.mock('../../../hooks/useSandboxContext');

describe('SandboxCatalogCard', () => {
  const theme = createTheme();

  const mockRefetchUserData = jest.fn();
  const mockUseSandboxContext = useSandboxContext as jest.MockedFunction<
    typeof useSandboxContext
  >;

  beforeEach(() => {
    jest.clearAllMocks();
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
    } as any);

    mockUseSandboxContext.mockReturnValue({
      refetchUserData: mockRefetchUserData,
      loading: false,
      userFound: false,
      userReady: false,
      ansibleStatus: AnsibleStatus.UNKNOWN,
      verificationRequired: false,
      userData: undefined,
      signupUser: jest.fn(),
      refetchAAP: jest.fn(),
      ansibleData: undefined,
      ansibleUIUser: undefined,
    } as any);
  });

  const defaultProps = {
    id: Product.OPENSHIFT_CONSOLE,
    title: 'Openshift',
    image: 'sometestimage.svg',
    description: 'Test openshift',
  };

  const renderCard = (props = {}) => {
    return render(
      wrapInTestApp(
        <ThemeProvider theme={theme}>
          <SandboxCatalogCard {...defaultProps} {...props} />
        </ThemeProvider>,
      ),
    );
  };

  it('renders the card', () => {
    renderCard();

    // Should render one card per product in productData
    const cards = screen.getAllByTestId('catalog-card');
    expect(cards).toHaveLength(1);
    expect(screen.getByText('Openshift')).toBeInTheDocument(); // title
    expect(screen.getByText('Test openshift')).toBeInTheDocument(); // description
    expect(screen.getByText('Test openshift')).toBeInTheDocument(); // description
    const img = screen.getByAltText('sometestimage') as HTMLImageElement;
    expect(img.src).toBe('sometestimage.svg');

    expect(screen.getByText('Try it')).toBeInTheDocument();
  });

  // it('calls useGreenCorners hook with productData', () => {
  //   renderGrid();
  //   expect(useGreenCorners).toHaveBeenCalledWith(productData);
  // });
  //
  // it('calls useProductURLs hook', () => {
  //   renderGrid();
  //   expect(useProductURLs).toHaveBeenCalled();
  // });
  //
  // it('passes correct props to SandboxCatalogCard components', () => {
  //   renderGrid();
  //
  //   expect(SandboxCatalogCard).toHaveBeenCalledTimes(productData.length);
  //
  //   // Check props for the first card
  //   const firstCallProps = (SandboxCatalogCard as jest.Mock).mock.calls[0][0];
  //   expect(firstCallProps.id).toBe(productData[0].id);
  //   expect(firstCallProps.title).toBe(productData[0].title);
  //   expect(firstCallProps.image).toBe(productData[0].image);
  //   expect(firstCallProps.description).toBe(productData[0].description);
  //   expect(firstCallProps.link).toBe(mockProductURLs[0].url);
  //   expect(firstCallProps.greenCorner).toBe(false); // From mockGreenCorners
  //   expect(typeof firstCallProps.showGreenCorner).toBe('function');
  // });
  //
  // it('correctly handles missing URL in productURLs', () => {
  //   // Modify the mock to remove a URL
  //   const modifiedProductURLs = [
  //     {id: 'openshift-console', url: 'https://console.example.com'},
  //   ];
  //   (useProductURLs as jest.Mock).mockReturnValue(modifiedProductURLs);
  //
  //   renderGrid();
  //
  //   // For the second card, the URL should be an empty string
  //   const secondCallProps = (SandboxCatalogCard as jest.Mock).mock.calls[1][0];
  //   expect(secondCallProps.link).toBe('');
  // });
  //
  // it('calls setGreenCorners when showGreenCorner is triggered', () => {
  //   renderGrid();
  //
  //   // Extract the showGreenCorner function from the first card's props
  //   const firstCallProps = (SandboxCatalogCard as jest.Mock).mock.calls[0][0];
  //   const showGreenCornerFn = firstCallProps.showGreenCorner;
  //
  //   // Call the function
  //   showGreenCornerFn();
  //
  //   // Check that setGreenCorners was called with the correct updater function
  //   expect(mockSetGreenCorners).toHaveBeenCalled();
  //
  //   // Simulate the updater function that was passed to setGreenCorners
  //   const updaterFn = mockSetGreenCorners.mock.calls[0][0];
  //   const result = updaterFn(mockGreenCorners);
  //
  //   // Verify that only the correct item was updated
  //   expect(result).toEqual([
  //     {id: 'openshift-console', show: true}, // Changed to true
  //     {id: 'openshift-ai', show: true}, // Already true, unchanged
  //   ]);
  // });
});
