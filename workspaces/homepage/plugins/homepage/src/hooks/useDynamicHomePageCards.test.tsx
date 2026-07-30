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

import { createElement, type ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import { ScalprumContext } from '@scalprum/react-core';
import { PluginStore } from '@openshift/dynamic-plugin-sdk';

import { HomePageCardMountPoint } from '../types';
import { useDynamicHomePageCards } from './useDynamicHomePageCards';

// Mock component for testing
const MockComponent = () => {
  return createElement('div', null, 'Mock Component');
};

describe('useDynamicHomePageCards', () => {
  const availableCards: HomePageCardMountPoint[] = [
    {
      Component: MockComponent,
      config: {
        id: '',
        title: 'Available Card 1',
      },
    },
  ];

  const defaultCards: HomePageCardMountPoint[] = [
    {
      Component: MockComponent,
      config: {
        layouts: {
          xl: { w: 12, h: 4 },
          lg: { w: 12, h: 4 },
          md: { w: 12, h: 4 },
          sm: { w: 12, h: 4 },
          xs: { w: 12, h: 4 },
          xxs: { w: 12, h: 4 },
        },
      },
    },
    {
      Component: MockComponent,
      config: {
        layouts: {
          xl: { w: 6, h: 3 },
          lg: { w: 6, h: 3 },
          md: { w: 6, h: 3 },
          sm: { w: 6, h: 3 },
          xs: { w: 6, h: 3 },
          xxs: { w: 6, h: 3 },
        },
      },
    },
  ];

  it('should return empty arrays when no scalprum state is provided', () => {
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(
        ScalprumContext.Provider,
        {
          value: {
            initialized: false,
            config: {},
            pluginStore: new PluginStore(),
          },
        },
        children,
      );

    const { result } = renderHook(() => useDynamicHomePageCards(), { wrapper });

    expect(result.current).toEqual([]);
  });

  it('should return default cards only when no available cards are provided', () => {
    const scalprumState = {
      initialized: true,
      config: {},
      pluginStore: new PluginStore(),
      api: {
        dynamicRootConfig: {
          mountPoints: {
            'home.page/cards': defaultCards,
          },
        },
      },
    };

    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(
        ScalprumContext.Provider,
        { value: scalprumState },
        children,
      );

    const { result } = renderHook(() => useDynamicHomePageCards(), { wrapper });

    expect(result.current).toEqual(defaultCards);
  });

  it('should return both default and available cards', () => {
    const scalprumState = {
      initialized: true,
      config: {},
      pluginStore: new PluginStore(),
      api: {
        dynamicRootConfig: {
          mountPoints: {
            'home.page/cards': defaultCards,
            'home.page/widgets': availableCards,
          },
        },
      },
    };

    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(
        ScalprumContext.Provider,
        { value: scalprumState },
        children,
      );

    const { result } = renderHook(() => useDynamicHomePageCards(), { wrapper });

    expect(result.current).toEqual(defaultCards);
  });

  it('should handle non-array mount points gracefully', () => {
    const scalprumState = {
      initialized: true,
      config: {},
      pluginStore: new PluginStore(),
      api: {
        dynamicRootConfig: {
          mountPoints: {
            'home.page/cards': null as any,
            'home.page/widgets': undefined as any,
          },
        },
      },
    };

    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(
        ScalprumContext.Provider,
        { value: scalprumState },
        children,
      );

    const { result } = renderHook(() => useDynamicHomePageCards(), { wrapper });

    expect(result.current).toEqual([]);
  });
});
