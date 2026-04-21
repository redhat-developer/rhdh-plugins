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

import { Box, Chip, Grid } from '@material-ui/core';
import { CodeSnippet, InfoCard, Link } from '@backstage/core-components';
import { useRouteRef } from '@backstage/core-plugin-api';
import {
  formatServiceSpecCpu,
  formatServiceSpecRam,
  type ServiceSpec,
} from '../../../data/service-specs';
import { buildServiceSpecYaml } from '../../../components/serviceSpecYaml';
import { useDcmStyles } from '../../../components/dcmStyles';
import { OverviewField } from '../../../components/overview';
import { DCM_DETAILS_TABS, rootRouteRef } from '../../../routes';

export function SpecOverviewTab(props: Readonly<{ spec: ServiceSpec }>) {
  const { spec } = props;
  const classes = useDcmStyles();
  const rootPath = useRouteRef(rootRouteRef)?.() ?? '/dcm';
  const entitiesTabPath = `${rootPath}/service-specs/${spec.id}${DCM_DETAILS_TABS.entities}`;

  return (
    <Box>
      <InfoCard
        title="Overview"
        className={classes.overviewCard}
        titleTypographyProps={{
          style: { fontSize: '23px', fontWeight: 700 },
        }}
      >
        <Grid container spacing={4} className={classes.overviewGrid}>
          <Grid item xs={12} md={4}>
            <OverviewField label="Type">{spec.resourceType}</OverviewField>
            <OverviewField label="Est. deployment time">
              {spec.estDeploymentTime}
            </OverviewField>
            <OverviewField label="RAM">
              {formatServiceSpecRam(spec.ram)}
            </OverviewField>
            <OverviewField label="Port">{spec.port}</OverviewField>
            <OverviewField label="Policy packs">
              {spec.policyPacks.join(', ')}
            </OverviewField>
            <OverviewField label="Tags">
              <Box display="flex" flexWrap="wrap">
                {spec.tags.map(tag => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    className={classes.tagChip}
                    variant="outlined"
                  />
                ))}
              </Box>
            </OverviewField>
          </Grid>
          <Grid item xs={12} md={4}>
            <OverviewField label="Env support">
              <Box display="flex" flexWrap="wrap">
                {spec.envSupport.map(e => (
                  <Chip
                    key={e}
                    label={e}
                    size="small"
                    className={classes.envChip}
                    variant="outlined"
                  />
                ))}
              </Box>
            </OverviewField>
            <OverviewField label="Cost tier">{spec.costTier}</OverviewField>
            <OverviewField label="Max instances (quota)">
              {spec.quota}
            </OverviewField>
            <OverviewField label="Protocol">{spec.protocol}</OverviewField>
          </Grid>
          <Grid item xs={12} md={4}>
            <OverviewField label="Current usage">
              <Link to={entitiesTabPath} className={classes.overviewLink}>
                {spec.used} active entities
              </Link>
            </OverviewField>
            <OverviewField label="CPU">
              {formatServiceSpecCpu(spec.cpu)}
            </OverviewField>
            <OverviewField label="Environment">
              {spec.environment}
            </OverviewField>
            <OverviewField label="Backup policy">
              {spec.backupPolicy}
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
            text={buildServiceSpecYaml(spec)}
            language="yaml"
            showCopyCodeButton
          />
        </InfoCard>
      </Box>
    </Box>
  );
}
