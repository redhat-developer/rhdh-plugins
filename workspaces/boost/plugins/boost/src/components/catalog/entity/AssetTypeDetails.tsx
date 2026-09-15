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

import type { Entity } from '@backstage/catalog-model';
import { CodeSnippet } from '@backstage/core-components';
import { EntityRefLinks } from '@backstage/plugin-catalog-react';
import { Flex, Link, Text, Tag, TagGroup } from '@backstage/ui';
import { Fragment, type ReactNode } from 'react';

import { useTranslation } from '../../../hooks/useTranslation';
import {
  getAgentModel,
  getDistinctSpecField,
  getModelsAvailable,
  getSpecField,
  getSpecRemotes,
  getStringArraySpecField,
} from '../../../utils/entityHelpers';
import { AvailableModelsDialog } from './AvailableModelsDialog';
import { HandoffTargets } from './HandoffTargets';

const INLINE_MODEL_LIMIT = 5;

function getBooleanSpecField(
  entity: Entity,
  field: string,
): boolean | undefined {
  const spec = entity.spec as Record<string, unknown> | undefined;
  const value = spec?.[field];
  return typeof value === 'boolean' ? value : undefined;
}

function getModelField(entity: Entity, field: string): string | undefined {
  const spec = entity.spec as Record<string, unknown> | undefined;
  const models = spec?.models as Record<string, unknown> | undefined;
  const value = models?.[field];
  return typeof value === 'string' ? value : undefined;
}

export interface AssetTypeDetailsData {
  assetType: string | undefined;
  model?: string;
  serverType?: string;
  defaultModel?: string;
  requiresApiKey?: boolean;
  modelsAvailable: string[];
  handoffDescription?: string;
  handoffRefs: string[];
  enableRAG?: boolean;
  tools: string[];
  skillDisciplines: string[];
  skillCategories: string[];
  skillAgents: string[];
  ruleCategory?: string;
  remotes: Array<{ url: string; type?: string }>;
  definition?: string;
}

interface DetailFieldProps {
  readonly label: string;
  readonly children: ReactNode;
}

interface ValueTagsProps {
  readonly label: string;
  readonly values: string[];
}

interface AvailableModelsProps {
  readonly models: string[];
}

interface RemoteLinksProps {
  readonly remotes: AssetTypeDetailsData['remotes'];
}

interface AssetTypeDetailsProps {
  readonly details: AssetTypeDetailsData;
}

export function getAssetTypeDetails(
  entity: Entity,
  handoffRefs: string[],
): AssetTypeDetailsData {
  const assetType = getSpecField(entity, 'type')?.toLowerCase();
  const isAgent = assetType === 'agent';
  const isMcpServer = assetType === 'mcp-server';
  const isModelServer = assetType === 'ai-model-server';
  const isRule = assetType === 'rule';
  const isSkill = assetType === 'skill';

  return {
    assetType,
    model: isAgent ? getAgentModel(entity) : undefined,
    serverType: isModelServer ? getSpecField(entity, 'serverType') : undefined,
    defaultModel: isModelServer ? getModelField(entity, 'default') : undefined,
    requiresApiKey: isModelServer
      ? getBooleanSpecField(entity, 'requiresApiKey')
      : undefined,
    modelsAvailable: isAgent || isModelServer ? getModelsAvailable(entity) : [],
    handoffDescription: isAgent
      ? getDistinctSpecField(entity, 'handoffDescription')
      : undefined,
    handoffRefs: isAgent ? handoffRefs : [],
    enableRAG: isAgent ? getBooleanSpecField(entity, 'enableRAG') : undefined,
    tools: isAgent ? getStringArraySpecField(entity, 'tools') : [],
    skillDisciplines: isSkill
      ? getStringArraySpecField(entity, 'disciplines')
      : [],
    skillCategories: isSkill
      ? getStringArraySpecField(entity, 'categories')
      : [],
    skillAgents: isSkill ? getStringArraySpecField(entity, 'agents') : [],
    ruleCategory: isRule ? getSpecField(entity, 'category') : undefined,
    remotes: isMcpServer ? getSpecRemotes(entity) : [],
    definition: isMcpServer
      ? getDistinctSpecField(entity, 'definition')
      : undefined,
  };
}

export function hasAssetTypeDetails(details: AssetTypeDetailsData): boolean {
  return Boolean(
    details.model ||
    details.serverType ||
    details.defaultModel ||
    details.requiresApiKey !== undefined ||
    details.modelsAvailable.length > 0 ||
    details.handoffDescription ||
    details.handoffRefs.length > 0 ||
    details.enableRAG !== undefined ||
    details.tools.length > 0 ||
    details.skillDisciplines.length > 0 ||
    details.skillCategories.length > 0 ||
    details.skillAgents.length > 0 ||
    details.ruleCategory ||
    details.remotes.length > 0 ||
    details.definition,
  );
}

export function DetailField({ label, children }: DetailFieldProps) {
  return (
    <Flex direction="column" gap="1">
      <Text variant="body-small" color="secondary">
        {label}
      </Text>
      {children}
    </Flex>
  );
}

function ValueTags({ label, values }: ValueTagsProps) {
  const items = values.map(value => ({ id: value, label: value }));

  return (
    <TagGroup items={items} aria-label={label}>
      {item => <Tag size="small">{item.label}</Tag>}
    </TagGroup>
  );
}

function AvailableModels({ models }: AvailableModelsProps) {
  const visibleModels = models.slice(0, INLINE_MODEL_LIMIT);

  return (
    <Flex direction="column" align="start" gap="1">
      {visibleModels.map((model, index) => (
        <Text key={`${model}-${index}`} variant="body-medium">
          {model}
        </Text>
      ))}
      {models.length > INLINE_MODEL_LIMIT && (
        <AvailableModelsDialog models={models} />
      )}
    </Flex>
  );
}

