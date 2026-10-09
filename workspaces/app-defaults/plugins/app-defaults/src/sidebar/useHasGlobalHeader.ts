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

import { useEffect, useState } from 'react';

const GLOBAL_HEADER_ID = 'global-header';

/**
 * True when the global-header masthead is present in the document.
 * Observes DOM mutations so a late-mounted header is detected.
 */
export function useHasGlobalHeader(): boolean {
  const [hasGlobalHeader, setHasGlobalHeader] = useState(() =>
    typeof document !== 'undefined'
      ? Boolean(document.getElementById(GLOBAL_HEADER_ID))
      : false,
  );

  useEffect(() => {
    const update = () => {
      setHasGlobalHeader(Boolean(document.getElementById(GLOBAL_HEADER_ID)));
    };
    update();

    const observer = new MutationObserver(update);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return hasGlobalHeader;
}
