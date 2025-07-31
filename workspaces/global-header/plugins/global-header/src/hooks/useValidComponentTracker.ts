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

import { useState, useEffect, useCallback } from 'react';

export const useValidComponentTracker = (totalComponents: number) => {
  const [validComponents, setValidComponents] = useState<Set<string>>(
    new Set(),
  );
  const [checkedComponents, setCheckedComponents] = useState<Set<string>>(
    new Set(),
  );

  // Reset when mount points change (user switch, permission changes)
  useEffect(() => {
    setValidComponents(new Set());
    setCheckedComponents(new Set());
  }, [totalComponents]);

  const updateComponentValidity = useCallback(
    (componentId: string, isValid: boolean) => {
      setValidComponents(prev => {
        const newSet = new Set(prev);
        if (isValid) {
          newSet.add(componentId);
        } else {
          newSet.delete(componentId);
        }
        return newSet;
      });

      setCheckedComponents(prev => new Set(prev).add(componentId));
    },
    [],
  );

  const allChecked = checkedComponents.size >= totalComponents;
  const hasValidComponents = validComponents.size > 0;
  const shouldShowEmpty = allChecked && !hasValidComponents;

  return {
    shouldShowEmpty,
    updateComponentValidity,
  };
};
