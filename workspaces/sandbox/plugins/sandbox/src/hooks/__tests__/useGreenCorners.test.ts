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
import { renderHook, act } from '@testing-library/react';
import useGreenCorners from '../useGreenCorners';
import { getCookie, setCookie } from '../../utils/cookie-utils';
import { Product } from '../../components/SandboxCatalog/productData';

// Mock the cookie utilities
jest.mock('../../utils/cookie-utils', () => ({
  getCookie: jest.fn(),
  setCookie: jest.fn(),
}));

describe('useGreenCorners', () => {
  const mockProductData = [
    {
      id: 'openshift-console' as Product,
      title: 'OpenShift',
      image: 'openshift-image.svg',
      description: [],
    },
    {
      id: 'openshift-ai' as Product,
      title: 'OpenShift AI',
      image: 'openshift-ai-image.svg',
      description: [],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with empty green corners when cookie is empty', () => {
    (getCookie as jest.Mock).mockReturnValue(undefined);

    const { result } = renderHook(() => useGreenCorners(mockProductData));

    expect(result.current.greenCorners).toEqual([
      { id: 'openshift-console', show: false },
      { id: 'openshift-ai', show: false },
    ]);
    expect(getCookie).toHaveBeenCalledWith('triedProducts');
  });

  it('initializes with existing green corners from cookie', () => {
    (getCookie as jest.Mock).mockReturnValue('openshift-console');

    const { result } = renderHook(() => useGreenCorners(mockProductData));

    expect(result.current.greenCorners).toEqual([
      { id: 'openshift-console' as Product, show: true },
      { id: 'openshift-ai', show: false },
    ]);
  });

  it('updates the cookie when greenCorners state changes', () => {
    (getCookie as jest.Mock).mockReturnValue('');

    const { result } = renderHook(() => useGreenCorners(mockProductData));

    // Initial update with empty state
    expect(setCookie).toHaveBeenCalledWith('triedProducts', '');

    // Update the state
    act(() => {
      result.current.setGreenCorners(prev =>
        prev.map(gc =>
          gc.id === 'openshift-console' ? { ...gc, show: true } : gc,
        ),
      );
    });

    // Check cookie was updated with the new state
    expect(setCookie).toHaveBeenCalledWith(
      'triedProducts',
      'openshift-console',
    );
  });

  it('handles multiple products in the cookie', () => {
    (getCookie as jest.Mock).mockReturnValue('openshift-console,openshift-ai');

    const { result } = renderHook(() => useGreenCorners(mockProductData));

    expect(result.current.greenCorners).toEqual([
      { id: 'openshift-console', show: true },
      { id: 'openshift-ai', show: true },
    ]);
  });

  it('correctly updates state when toggling multiple items', () => {
    (getCookie as jest.Mock).mockReturnValue('');

    const { result } = renderHook(() => useGreenCorners(mockProductData));

    // Update multiple items
    act(() => {
      result.current.setGreenCorners([
        { id: 'openshift-console' as Product, show: true },
        { id: 'openshift-ai' as Product, show: true },
      ]);
    });

    // Check cookie was updated with both items
    expect(setCookie).toHaveBeenCalledWith(
      'triedProducts',
      'openshift-console,openshift-ai',
    );
  });

  it('reinitializes when product data changes', () => {
    (getCookie as jest.Mock).mockReturnValue('openshift-console');

    const { result, rerender } = renderHook(props => useGreenCorners(props), {
      initialProps: mockProductData,
    });

    // First render with initial product data
    expect(result.current.greenCorners).toEqual([
      { id: 'openshift-console', show: true },
      { id: 'openshift-ai', show: false },
    ]);

    // Add a new product to the product data
    const updatedProductData = [
      ...mockProductData,
      {
        id: 'devspaces' as Product,
        title: 'Dev Spaces',
        image: 'devspaces-image.svg',
        description: [],
      },
    ];

    // Re-render with updated product data
    rerender(updatedProductData);

    // Check if state was reinitialized with the new product data
    expect(result.current.greenCorners).toEqual([
      { id: 'openshift-console', show: true },
      { id: 'openshift-ai', show: false },
      { id: 'devspaces', show: false },
    ]);
  });
});
