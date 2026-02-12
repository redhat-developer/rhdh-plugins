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
import { useState } from 'react';
import { ProjectStatus } from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { PieChart, PieValueType } from '@mui/x-charts';
import { Grid, makeStyles, Tooltip } from '@material-ui/core';

import { useTranslation } from '../../hooks/useTranslation';

const size = 25;

const styles = makeStyles({
  tooltip: {
    width: 100,
  },
});

const TooltipItem = ({
  label,
  value,
}: {
  label: string | React.ReactNode;
  value: number;
}) => {
  return (
    <>
      <Grid item xs={10}>
        {label}
      </Grid>
      <Grid item xs={2}>
        {value}
      </Grid>
    </>
  );
};

export const ProjectStatusCell = ({
  projectStatus,
}: {
  projectStatus?: ProjectStatus;
}) => {
  const { t } = useTranslation();
  const classes = styles();
  const [open, setOpen] = useState(false);

  if (!projectStatus) {
    return undefined;
  }

  const modulesSummary = projectStatus.modulesSummary;

  let data: PieValueType[] = [];
  let tooltipContent = <></>;
  if (modulesSummary) {
    data = [
      {
        label: t('module.summary.finished'),
        value: modulesSummary.finished,
        color: '#00C49F',
      },
      {
        label: t('module.summary.waiting'),
        value: modulesSummary.waiting,
        color: '#FFBB28',
      },
      {
        label: t('module.summary.pending'),
        value: modulesSummary.pending,
        color: '#FF8042',
      },
      {
        label: t('module.summary.running'),
        value: modulesSummary.running,
        color: '#FF8042',
      },
      {
        label: t('module.summary.error'),
        value: modulesSummary.error,
        color: '#FF0000',
      },
    ];

    tooltipContent = (
      <Grid container direction="row" spacing={0} className={classes.tooltip}>
        <TooltipItem
          label={<b>{t('module.summary.total')}</b>}
          value={modulesSummary.total}
        />
        <TooltipItem
          label={t('module.summary.finished')}
          value={modulesSummary.finished}
        />
        <TooltipItem
          label={t('module.summary.waiting')}
          value={modulesSummary.waiting}
        />
        <TooltipItem
          label={t('module.summary.pending')}
          value={modulesSummary.pending}
        />
        <TooltipItem
          label={t('module.summary.running')}
          value={modulesSummary.running}
        />
        <TooltipItem
          label={t('module.summary.error')}
          value={modulesSummary.error}
        />
      </Grid>
    );
  }

  return (
    <Grid container direction="row" spacing={1}>
      {modulesSummary && (
        <Grid item>
          <Tooltip
            open={open}
            onClose={() => setOpen(false)}
            leaveDelay={1000}
            placement="bottom"
            arrow
            title={tooltipContent}
          >
            <PieChart
              series={[{ innerRadius: 0, outerRadius: size / 2, data }]}
              margin={{ right: 5 }}
              width={size}
              height={size}
              hideLegend
              onClick={event => {
                event.stopPropagation();
                setOpen(!open);
              }}
            />
          </Tooltip>
        </Grid>
      )}

      <Grid item alignContent="center">
        {t(`project.statuses.${projectStatus.state || 'none'}`)}
      </Grid>
    </Grid>
  );
};
