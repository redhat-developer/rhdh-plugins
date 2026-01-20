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

import '@patternfly/react-core/dist/styles/base-no-reset.css';
import '@patternfly/patternfly/utilities/Accessibility/accessibility.css';
import { Link } from '@backstage/core-components';
import { ExternalLinkAltIcon } from '@patternfly/react-icons/dist/esm/icons/external-link-alt-icon';
import { CodeBranchIcon } from '@patternfly/react-icons/dist/esm/icons/code-branch-icon';
import { Flex, FlexItem } from '@patternfly/react-core';

import './PipelineRunsList.css';

export interface TriggerColumnDataProps {
  eventType?: string;
  commitSha?: string;
  shaUrl?: string;
}

export const TriggerColumnData: React.FC<TriggerColumnDataProps> = ({
  eventType,
  commitSha,
  shaUrl,
}) => {
  if (!eventType || !commitSha || !shaUrl) {
    return <>-</>;
  }

  const commitShaText = commitSha.substring(0, 7);

  return (
    <Flex
      spaceItems={{ default: 'spaceItemsXs' }}
      alignItems={{ default: 'alignItemsCenter' }}
    >
      <FlexItem>
        <CodeBranchIcon />
      </FlexItem>
      <FlexItem>
        {shaUrl && (
          <Link to={shaUrl} className="trigger-column-branch-link-wrapper">
            {commitShaText}{' '}
            <ExternalLinkAltIcon className="external-link-icon" />
          </Link>
        )}
      </FlexItem>
    </Flex>
  );
};
