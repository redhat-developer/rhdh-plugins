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

import { createContext, useCallback, useContext, useMemo, useRef } from 'react';
import type { AdminPanel } from '../../../hooks';

export interface TourControllerAPI {
  navigatePanel: (panel: AdminPanel) => void;
  openAgentIntent: () => void;
  selectAgentIntent: (cardId: string) => void;
  openToolIntent: () => void;
  selectToolDeploy: () => void;
  closeAllDialogs: () => void;
  setWizardStep: (step: number) => void;
  setDeployMethod: (method: string) => void;
  returnToGuidedExperience: () => void;
  waitForSelector: (
    selector: string,
    timeoutMs?: number,
  ) => Promise<Element | null>;
}

const noop = () => {};
const noopAsync = () => Promise.resolve(null as Element | null);

const TourControllerContext = createContext<TourControllerAPI>({
  navigatePanel: noop,
  openAgentIntent: noop,
  selectAgentIntent: noop,
  openToolIntent: noop,
  selectToolDeploy: noop,
  closeAllDialogs: noop,
  setWizardStep: noop,
  setDeployMethod: noop,
  returnToGuidedExperience: noop,
  waitForSelector: noopAsync,
});

export function useTourController() {
  return useContext(TourControllerContext);
}

export interface TourControllerCallbacks {
  navigatePanel: (panel: AdminPanel) => void;
  openAgentIntent: () => void;
  selectAgentIntent: (cardId: string) => void;
  openToolIntent: () => void;
  selectToolDeploy: () => void;
  closeAllDialogs: () => void;
  setWizardStep: (step: number) => void;
  setDeployMethod: (method: string) => void;
  returnToGuidedExperience: () => void;
}

interface Props {
  callbacks: TourControllerCallbacks;
  children: React.ReactNode;
}

const DEFAULT_TIMEOUT = 3000;
const POLL_INTERVAL = 80;

function waitForSelectorImpl(
  selector: string,
  timeoutMs: number = DEFAULT_TIMEOUT,
): Promise<Element | null> {
  const el = document.querySelector(selector);
  if (el) return Promise.resolve(el);

  return new Promise(resolve => {
    const start = Date.now();
    const timer = setInterval(() => {
      const found = document.querySelector(selector);
      if (found) {
        clearInterval(timer);
        resolve(found);
      } else if (Date.now() - start >= timeoutMs) {
        clearInterval(timer);
        resolve(null);
      }
    }, POLL_INTERVAL);
  });
}

export function TourControllerProvider({ callbacks, children }: Props) {
  const cbRef = useRef(callbacks);
  cbRef.current = callbacks;

  const navigatePanel = useCallback(
    (panel: AdminPanel) => cbRef.current.navigatePanel(panel),
    [],
  );
  const openAgentIntent = useCallback(
    () => cbRef.current.openAgentIntent(),
    [],
  );
  const selectAgentIntent = useCallback(
    (cardId: string) => cbRef.current.selectAgentIntent(cardId),
    [],
  );
  const openToolIntent = useCallback(
    () => cbRef.current.openToolIntent(),
    [],
  );
  const selectToolDeploy = useCallback(
    () => cbRef.current.selectToolDeploy(),
    [],
  );
  const closeAllDialogs = useCallback(
    () => cbRef.current.closeAllDialogs(),
    [],
  );
  const setWizardStep = useCallback(
    (step: number) => cbRef.current.setWizardStep(step),
    [],
  );
  const setDeployMethod = useCallback(
    (method: string) => cbRef.current.setDeployMethod(method),
    [],
  );
  const returnToGuidedExperience = useCallback(
    () => cbRef.current.returnToGuidedExperience(),
    [],
  );
  const waitForSelector = useCallback(
    (selector: string, timeoutMs?: number) =>
      waitForSelectorImpl(selector, timeoutMs),
    [],
  );

  const value = useMemo<TourControllerAPI>(
    () => ({
      navigatePanel,
      openAgentIntent,
      selectAgentIntent,
      openToolIntent,
      selectToolDeploy,
      closeAllDialogs,
      setWizardStep,
      setDeployMethod,
      returnToGuidedExperience,
      waitForSelector,
    }),
    [
      navigatePanel,
      openAgentIntent,
      selectAgentIntent,
      openToolIntent,
      selectToolDeploy,
      closeAllDialogs,
      setWizardStep,
      setDeployMethod,
      returnToGuidedExperience,
      waitForSelector,
    ],
  );

  return (
    <TourControllerContext.Provider value={value}>
      {children}
    </TourControllerContext.Provider>
  );
}
