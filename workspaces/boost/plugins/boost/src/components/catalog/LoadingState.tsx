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

import { Flex, Skeleton } from '@backstage/ui';

import styles from './AiCatalogPage.module.css';

const SkeletonCard = () => (
  <div className={styles.skeletonCard} data-testid="loading-skeleton">
    <Flex gap="2">
      <Skeleton width={60} height={20} rounded />
      <Skeleton width={80} height={20} rounded />
    </Flex>
    <Skeleton width="90%" height={18} />
    <Skeleton width="100%" height={14} />
    <Skeleton width="70%" height={14} />
    <Flex gap="2">
      <Skeleton width={50} height={18} rounded />
      <Skeleton width={50} height={18} rounded />
    </Flex>
    <Flex gap="2" align="center">
      <Skeleton width={14} height={14} rounded />
      <Skeleton width={100} height={12} />
    </Flex>
  </div>
);

interface LoadingStateProps {
  filterCount: number;
  cardCount: number;
}

export const LoadingState = ({ filterCount, cardCount }: LoadingStateProps) => (
  <div className={styles.layout}>
    <div className={styles.loadingSidebar}>
      {Array.from({ length: filterCount }, (_, i) => (
        <div key={i}>
          <Skeleton width={60} height={14} />
          <Skeleton
            width="100%"
            height={36}
            className={styles.skeletonFilterInput}
          />
        </div>
      ))}
    </div>
    <div className={styles.resultsSurface}>
      <div className={styles.loadingToolbar}>
        <Skeleton width={80} height={24} />
        <Skeleton width={180} height={36} />
      </div>
      <div className={`${styles.loadingGrid} ${styles.skeletonGrid}`}>
        {Array.from({ length: cardCount }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  </div>
);
