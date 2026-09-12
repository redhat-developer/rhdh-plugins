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

import type { Entity } from '@backstage/catalog-model';
import {
  Button,
  Dialog,
  DialogBody,
  DialogHeader,
  DialogTrigger,
} from '@backstage/ui';
import { RiFilter3Line } from '@remixicon/react';

import type { FilterDefinition } from '../../blueprints/AiCatalogFilterBlueprint';
import { useTranslation } from '../../hooks/useTranslation';
import { FilterSidebar } from './FilterSidebar';
import styles from './FilterDrawer.module.css';

interface FilterDrawerProps {
  filters: FilterDefinition[];
  entities: Entity[];
  values: Map<string, string[]>;
  onFilterChange: (urlParam: string, values: string[]) => void;
}

export const FilterDrawer = ({
  filters,
  entities,
  values,
  onFilterChange,
}: FilterDrawerProps) => {
  const { t } = useTranslation();

  if (filters.length === 0) return null;

  return (
    <DialogTrigger>
      <Button
        variant="secondary"
        size="small"
        iconStart={<RiFilter3Line size={16} />}
      >
        {t('catalog.toolbar.filters')}
      </Button>
      <Dialog className={styles.drawer} height="100vh">
        <DialogHeader>{t('catalog.filter.title')}</DialogHeader>
        <DialogBody>
          <FilterSidebar
            filters={filters}
            entities={entities}
            values={values}
            onFilterChange={onFilterChange}
          />
        </DialogBody>
      </Dialog>
    </DialogTrigger>
  );
};
