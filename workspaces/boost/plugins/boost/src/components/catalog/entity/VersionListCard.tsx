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
import type { Entity } from '@backstage/catalog-model';
import { useApi } from '@backstage/core-plugin-api';
import { catalogApiRef, useEntity } from '@backstage/plugin-catalog-react';
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Link,
  Skeleton,
  Text,
} from '@backstage/ui';

import { useTranslation } from '../../../hooks/useTranslation';
import { entityHref } from '../../../utils/entityHelpers';

function getVersion(e: Entity): string {
  return e.metadata.annotations?.['rhdh.io/ai-asset-version'] ?? '';
}

function getAssetName(e: Entity): string {
  return e.metadata.annotations?.['rhdh.io/ai-asset-name'] ?? e.metadata.name;
}

function isRecommended(e: Entity): boolean {
  return e.metadata.annotations?.['rhdh.io/ai-asset-recommended'] === 'true';
}

/**
 * Compare two version strings with semver-aware sorting.
 * Falls back to lexicographic comparison for non-semver strings.
 */
function compareVersions(a: string, b: string): number {
  const pa = a.split('.');
  const pb = b.split('.');
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const na = parseInt(pa[i] ?? '0', 10);
    const nb = parseInt(pb[i] ?? '0', 10);
    if (Number.isNaN(na) || Number.isNaN(nb)) {
      return a.localeCompare(b);
    }
    if (na !== nb) return nb - na; // descending — newest first
  }
  return 0;
}

export const VersionListCard = () => {
  const { entity } = useEntity();
  const { t } = useTranslation();
  const catalogApi = useApi(catalogApiRef);

  const version = getVersion(entity);
  const assetName = getAssetName(entity);

  const [siblings, setSiblings] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!version) {
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);

    catalogApi
      .getEntities({
        filter: {
          'metadata.annotations.rhdh.io/ai-asset-name': assetName,
        },
      })
      .then(response => {
        if (!cancelled) {
          const items = response.items
            .filter(e => getVersion(e) !== '')
            .sort((a, b) => compareVersions(getVersion(a), getVersion(b)));
          setSiblings(items);
        }
      })
      .catch(() => {
        // On error, fall back to showing only the current version
        if (!cancelled) {
          setSiblings([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [catalogApi, version, assetName]);

  if (!version) {
    return null;
  }

  const currentName = entity.metadata.name;
  const currentNamespace = entity.metadata.namespace ?? 'default';

  const isCurrent = (e: Entity): boolean =>
    e.metadata.name === currentName &&
    (e.metadata.namespace ?? 'default') === currentNamespace;

  // When loading or no siblings found, show current version only
  const versionEntities = siblings.length > 0 ? siblings : [entity];

  return (
    <Card>
      <CardHeader>
        <Text variant="title-small">{t('catalog.card.versionTitle')}</Text>
      </CardHeader>
      <CardBody>
        <Flex direction="column" gap="2">
          {loading ? (
            <Flex direction="column" gap="2">
              <Skeleton width={120} height={20} rounded />
              <Skeleton width={100} height={20} rounded />
            </Flex>
          ) : (
            versionEntities.map(e => {
              const v = getVersion(e);
              const current = isCurrent(e);
              const recommended = isRecommended(e);

              return (
                <Flex key={e.metadata.name} align="center" gap="2">
                  {current || siblings.length <= 1 ? (
                    <Badge size="small">{v}</Badge>
                  ) : (
                    <Link
                      href={entityHref(e)}
                      aria-label={t('catalog.card.versionNavigate', {
                        version: v,
                      })}
                    >
                      <Badge size="small">{v}</Badge>
                    </Link>
                  )}
                  {current && (
                    <Text variant="body-x-small" color="secondary">
                      {t('catalog.card.versionCurrent')}
                    </Text>
                  )}
                  {recommended && (
                    <Text variant="body-x-small" color="secondary">
                      {t('catalog.card.versionRecommended')}
                    </Text>
                  )}
                </Flex>
              );
            })
          )}
        </Flex>
      </CardBody>
    </Card>
  );
};
