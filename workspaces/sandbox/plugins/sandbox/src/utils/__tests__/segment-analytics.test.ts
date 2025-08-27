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

// Mock crypto.subtle for SHA1 hashing
const mockCryptoDigest = jest.fn();
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      digest: mockCryptoDigest,
    },
  },
});

// Mock TextEncoder for SHA1 hashing
Object.defineProperty(global, 'TextEncoder', {
  value: class TextEncoder {
    encode(input: string) {
      return new Uint8Array(Buffer.from(input, 'utf8'));
    }
  },
});

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

    // Mock crypto.subtle.digest to return a consistent hash
    const mockHashBuffer = new Uint8Array([
      0xa1, 0xb2, 0xc3, 0xd4, 0xe5, 0xf6, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c,
      0x0d, 0x0e, 0x0f, 0x10, 0x11, 0x12, 0x13, 0x14,
    ]);
    mockCryptoDigest.mockResolvedValue(mockHashBuffer.buffer);

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
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

  it('should track events with correct data structure (no userId)', async () => {
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

  it('should track events with userId when compliantUsername is provided', async () => {
    const { result } = renderHook(() =>
      useSegmentAnalytics('test-write-key', 'testuser123'),
    );

    await act(async () => {
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.trackClick({
        itemName: 'OpenShift',
        section: 'Catalog',
        href: 'https://console.example.com',
        linkType: 'cta',
        internalCampaign: '701Pe00000dnCEYIA2',
      });
      // Wait for async SHA1 hashing to complete
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Verify SHA1 hashing was called
    expect(mockCryptoDigest).toHaveBeenCalledWith(
      'SHA-1',
      expect.any(Uint8Array),
    );

    // Verify track was called with correct event name, payload, and userId
    expect(mockAnalytics.track).toHaveBeenCalledWith(
      'OpenShift',
      {
        category: 'Developer Sandbox|Catalog',
        regions: 'sandbox-catalog',
        text: 'OpenShift',
        href: 'https://console.example.com',
        linkType: 'cta',
        internalCampaign: '701Pe00000dnCEYIA2',
      },
      {
        userId: 'a1b2c3d4e5f60708090a0b0c0d0e0f1011121314',
      },
    );
  });

  it('should handle events without optional properties', async () => {
    const { result } = renderHook(() =>
      useSegmentAnalytics('test-write-key', 'user789'),
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.trackClick({
        itemName: 'Simple Click',
        section: 'Support',
      });
      // Wait for async SHA1 hashing to complete
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockAnalytics.track).toHaveBeenCalledWith(
      'Simple Click',
      {
        category: 'Developer Sandbox|Support',
        regions: 'sandbox-support',
        text: 'Simple Click',
        href: undefined,
        linkType: 'default',
      },
      {
        userId: 'a1b2c3d4e5f60708090a0b0c0d0e0f1011121314',
      },
    );
  });

  it('should not track when analytics is not initialized', async () => {
    // Mock AnalyticsBrowser.load to return null (initialization fails)
    (AnalyticsBrowser.load as jest.Mock).mockReturnValue(null);

    const { result } = renderHook(() =>
      useSegmentAnalytics('test-write-key', 'user123'),
    );

    await act(async () => {
      // Wait for failed initialization
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.trackClick({
        itemName: 'Test Event',
        section: 'Catalog',
      });
    });

    expect(mockAnalytics.track).not.toHaveBeenCalled();

    // Reset the mock for other tests
    (AnalyticsBrowser.load as jest.Mock).mockReturnValue(mockAnalytics);
  });

  it('should handle SHA1 hashing errors gracefully', async () => {
    // Mock crypto.subtle.digest to throw an error
    mockCryptoDigest.mockRejectedValue(new Error('Hashing failed'));

    const { result } = renderHook(() =>
      useSegmentAnalytics('test-write-key', 'user123'),
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.trackClick({
        itemName: 'Test Event',
        section: 'Catalog',
      });
      // Wait for async hashing error to be handled
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Should not track due to hashing error
    expect(mockAnalytics.track).not.toHaveBeenCalled();
  });

  it('should generate consistent SHA1 hash for same input', async () => {
    const { result } = renderHook(() =>
      useSegmentAnalytics('test-write-key', 'consistent-user'),
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Track multiple events with same user
    await act(async () => {
      await result.current.trackClick({
        itemName: 'Event 1',
        section: 'Catalog',
      });
      // Wait for async SHA1 hashing to complete
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.trackClick({
        itemName: 'Event 2',
        section: 'Activities',
      });
      // Wait for async SHA1 hashing to complete
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Both calls should have same userId
    expect(mockAnalytics.track).toHaveBeenCalledTimes(2);

    const firstCall = mockAnalytics.track.mock.calls[0];
    const secondCall = mockAnalytics.track.mock.calls[1];

    expect(firstCall[2]?.userId).toBe(
      'a1b2c3d4e5f60708090a0b0c0d0e0f1011121314',
    );
    expect(secondCall[2]?.userId).toBe(
      'a1b2c3d4e5f60708090a0b0c0d0e0f1011121314',
    );
  });
});
