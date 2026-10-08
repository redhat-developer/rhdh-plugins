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

import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from 'react';

export type WizardState<T extends Record<string, boolean>> = {
  activeTab: number;
  setActiveTab: Dispatch<SetStateAction<number>>;
  finalSubmitAttempted: boolean;
  touched: Partial<T>;
  setTouched: Dispatch<SetStateAction<Partial<T>>>;
  /** True when the tab at `tabIndex` should display validation errors. */
  tabSubmitAttempted: (tabIndex: number) => boolean;
  /**
   * Pass to `VerticalTabDialog.onBeforeNext`. Marks the current tab as
   * attempted and returns `true` only when it is currently valid.
   */
  handleBeforeNext: (currentTab: number) => boolean;
  /** Call from the dialog's own Close handler. Resets state then calls `onClose`. */
  handleClose: (onClose: () => void) => void;
  /**
   * Call from the dialog's submit button. Sets `finalSubmitAttempted` to
   * `true`; the caller is responsible for checking form validity and calling
   * the real submit action.
   */
  markFinalSubmit: () => void;
};

/**
 * Encapsulates the tab-wizard validation state that is identical across
 * `CatalogItemWizardDialog` and `InstanceWizardDialog`:
 *
 * - Which tabs have been "attempted" (Next clicked) so validation errors show.
 * - Whether the final Submit has been attempted (all tabs show errors).
 * - A generic `touched` map for scalar form fields on the first tab.
 * - An open-reset effect that clears all state when the dialog re-opens.
 *
 * @param open - The `open` prop passed to the dialog.
 * @param isTabValid - Callback that returns `true` when the given tab index
 *   has no validation errors. Called inside `handleBeforeNext`.
 */
export function useWizardState<T extends Record<string, boolean>>(
  open: boolean,
  isTabValid: (tabIndex: number) => boolean,
): WizardState<T> {
  const [activeTab, setActiveTab] = useState(0);
  const [tabsAttempted, setTabsAttempted] = useState<Set<number>>(new Set());
  const [finalSubmitAttempted, setFinalSubmitAttempted] = useState(false);
  const [touched, setTouched] = useState<Partial<T>>({});

  useEffect(() => {
    if (open) {
      setActiveTab(0);
      setTabsAttempted(new Set());
      setFinalSubmitAttempted(false);
      setTouched({});
    }
  }, [open]);

  const tabSubmitAttempted = useCallback(
    (tabIndex: number) => finalSubmitAttempted || tabsAttempted.has(tabIndex),
    [finalSubmitAttempted, tabsAttempted],
  );

  const handleBeforeNext = useCallback(
    (currentTab: number): boolean => {
      setTabsAttempted(prev => new Set([...prev, currentTab]));
      return isTabValid(currentTab);
    },
    [isTabValid],
  );

  const handleClose = useCallback((onClose: () => void) => {
    setActiveTab(0);
    setTabsAttempted(new Set());
    setFinalSubmitAttempted(false);
    setTouched({});
    onClose();
  }, []);

  const markFinalSubmit = useCallback(() => {
    setFinalSubmitAttempted(true);
  }, []);

  return {
    activeTab,
    setActiveTab,
    finalSubmitAttempted,
    touched,
    setTouched,
    tabSubmitAttempted,
    handleBeforeNext,
    handleClose,
    markFinalSubmit,
  };
}
