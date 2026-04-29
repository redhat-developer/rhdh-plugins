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

import { useMemo } from 'react';
import { DcmEntitiesCard } from '../../../components/DcmEntitiesTable';
import {
  MOCK_SERVICE_SPEC_ENTITIES,
  type ServiceSpec,
} from '../../../data/service-specs';

export function SpecEntitiesTab(props: Readonly<{ spec: ServiceSpec }>) {
  const { spec } = props;
  const allEntitiesForSpec = useMemo(
    () => MOCK_SERVICE_SPEC_ENTITIES.filter(e => e.specId === spec.id),
    [spec.id],
  );
  return (
    <DcmEntitiesCard
      allEntities={allEntitiesForSpec}
      storageKey="spec-entities"
      resetKey={spec.id}
    />
  );
}
