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

import { EntityLayoutRouteProps } from '@backstage/plugin-catalog/index';

import { WorkflowIdsAnnotation } from '../constants';

/*
  The backstage component annotation workflow-ids is a comma-separated list of workflows IDs which are related to the component.

  Benefits of having the relation from a component to workflow:
  - simplifies the EntityPage.tsx as APIs are not available for the EntityLayout.Route
  - plugins can search for Components by Catalog API via annotations, searching for workflows (vice versa) would be complicated

  Disadvantages:
  - the user needs to update the Catalog component to add the relation

  Why annotations and not labels? Since label values have the same constraints as 'name', annotations are less restricted
*/
export const hasWorkflows: EntityLayoutRouteProps['if'] = entity => {
  return !!entity.metadata?.annotations?.[WorkflowIdsAnnotation];
};
