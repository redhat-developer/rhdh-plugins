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
import { useEffect, useState } from 'react';
import { errorApiRef, useApi } from '@backstage/core-plugin-api';
import { EntityRefLink, catalogApiRef } from '@backstage/plugin-catalog-react';
import { Flex, Text } from '@backstage/ui';

interface HandoffTargetsProps {
  refs: string[];
}

export const HandoffTargets = ({ refs }: HandoffTargetsProps) => {
  const catalogApi = useApi(catalogApiRef);
  const errorApi = useApi(errorApiRef);
  const [targets, setTargets] = useState<Array<Entity | undefined> | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    setTargets(null);
    catalogApi
      .getEntitiesByRefs({ entityRefs: refs })
      .then(response => {
        if (!cancelled) setTargets(response.items);
      })
      .catch(error => {
        if (!cancelled) {
          errorApi.post(error);
          setTargets(refs.map(() => undefined));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [catalogApi, errorApi, refs]);

  return (
    <Flex direction="row" gap="2" style={{ flexWrap: 'wrap' }}>
      {refs.map((ref, index) => {
        const target = targets?.[index];

        return target ? (
          <EntityRefLink key={ref} entityRef={target} hideIcon />
        ) : (
          <Text key={ref} color="secondary">
            {ref}
          </Text>
        );
      })}
    </Flex>
  );
};
