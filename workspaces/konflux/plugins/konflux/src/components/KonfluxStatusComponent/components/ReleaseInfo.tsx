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

import {
  getApplicationFromResource,
  ReleaseResource,
} from '@red-hat-developer-hub/backstage-plugin-konflux-common';
import { css } from '@patternfly/react-styles';
import { getClassNameFromRunStatus } from '../utils';
import { getReleaseStatus } from '../../../hooks/useReleaseStatus';

import './ReleaseInfo.css';
import { ExternalLink } from '../../ExternalLink';
import { getReleaseOverviewPath } from '../../../utils/url-paths';

type ReleaseInfoProps = {
  release: ReleaseResource | null;
  text: string;
  customLinkColor?: string;
};
export const ReleaseInfo = ({
  release,
  text,
  customLinkColor,
}: ReleaseInfoProps) => {
  const applicationName = getApplicationFromResource(release);

  if (!release) return null;

  return (
    <div
      className={css(
        getClassNameFromRunStatus(getReleaseStatus(release)),
        'release-info-wrapper',
      )}
    >
      <ExternalLink
        to={getReleaseOverviewPath(
          release.cluster.konfluxUI || '',
          release.metadata?.namespace || '',
          applicationName || '',
          release.metadata?.name || '',
        )}
        label={text}
        customColor={customLinkColor}
      />
    </div>
  );
};
