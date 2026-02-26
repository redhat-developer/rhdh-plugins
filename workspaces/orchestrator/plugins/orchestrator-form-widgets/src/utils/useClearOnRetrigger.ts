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
import { useLayoutEffect, useRef } from 'react';
import isEqual from 'lodash/isEqual';

type UseClearOnRetriggerArgs = {
  enabled: boolean;
  retrigger: (string | undefined)[] | undefined;
  onClear: () => void;
};

export const useClearOnRetrigger = ({
  enabled,
  retrigger,
  onClear,
}: UseClearOnRetriggerArgs) => {
  const prevRetriggerRef = useRef<(string | undefined)[] | undefined>(
    retrigger,
  );

  useLayoutEffect(() => {
    if (!enabled) {
      prevRetriggerRef.current = retrigger;
      return;
    }

    if (!retrigger) {
      prevRetriggerRef.current = retrigger;
      return;
    }

    const prev = prevRetriggerRef.current;
    if (prev && !isEqual(prev, retrigger)) {
      onClear();
    }

    prevRetriggerRef.current = retrigger;
  }, [enabled, retrigger, onClear]);
};
