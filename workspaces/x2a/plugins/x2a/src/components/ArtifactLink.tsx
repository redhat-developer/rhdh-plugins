/**
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
import { Link } from '@backstage/core-components';
import { makeStyles } from '@material-ui/core';
import LaunchIcon from '@material-ui/icons/Launch';
import { Artifact } from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { useScmHostMap } from '../hooks/useScmHostMap';
import { useTranslation } from '../hooks/useTranslation';
import { buildArtifactUrl, humanizeArtifactType } from './tools';

const useStyles = makeStyles({
  artifact: {
    margin: 0,
    padding: 0,
    display: 'inline-flex',
    alignItems: 'center',
  },
  externalIcon: {
    marginLeft: 4,
    fontSize: 'inherit',
  },
});

export const ArtifactLink = ({
  artifact,
  targetRepoUrl,
  targetRepoBranch,
}: {
  artifact?: Artifact;
  targetRepoUrl: string;
  targetRepoBranch: string;
}) => {
  const classes = useStyles();
  const hostMap = useScmHostMap();
  const { t } = useTranslation();

  if (!artifact) {
    return t('module.phases.none');
  }

  const url =
    artifact.type === 'ansible_project'
      ? artifact.value
      : buildArtifactUrl(
          artifact.value,
          targetRepoUrl,
          targetRepoBranch,
          hostMap,
        );
  return (
    <Link
      to={url}
      target="_blank"
      rel="noopener noreferrer"
      className={classes.artifact}
    >
      {humanizeArtifactType(t, artifact.type)}
      <LaunchIcon className={classes.externalIcon} aria-hidden />
    </Link>
  );
};
