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

import { useCallback, useEffect, useState } from 'react';
import type { MouseEvent } from 'react';
import { useLocation } from 'react-router-dom';

export const useDropdownManager = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const location = useLocation();

  const handleOpen = useCallback((event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  // Close the dropdown on any route change — acts as a safety net when
  // a Link-based MenuItem navigates before the Menu transition completes.
  useEffect(() => {
    setAnchorEl(null);
  }, [location.pathname]);

  return {
    anchorEl,
    open: !!anchorEl,
    handleOpen,
    handleClose,
  };
};
