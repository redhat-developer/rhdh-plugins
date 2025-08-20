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

import { useSegmentAnalytics } from '../segment-analytics';
import { AnalyticsBrowser } from '@segment/analytics-next';
import { renderHook, act } from '@testing-library/react';

// Mock the Segment library
jest.mock('@segment/analytics-next');

describe('useSegmentAnalytics Hook', () => {
  let mockAnalytics: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAnalytics = {
      track: jest.fn(),
    };
    (AnalyticsBrowser.load as jest.Mock).mockReturnValue(mockAnalytics);

    // Mock console methods
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should initialize when writeKey is provided', async () => {
    const { result } = renderHook(() => useSegmentAnalytics('test-write-key'));

    await act(async () => {
      // Wait for the effect to run
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(AnalyticsBrowser.load).toHaveBeenCalledWith({
      writeKey: 'test-write-key',
    });
    expect(result.current.isInitialized).toBe(true);
    expect(result.current.isReady).toBe(true);
    expect(result.current.initializationError).toBe(null);
  });

  it('should not initialize when writeKey is not provided', () => {
    const { result } = renderHook(() => useSegmentAnalytics());

    expect(AnalyticsBrowser.load).not.toHaveBeenCalled();
    expect(result.current.isInitialized).toBe(false);
    expect(result.current.isReady).toBe(false);
  });

  it('should handle initialization errors', async () => {
    const error = new Error('Initialization failed');
    (AnalyticsBrowser.load as jest.Mock).mockImplementation(() => {
      throw error;
    });

    const { result } = renderHook(() => useSegmentAnalytics('test-write-key'));

    await act(async () => {
      // Wait for the effect to run
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isInitialized).toBe(false);
    expect(result.current.isReady).toBe(false);
    expect(result.current.initializationError).toBe('Initialization failed');
  });

  it('should track events with correct data structure', async () => {
    const { result } = renderHook(() => useSegmentAnalytics('test-write-key'));

    await act(async () => {
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.trackClick({
        itemName: 'Test Item',
        section: 'Catalog',
        href: 'https://example.com',
        linkType: 'cta',
      });
    });

    expect(mockAnalytics.track).toHaveBeenCalledWith('Test Item', {
      category: 'Developer Sandbox|Catalog',
      regions: 'sandbox-catalog',
      text: 'Test Item',
      href: 'https://example.com',
      linkType: 'cta',
    });
  });
});
