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

import { useState, useEffect } from 'react';
import { useApi } from '@backstage/core-plugin-api';
import { augmentApiRef } from '../api';
import {
  DEFAULT_TOURS,
  type TourDefinition,
} from '../components/AdminPanels/shared/defaultTours';

/**
 * Loads tours from the backend (YAML config) with fallback to built-in defaults.
 * When YAML tours are configured, they fully replace the defaults.
 */
export function useTours() {
  const api = useApi(augmentApiRef);
  const [tours, setTours] = useState<TourDefinition[]>(DEFAULT_TOURS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .getTours()
      .then(result => {
        if (!cancelled) {
          setTours(result.length > 0 ? result : DEFAULT_TOURS);
        }
      })
      .catch(() => {
        if (!cancelled) setTours(DEFAULT_TOURS);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api]);

  return { tours, loading };
}
