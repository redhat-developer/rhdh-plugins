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
import { SandboxCatalogGrid } from '../SandboxCatalogGrid';
import { ThemeProvider } from '@mui/material/styles';
import { lightTheme } from '@backstage/theme';
import { wrapInTestApp } from '@backstage/test-utils';
import { SandboxCatalogCard } from '../SandboxCatalogCard';
import useGreenCorners from '../../../hooks/useGreenCorners';
import useProductURLs from '../../../hooks/useProductURLs';
import { productData } from '../productData';

// Mock the hooks
jest.mock('../../../hooks/useGreenCorners');
jest.mock('../../../hooks/useProductURLs');

// Mock the SandboxCatalogCard component
jest.mock('../SandboxCatalogCard', () => ({
  SandboxCatalogCard: jest.fn(() => <div data-testid="catalog-card" />),
}));

// Mock the productData
jest.mock('../productData', () => ({
  Product: {
    OPENSHIFT_CONSOLE: 'openshift-console',
    OPENSHIFT_AI: 'openshift-ai',
    DEVSPACES: 'devspaces',
    AAP: 'aap',
    OPENSHIFT_VIRT: 'openshift-virt',
  },
  productData: [
    {
      id: 'openshift-console',
      title: 'OpenShift',
      image: 'openshift-image.svg',
      description: [
        { icon: <div>icon</div>, value: 'Description 1' },
        { icon: <div>icon</div>, value: 'Description 2' },
      ],
    },
    {
      id: 'openshift-ai',
      title: 'OpenShift AI',
      image: 'openshift-ai-image.svg',
      description: [
        { icon: <div>icon</div>, value: 'Description 1' },
        { icon: <div>icon</div>, value: 'Description 2' },
      ],
    },
  ],
}));

describe('SandboxCatalogGrid', () => {
  const mockSetGreenCorners = jest.fn();
  const mockGreenCorners = [
    { id: 'openshift-console', show: false },
    { id: 'openshift-ai', show: true },
  ];

  const mockProductURLs = [
    { id: 'openshift-console', url: 'https://console.example.com' },
    { id: 'openshift-ai', url: 'https://ai.example.com' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock return values for hooks
    (useGreenCorners as jest.Mock).mockReturnValue({
      greenCorners: mockGreenCorners,
      setGreenCorners: mockSetGreenCorners,
    });

    (useProductURLs as jest.Mock).mockReturnValue(mockProductURLs);
  });

  const renderGrid = () => {
    return render(
      wrapInTestApp(
        <ThemeProvider theme={lightTheme}>
          <SandboxCatalogGrid />
        </ThemeProvider>,
      ),
    );
  };

  it('renders the correct number of catalog cards based on productData', () => {
    renderGrid();

    // Should render one card per product in productData
    const cards = screen.getAllByTestId('catalog-card');
    expect(cards).toHaveLength(productData.length);
  });

  it('calls useGreenCorners hook with productData', () => {
    renderGrid();
    expect(useGreenCorners).toHaveBeenCalledWith(productData);
  });

  it('calls useProductURLs hook', () => {
    renderGrid();
    expect(useProductURLs).toHaveBeenCalled();
  });

  it('passes correct props to SandboxCatalogCard components', () => {
    renderGrid();

    expect(SandboxCatalogCard).toHaveBeenCalledTimes(productData.length);

    // Check props for the first card
    const firstCallProps = (SandboxCatalogCard as jest.Mock).mock.calls[0][0];
    expect(firstCallProps.id).toBe(productData[0].id);
    expect(firstCallProps.title).toBe(productData[0].title);
    expect(firstCallProps.image).toBe(productData[0].image);
    expect(firstCallProps.description).toBe(productData[0].description);
    expect(firstCallProps.link).toBe(mockProductURLs[0].url);
    expect(firstCallProps.greenCorner).toBe(false); // From mockGreenCorners
    expect(typeof firstCallProps.showGreenCorner).toBe('function');
  });

  it('correctly handles missing URL in productURLs', () => {
    // Modify the mock to remove a URL
    const modifiedProductURLs = [
      { id: 'openshift-console', url: 'https://console.example.com' },
    ];
    (useProductURLs as jest.Mock).mockReturnValue(modifiedProductURLs);

    renderGrid();

    // For the second card, the URL should be an empty string
    const secondCallProps = (SandboxCatalogCard as jest.Mock).mock.calls[1][0];
    expect(secondCallProps.link).toBe('');
  });

  it('calls setGreenCorners when showGreenCorner is triggered', () => {
    renderGrid();

    // Extract the showGreenCorner function from the first card's props
    const firstCallProps = (SandboxCatalogCard as jest.Mock).mock.calls[0][0];
    const showGreenCornerFn = firstCallProps.showGreenCorner;

    // Call the function
    showGreenCornerFn();

    // Check that setGreenCorners was called with the correct updater function
    expect(mockSetGreenCorners).toHaveBeenCalled();

    // Simulate the updater function that was passed to setGreenCorners
    const updaterFn = mockSetGreenCorners.mock.calls[0][0];
    const result = updaterFn(mockGreenCorners);

    // Verify that only the correct item was updated
    expect(result).toEqual([
      { id: 'openshift-console', show: true }, // Changed to true
      { id: 'openshift-ai', show: true }, // Already true, unchanged
    ]);
  });
});
