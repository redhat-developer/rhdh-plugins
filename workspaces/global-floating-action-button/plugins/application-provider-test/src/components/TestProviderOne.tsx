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

import { CountContextValue } from '../types';

export const TestContextOne = React.createContext<CountContextValue>(
  {} as CountContextValue,
);

export const TestProviderOne = ({ children }: React.PropsWithChildren<{}>) => {
  const [count, setCount] = React.useState(0);
  const increment = React.useCallback(() => setCount(c => c + 1), []);
  const decrement = React.useCallback(() => setCount(c => c - 1), []);
  const value = React.useMemo<CountContextValue>(
    () => ({
      count,
      increment,
      decrement,
    }),
    [count, increment, decrement],
  );
  return (
    <TestContextOne.Provider value={value}>{children}</TestContextOne.Provider>
  );
};
