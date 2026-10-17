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

import type { FC } from 'react';

import { Entity } from '@backstage/catalog-model';
import { useTranslationRef } from '@backstage/frontend-plugin-api';
import {
  catalogReactTranslationRef,
  EntityAutocompletePicker,
} from '@backstage/plugin-catalog-react';

// Custom EntityTagFilter with OR logic instead of AND logic
export class CustomEntityTagFilter {
  readonly values: string[];

  constructor(values: string[]) {
    this.values = values;
  }

  filterEntity(entity: Entity): boolean {
    if (!this.values.length) {
      return true;
    }

    const tags = entity.metadata?.tags || [];
    if (!tags.length) {
      return false;
    }

    // OR logic: return true if entity has ANY of the selected tags
    return this.values.some(value => tags.includes(value));
  }

  toQueryValue(): string[] {
    return this.values;
  }

  getCatalogFilters(): Record<string, string | string[]> {
    return {
      'metadata.tags': this.values,
    };
  }
}

interface CustomEntityTagPickerProps {
  showCounts?: boolean;
  initialFilter?: string[];
}

/**
 * Custom Entity Tag Picker with OR logic for multiple tag selections
 * Uses the same EntityAutocompletePicker as the original but with custom filter logic
 */
export const CustomEntityTagPicker: FC<CustomEntityTagPickerProps> = ({
  showCounts = false,
  initialFilter = [],
}) => {
  const { t } = useTranslationRef(catalogReactTranslationRef);

  return (
    <EntityAutocompletePicker
      label={t('entityTagPicker.title')}
      name="tags"
      path="metadata.tags"
      Filter={CustomEntityTagFilter}
      showCounts={showCounts}
      initialSelectedOptions={initialFilter}
    />
  );
};
