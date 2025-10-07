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

import { renderHook } from '@testing-library/react';
import { ScalprumContext } from '@scalprum/react-core';
import { PluginStore } from '@openshift/dynamic-plugin-sdk';
import { createElement, type ReactNode } from 'react';
import { useDynamicHomePageCards } from './useDynamicHomePageCards';
import { HomePageCardMountPoint } from '../types';

// Mock component for testing
const MockComponent = () => {
  return createElement('div', null, 'Mock Component');
};

describe('useDynamicHomePageCards', () => {
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

  const additionalCards: HomePageCardMountPoint[] = [
    {
      Component: MockComponent,
      config: {
        layouts: {
          xl: { w: 6, h: 2 },
          lg: { w: 6, h: 2 },
          md: { w: 6, h: 2 },
          sm: { w: 6, h: 2 },
          xs: { w: 6, h: 2 },
          xxs: { w: 6, h: 2 },
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

    expect(result.current.defaultCards).toEqual([]);
    expect(result.current.additionalCards).toEqual([]);
    expect(result.current.allCards).toEqual([]);
  });

  it('should return default cards only when no additional cards are provided', () => {
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

    expect(result.current.defaultCards).toEqual(defaultCards);
    expect(result.current.additionalCards).toEqual([]);
    expect(result.current.allCards).toEqual(defaultCards);
  });

  it('should return both default and additional cards', () => {
    const scalprumState = {
      initialized: true,
      config: {},
      pluginStore: new PluginStore(),
      api: {
        dynamicRootConfig: {
          mountPoints: {
            'home.page/cards': defaultCards,
            'home.page/widgets': additionalCards,
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

    expect(result.current.defaultCards).toEqual(defaultCards);
    expect(result.current.additionalCards).toEqual(additionalCards);
    expect(result.current.allCards).toEqual([
      ...defaultCards,
      ...additionalCards,
    ]);
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

    expect(result.current.defaultCards).toEqual([]);
    expect(result.current.additionalCards).toEqual([]);
    expect(result.current.allCards).toEqual([]);
  });
});
