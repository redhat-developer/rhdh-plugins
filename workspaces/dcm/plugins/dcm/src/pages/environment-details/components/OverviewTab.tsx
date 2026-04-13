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

import { Box, Grid } from '@material-ui/core';
import { CodeSnippet, InfoCard, Link } from '@backstage/core-components';
import { useRouteRef } from '@backstage/core-plugin-api';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import {
  getMockEntityCountForEnvironment,
  type Environment,
} from '../../../data/environments';
import { useDcmStyles } from '../../../components/dcmStyles';
import { OverviewField } from '../../../components/overview';
import { DCM_DETAILS_TABS, rootRouteRef } from '../../../routes';

export function OverviewTab(
  props: Readonly<{
    env: Environment & { url?: string; maxRamGb?: number };
  }>,
) {
  const { env } = props;
  const classes = useDcmStyles();
  const rootPath = useRouteRef(rootRouteRef)?.() ?? '/dcm';
  const entitiesTabPath = `${rootPath}/environments/${env.id}${DCM_DETAILS_TABS.entities}`;
  const entityCount = getMockEntityCountForEnvironment(env.id);
  return (
    <Box>
      <InfoCard
        title="Overview"
        className={classes.overviewCard}
        titleTypographyProps={{
          className: classes.overviewCardTitle,
        }}
      >
        <Grid container spacing={4} className={classes.overviewGrid}>
          <Grid item xs={12} md={6}>
            <OverviewField label="Type">{env.type}</OverviewField>
            <OverviewField label="URL">
              {env.url ? (
                <Link
                  to={env.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={classes.overviewLink}
                >
                  {env.url}
                  <OpenInNewIcon className={classes.inlineExternalIcon} />
                </Link>
              ) : (
                '—'
              )}
            </OverviewField>
            <OverviewField label="Max vCPUs (quota)">
              {env.resourceLoadTotal} vCPU
            </OverviewField>
          </Grid>
          <Grid item xs={12} md={6}>
            <OverviewField label="Env label">{env.envLabel}</OverviewField>
            <OverviewField label="Running resources">
              <Link to={entitiesTabPath} className={classes.overviewLink}>
                {entityCount} entities
              </Link>
            </OverviewField>
            <OverviewField label="Max RAM (quota)">
              {env.maxRamGb === null || env.maxRamGb === undefined
                ? '—'
                : `${env.maxRamGb} GB`}
            </OverviewField>
          </Grid>
        </Grid>
      </InfoCard>
      <Box marginTop={3}>
        <InfoCard
          title="YAML resource specification"
          className={classes.yamlCard}
        >
          <CodeSnippet
            text={`kind: Environment
metadata:
  id: ${env.id}
  name: ${env.name}
spec:
  type: ${env.type}
  url: ${(env as { url?: string }).url || ''}
  envLabel: ${env.envLabel}
  entitiesCount: ${entityCount}
`}
            language="yaml"
            showCopyCodeButton
          />
        </InfoCard>
      </Box>
    </Box>
  );
}
