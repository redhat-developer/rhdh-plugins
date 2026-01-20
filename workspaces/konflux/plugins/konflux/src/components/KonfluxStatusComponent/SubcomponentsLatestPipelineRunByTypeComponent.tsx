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
import { Progress } from '@backstage/core-components';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionToggle,
  Flex,
} from '@patternfly/react-core';
import {
  LatestPipelineRunByType,
  SubcomponentLatestPipelineRunByType,
} from './types';
import { getGeneralStatus } from './utils';
import { PipelineRunInfo } from './components/PipelineRunInfo';
import { ReleaseInfo } from './components/ReleaseInfo';

import './KonfluxStatusComponent.css';
import './SubcomponentsLatestPipelineRunByTypeComponent.css';
import { Entity } from '@backstage/catalog-model';
import { getEntityDisplayName } from '../../utils/entities';
import { useIsDarkMode } from '../../hooks/useIsDarkMode';

type Props = {
  isLoading: boolean;
  subcomponentsLatestPipelineRunByType: SubcomponentLatestPipelineRunByType;
  entities: Entity[];
};

const DARK_THEME_LINK_COLOR = '#3366CC';

type LatestPipelineRunsByTypeProps = {
  latestPipelineRunsByType: LatestPipelineRunByType;
};
const LatestPipelineRunByTypeComponent = ({
  latestPipelineRunsByType,
}: LatestPipelineRunsByTypeProps) => {
  const isDarkMode = useIsDarkMode();
  return (
    <Flex direction={{ default: 'column' }} gap={{ default: 'gapNone' }}>
      <PipelineRunInfo
        pipelineRun={latestPipelineRunsByType.build}
        text="Build"
        customLinkColor={isDarkMode ? DARK_THEME_LINK_COLOR : undefined}
      />
      <PipelineRunInfo
        pipelineRun={latestPipelineRunsByType.test}
        text="Test"
        customLinkColor={isDarkMode ? DARK_THEME_LINK_COLOR : undefined}
      />
      <ReleaseInfo
        release={latestPipelineRunsByType.release}
        text="Release"
        customLinkColor={isDarkMode ? DARK_THEME_LINK_COLOR : undefined}
      />
    </Flex>
  );
};

export const SubcomponentsLatestPipelineRunByTypeComponent = ({
  subcomponentsLatestPipelineRunByType,
  isLoading,
  entities,
}: Props) => {
  const keys = Object.keys(subcomponentsLatestPipelineRunByType);
  const [expanded, setExpanded] = useState('');

  const onToggle = (id: string) => {
    if (id === expanded) {
      setExpanded('');
    } else {
      setExpanded(id);
    }
  };

  if (isLoading) return <Progress />;

  if (keys.length === 1) {
    const latestPipelineRunsByType =
      subcomponentsLatestPipelineRunByType[keys[0]];

    return (
      <LatestPipelineRunByTypeComponent
        latestPipelineRunsByType={latestPipelineRunsByType}
      />
    );
  }

  return (
    <Accordion togglePosition="start" className="accordion">
      {keys.map(key => {
        const latestPipelineRunsByType =
          subcomponentsLatestPipelineRunByType[key];
        const className = getGeneralStatus(latestPipelineRunsByType);
        const entityDisplayName = getEntityDisplayName(key, entities);

        return (
          <AccordionItem
            key={key}
            isExpanded={key === expanded}
            className={className}
          >
            <AccordionToggle id={key} onClick={() => onToggle(key)}>
              {entityDisplayName}
            </AccordionToggle>
            <AccordionContent className="accordion-content" isCustomContent>
              <LatestPipelineRunByTypeComponent
                latestPipelineRunsByType={latestPipelineRunsByType}
              />
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
};
