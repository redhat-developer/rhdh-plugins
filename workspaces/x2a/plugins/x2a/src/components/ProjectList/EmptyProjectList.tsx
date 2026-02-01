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
import { makeStyles } from '@material-ui/core';
import { EmptyState, LinkButton } from '@backstage/core-components';
import { basePath, newProjectRouteRef } from '../../routes';
import emptyProjectListImage from './EmptyProjectListImage.png';

const useStyles = makeStyles({
  top: {
    '& > div:first-child > div:first-child': {
      margin: 'auto',
    },
  },
});

export const EmptyProjectListImage = () => (
  <img
    src={emptyProjectListImage}
    alt="Empty project list"
    style={{ maxWidth: '100%', height: 'auto' }}
  />
);

const NextSteps = () => {
  return (
    <div>
      Initiate and track conversion of Chef files into production-ready Ansible
      Playbooks.
      <p>
        <LinkButton
          variant="contained"
          color="primary"
          to={`${basePath}/${newProjectRouteRef.path}`}
        >
          Start first conversion
        </LinkButton>
      </p>
    </div>
  );
};

export const EmptyProjectList = () => {
  const styles = useStyles();

  return (
    <div className={styles.top}>
      <EmptyState
        title="No conversion initiated yet"
        description={<NextSteps />}
        missing={{ customImage: <EmptyProjectListImage /> }}
      />
    </div>
  );
};
