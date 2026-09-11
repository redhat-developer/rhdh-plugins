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
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Link,
  Tag,
  TagGroup,
  Text,
} from '@backstage/ui';
import { RiUserLine } from '@remixicon/react';

import {
  entityHref,
  entityRefHref,
  getProvider,
  getSpecField,
} from '../../utils/entityHelpers';
import { AssetTypeBadge } from './AssetTypeBadge';
import styles from './AiAssetCard.module.css';

export interface AiAssetCardProps {
  entity: Entity;
}

export const AiAssetCard = ({ entity }: AiAssetCardProps) => {
  const owner = getSpecField(entity, 'owner')?.trim();
  const displayOwner =
    owner && owner.toLowerCase() !== 'unknown' ? owner : undefined;
  const tags = entity.metadata.tags ?? [];
  const title = entity.metadata.title ?? entity.metadata.name;
  const description = entity.metadata.description ?? '';
  const provider = getProvider(entity) ?? '';
  const ownerHref = displayOwner ? entityRefHref(displayOwner) : undefined;

  return (
    <Card
      href={entityHref(entity)}
      label={`View ${title} details`}
      className={styles.card}
    >
      <CardHeader>
        <AssetTypeBadge entity={entity} />
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
          {displayOwner && (
            <>
              <span className={styles.ownerIcon}>
                <RiUserLine size={16} />
              </span>
              {ownerHref ? (
                <Link
                  href={ownerHref}
                  variant="body-x-small"
                  color="info"
                  weight="bold"
                  truncate
                  title={displayOwner}
                  className={styles.owner}
                >
                  {displayOwner}
                </Link>
              ) : (
                <Text variant="body-x-small" color="secondary" truncate>
                  {displayOwner}
                </Text>
              )}
            </>
          )}
          {provider && (
            <TagGroup aria-label="Provider" className={styles.provider}>
              <Tag id={`provider-${provider}`} size="small">
                {provider}
              </Tag>
            </TagGroup>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};
