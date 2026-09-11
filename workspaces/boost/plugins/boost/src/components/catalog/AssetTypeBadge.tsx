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
import { Badge } from '@backstage/ui';

import { getCategoryMeta } from '../../utils/categoryMeta';
import { getSpecField } from '../../utils/entityHelpers';
import styles from './AssetTypeBadge.module.css';

export const AssetTypeBadge = ({ entity }: { entity: Entity }) => {
  const specType = getSpecField(entity, 'type');
  const categoryMeta = getCategoryMeta(specType);
  const Icon = categoryMeta.icon;

  return (
    <Badge
      size="small"
      icon={<Icon size={14} aria-hidden="true" />}
      className={styles.badge}
      style={{ color: categoryMeta.color }}
      aria-label={categoryMeta.label}
    >
      {categoryMeta.label}
    </Badge>
  );
};
