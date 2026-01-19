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
import { Label, Tooltip } from '@patternfly/react-core';
import { BitbucketIcon } from '@patternfly/react-icons/dist/esm/icons/bitbucket-icon';
import { GithubIcon } from '@patternfly/react-icons/dist/esm/icons/github-icon';
import { GitlabIcon } from '@patternfly/react-icons/dist/esm/icons/gitlab-icon';

import { getCommitShortName } from '../../../utils/commits';

export enum GitProvider {
  GITHUB = 'github',
  BITBUCKET = 'bitbucket',
  GITLAB = 'gitlab',
  UNSURE = 'other',
  INVALID = '',
}

const tipText: Record<string, string> = {
  [GitProvider.GITHUB]: 'Open in GitHub',
  [GitProvider.GITLAB]: 'Open in GitLab',
  [GitProvider.BITBUCKET]: 'Open in BitBucket',
};
const providerIcon: Record<string, React.ReactElement> = {
  [GitProvider.GITHUB]: <GithubIcon data-test="git-hub-icon" />,
  [GitProvider.GITLAB]: <GitlabIcon data-test="git-lab-icon" />,
  [GitProvider.BITBUCKET]: <BitbucketIcon data-test="bit-bucket-icon" />,
};

type CommitLabelProps = {
  gitProvider: GitProvider | string | undefined;
  sha: string;
  shaURL: string;
};
const CommitLabel: React.FC<React.PropsWithChildren<CommitLabelProps>> = ({
  gitProvider,
  sha,
  shaURL,
}) => {
  const commitShortName = getCommitShortName(sha);
  const label = (
    <Label
      style={{ padding: 4 }}
      color="blue"
      icon={gitProvider ? providerIcon[gitProvider] : null}
      isCompact
      render={({ className, content }) => (
        <a
          href={shaURL}
          target="_blank"
          rel="noopener noreferrer"
          className={className}
          data-test={`commit-label-${commitShortName}`}
        >
          {content}
        </a>
      )}
    >
      {commitShortName}
    </Label>
  );
  const tooltip = gitProvider ? tipText[gitProvider] : null;
  if (tooltip) {
    return <Tooltip content={tooltip}>{label}</Tooltip>;
  }
  return label;
};

export default CommitLabel;
