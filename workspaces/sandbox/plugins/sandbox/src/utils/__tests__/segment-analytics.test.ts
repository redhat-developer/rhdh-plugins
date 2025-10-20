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

    expect(mockAnalytics.track).toHaveBeenCalledWith('Test Item launched', {
      category: 'Developer Sandbox|Catalog',
      regions: 'sandbox-catalog',
      text: 'Test Item',
      href: 'https://example.com',
      linkType: 'cta',
    });
  });

  it('should track events with userID when provided via user object', async () => {
    const track = jest.fn();
    (AnalyticsBrowser.load as jest.Mock).mockReturnValue({ track });

    const user = { userID: 'uid-123' } as any;
    const { result } = renderHook(() =>
      useSegmentAnalytics('test-write-key', user),
    );

    await act(async () => {
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
    });

    expect(track).toHaveBeenCalledWith('OpenShift launched', {
      category: 'Developer Sandbox|Catalog',
      regions: 'sandbox-catalog',
      text: 'OpenShift',
      href: 'https://console.example.com',
      linkType: 'cta',
      internalCampaign: '701Pe00000dnCEYIA2',
    });
  });

  it('should handle events without optional properties and without userID', async () => {
    const { result } = renderHook(() => useSegmentAnalytics('test-write-key'));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.trackClick({
        itemName: 'Simple Click',
        section: 'Support',
      });
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockAnalytics.track).toHaveBeenCalledWith('Simple Click clicked', {
      category: 'Developer Sandbox|Support',
      regions: 'sandbox-support',
      text: 'Simple Click',
      href: undefined,
      linkType: 'default',
    });
  });

  it('should not track when analytics is not initialized', async () => {
    // Mock AnalyticsBrowser.load to return null (initialization fails)
    (AnalyticsBrowser.load as jest.Mock).mockReturnValue(null);

    const { result } = renderHook(() => useSegmentAnalytics('test-write-key'));

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

  it('should call identify once when user data with userID is provided', async () => {
    const identify = jest.fn();
    const group = jest.fn();
    const track = jest.fn();
    (AnalyticsBrowser.load as jest.Mock).mockReturnValue({
      identify,
      group,
      track,
    });

    const user = {
      name: 'Test User',
      compliantUsername: 'testuser',
      username: 'testuser',
      givenName: 'Test',
      familyName: 'User',
      company: 'Test Co',
      userID: 'uid-1',
    } as any;

    const { rerender } = renderHook(
      ({ u }) => useSegmentAnalytics('key', u as any),
      { initialProps: { u: undefined as any } },
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(identify).not.toHaveBeenCalled();

    rerender({ u: user });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(identify).toHaveBeenCalledTimes(1);
    expect(identify).toHaveBeenCalledWith('uid-1', {
      company: 'Test Co',
    });

    // Rerender with same user should not call identify again
    rerender({ u: user });
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    expect(identify).toHaveBeenCalledTimes(1);
  });

  it('should call identify with email_domain when email is provided', async () => {
    const identify = jest.fn();
    const group = jest.fn();
    const track = jest.fn();
    (AnalyticsBrowser.load as jest.Mock).mockReturnValue({
      identify,
      group,
      track,
    });

    const user = {
      name: 'Test User',
      compliantUsername: 'testuser',
      username: 'testuser',
      givenName: 'Test',
      familyName: 'User',
      company: 'Test Co',
      email: 'testuser@example.com',
      userID: 'uid-1',
    } as any;

    const { rerender } = renderHook(
      ({ u }) => useSegmentAnalytics('key', u as any),
      { initialProps: { u: undefined as any } },
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    rerender({ u: user });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(identify).toHaveBeenCalledTimes(1);
    expect(identify).toHaveBeenCalledWith('uid-1', {
      company: 'Test Co',
      email_domain: 'example.com',
    });
  });

  it('should not include email_domain when email is not provided', async () => {
    const identify = jest.fn();
    const group = jest.fn();
    const track = jest.fn();
    (AnalyticsBrowser.load as jest.Mock).mockReturnValue({
      identify,
      group,
      track,
    });

    const user = {
      name: 'Test User',
      compliantUsername: 'testuser',
      username: 'testuser',
      givenName: 'Test',
      familyName: 'User',
      company: 'Test Co',
      userID: 'uid-1',
    } as any;

    const { rerender } = renderHook(
      ({ u }) => useSegmentAnalytics('key', u as any),
      { initialProps: { u: undefined as any } },
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    rerender({ u: user });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(identify).toHaveBeenCalledTimes(1);
    expect(identify).toHaveBeenCalledWith('uid-1', {
      company: 'Test Co',
    });
  });

  it('should call group once with accountID and accountNumber trait when present', async () => {
    const identify = jest.fn();
    const group = jest.fn();
    const track = jest.fn();
    (AnalyticsBrowser.load as jest.Mock).mockReturnValue({
      identify,
      group,
      track,
    });

    const user = {
      name: 'Test User',
      compliantUsername: 'testuser',
      username: 'testuser',
      givenName: 'Test',
      familyName: 'User',
      company: 'Test Co',
      userID: 'uid-1',
      accountID: 'acc-2',
      accountNumber: '123456',
    } as any;

    const { rerender } = renderHook(
      ({ u }) => useSegmentAnalytics('key', u as any),
      { initialProps: { u: undefined as any } },
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    rerender({ u: user });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(group).toHaveBeenCalledTimes(1);
    expect(group).toHaveBeenCalledWith('acc-2', { ebs: '123456' });

    // Rerender with same user should not call group again
    rerender({ u: user });
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    expect(group).toHaveBeenCalledTimes(1);
  });
});
