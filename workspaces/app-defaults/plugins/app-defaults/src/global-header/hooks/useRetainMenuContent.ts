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

import { useLayoutEffect, useState } from 'react';

/**
 * Keeps dropdown menu content mounted until MUI's close transition finishes.
 *
 * Without this, clearing children when `anchorEl` becomes null leaves an empty
 * menu paper visible during the exit animation (`minWidth: 160px`).
 */
export function useRetainMenuContent(isMenuOpen: boolean) {
  const [retainContent, setRetainContent] = useState(false);

  useLayoutEffect(() => {
    if (isMenuOpen) {
      setRetainContent(true);
    }
  }, [isMenuOpen]);

  const handleMenuTransitionExited = () => {
    setRetainContent(false);
  };

  return {
    shouldRenderMenuContent: retainContent,
    handleMenuTransitionExited,
  };
}
