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
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Tag,
  TagGroup,
  Text,
} from '@backstage/ui';
import { RiUserLine } from '@remixicon/react';

import { getCategoryMeta } from '../../utils/categoryMeta';
import { entityHref, getSpecField } from '../../utils/entityHelpers';
import styles from './AiAssetCard.module.css';

export interface AiAssetCardProps {
  entity: Entity;
  onCategoryClick?: (category: string) => void;
}

export const AiAssetCard = ({ entity, onCategoryClick }: AiAssetCardProps) => {
  const specType = getSpecField(entity, 'type');
  const owner = getSpecField(entity, 'owner');
  const categoryMeta = getCategoryMeta(specType);
  const tags = entity.metadata.tags ?? [];
  const title = entity.metadata.title ?? entity.metadata.name;
  const description = entity.metadata.description ?? '';
  const scope = entity.metadata.annotations?.['rhdh.io/ai-asset-source'] ?? '';

  return (
    <Card
      href={entityHref(entity)}
      label={`View ${title} details`}
      className={styles.card}
    >
      <CardHeader>
        <Button
          variant="tertiary"
          size="small"
          className={styles.typeBadge}
          style={{ color: categoryMeta.color }}
          onPress={
            onCategoryClick && specType
              ? () => onCategoryClick(specType)
              : undefined
          }
          aria-label={`Filter by ${categoryMeta.label}`}
        >
          {categoryMeta.label}
        </Button>
      </CardHeader>
      <CardBody className={styles.body}>
        <Text variant="title-small" className={styles.title}>
          {title}
        </Text>
        {description && (
          <Text
            variant="body-small"
            color="secondary"
            className={styles.description}
          >
            {description}
          </Text>
        )}
        {tags.length > 0 && (
          <div className={styles.tags}>
            <TagGroup aria-label="Tags">
              {tags.map(tag => (
                <Tag key={tag} id={tag} size="small">
                  {tag}
                </Tag>
              ))}
            </TagGroup>
          </div>
        )}
      </CardBody>
      <CardFooter>
        <div className={styles.footer}>
          {owner && (
            <>
              <span className={styles.ownerIcon}>
                <RiUserLine size={16} />
              </span>
              <Text variant="body-x-small" color="secondary" truncate>
                {owner}
              </Text>
            </>
          )}
          {scope && (
            <Text
              variant="body-x-small"
              color="secondary"
              className={styles.scope}
            >
              {scope}
            </Text>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};