function RemoteLinks({ remotes }: RemoteLinksProps) {
  const renderRemote = (remote: (typeof remotes)[number]) => {
    const label = remote.type ? `${remote.type}: ${remote.url}` : remote.url;

    try {
      const url = new URL(remote.url);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return <Text color="secondary">{label}</Text>;
      }
    } catch {
      return <Text color="secondary">{label}</Text>;
    }

    return (
      <Link href={remote.url} target="_blank" rel="noopener noreferrer">
        {label}
      </Link>
    );
  };

  return (
    <Flex direction="column" gap="1">
      {remotes.map(remote => (
        <Fragment key={`${remote.type ?? 'remote'}:${remote.url}`}>
          {renderRemote(remote)}
        </Fragment>
      ))}
    </Flex>
  );
}

function SkillDetails({ details }: AssetTypeDetailsProps) {
  const { t } = useTranslation();

  return (
    <>
      {details.skillDisciplines.length > 0 && (
        <DetailField label={t('catalog.card.disciplinesLabel')}>
          <ValueTags
            label={t('catalog.card.disciplinesLabel')}
            values={details.skillDisciplines}
          />
        </DetailField>
      )}
      {details.skillCategories.length > 0 && (
        <DetailField label={t('catalog.card.categoriesLabel')}>
          <ValueTags
            label={t('catalog.card.categoriesLabel')}
            values={details.skillCategories}
          />
        </DetailField>
      )}
      {details.skillAgents.length > 0 && (
        <DetailField label={t('catalog.card.relatedAgentsLabel')}>
          <EntityRefLinks entityRefs={details.skillAgents} hideIcons />
        </DetailField>
      )}
    </>
  );
}

function AgentDetails({ details }: AssetTypeDetailsProps) {
  const { t } = useTranslation();

  return (
    <>
      {details.model && (
        <DetailField label={t('catalog.card.modelTitle')}>
          <Text variant="body-medium">{details.model}</Text>
        </DetailField>
      )}
      {details.modelsAvailable.length > 0 && (
        <DetailField label={t('catalog.card.modelsTitle')}>
          <AvailableModels models={details.modelsAvailable} />
        </DetailField>
      )}
      {details.tools.length > 0 && (
        <DetailField label={t('catalog.card.toolsLabel')}>
          <EntityRefLinks entityRefs={details.tools} hideIcons />
        </DetailField>
      )}
      {details.enableRAG !== undefined && (
        <DetailField label={t('catalog.card.ragEnabledLabel')}>
          <Text variant="body-medium">
            {details.enableRAG ? t('catalog.card.yes') : t('catalog.card.no')}
          </Text>
        </DetailField>
      )}
      {details.handoffDescription && (
        <DetailField label={t('catalog.card.handoffDescriptionTitle')}>
          <Text variant="body-medium">{details.handoffDescription}</Text>
        </DetailField>
      )}
      {details.handoffRefs.length > 0 && (
        <DetailField label={t('catalog.card.handoffTargetsTitle')}>
          <HandoffTargets refs={details.handoffRefs} />
        </DetailField>
      )}
    </>
  );
}

function ModelServerDetails({ details }: AssetTypeDetailsProps) {
  const { t } = useTranslation();

  return (
    <>
      {details.serverType && (
        <DetailField label={t('catalog.card.serverTypeLabel')}>
          <Text variant="body-medium">{details.serverType}</Text>
        </DetailField>
      )}
      {details.requiresApiKey !== undefined && (
        <DetailField label={t('catalog.card.apiKeyLabel')}>
          <Text variant="body-medium">
            {details.requiresApiKey
              ? t('catalog.card.yes')
              : t('catalog.card.no')}
          </Text>
        </DetailField>
      )}
      {details.defaultModel && (
        <DetailField label={t('catalog.card.defaultModelLabel')}>
          <Text variant="body-medium">{details.defaultModel}</Text>
        </DetailField>
      )}
      {details.modelsAvailable.length > 0 && (
        <DetailField label={t('catalog.card.modelsTitle')}>
          <AvailableModels models={details.modelsAvailable} />
        </DetailField>
      )}
    </>
  );
}

function McpServerDetails({ details }: AssetTypeDetailsProps) {
  const { t } = useTranslation();

  return (
    <>
      {details.remotes.length > 0 && (
        <DetailField label={t('catalog.card.remotesLabel')}>
          <RemoteLinks remotes={details.remotes} />
        </DetailField>
      )}
      {details.definition && (
        <DetailField label={t('catalog.card.definitionLabel')}>
          <CodeSnippet
            language="yaml"
            text={details.definition}
            showCopyCodeButton
            wrapLongLines
            customStyle={{
              margin: 0,
              padding: 'var(--bui-space-3)',
              border: '1px solid var(--bui-border-1)',
              borderRadius: 'var(--bui-radius-2)',
              background: 'var(--bui-bg-neutral-2)',
            }}
          />
        </DetailField>
      )}
    </>
  );
}

export function AssetTypeDetails({ details }: AssetTypeDetailsProps) {
  const { t } = useTranslation();

  switch (details.assetType) {
    case 'skill':
      return <SkillDetails details={details} />;
    case 'agent':
      return <AgentDetails details={details} />;
    case 'rule':
      return details.ruleCategory ? (
        <DetailField label={t('catalog.card.ruleCategoryLabel')}>
          <Text variant="body-medium">{details.ruleCategory}</Text>
        </DetailField>
      ) : null;
    case 'ai-model-server':
      return <ModelServerDetails details={details} />;
    case 'mcp-server':
      return <McpServerDetails details={details} />;
    default:
      return null;
  }
}
