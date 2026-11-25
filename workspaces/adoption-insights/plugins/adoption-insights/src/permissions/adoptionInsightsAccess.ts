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

import { adoptionInsightsEventsReadPermission } from '@red-hat-developer-hub/backstage-plugin-adoption-insights-common';

/**
 * NFS extension filter: only enable Adoption Insights surfaces when the user
 * has `adoption-insights.events.read`. Used by the admin page and homepage
 * Popular Content widgets so denied users do not see those cards in the
 * homepage grid or the Add Widget catalog.
 */
export const adoptionInsightsAccess = {
  permissions: {
    $contains: `${adoptionInsightsEventsReadPermission.name}#read`,
  },
};
