/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 */
import type { Entity } from '@backstage/catalog-model';

export type SkillEntityInput = {
  providerId: string;
  sourceIdentity: string;
  title: string;
  description: string;
  version: string;
  source: string;
  sourceLocation: string;
  sourceReferenceKey: string;
  sourceReference: string;
  owner: string;
  lifecycle: string;
  namespace: string;
};

export function skillEntityName(value: string): string {
  const name = value
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 63)
    .replace(/-$/g, '');
  if (!name)
    throw new Error('Skill identity does not produce a valid entity name');
  return name;
}

export function buildSkillEntity(input: SkillEntityInput): Entity {
  return {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'AiResource',
    metadata: {
      name: skillEntityName(`${input.providerId}-${input.sourceIdentity}`),
      namespace: input.namespace,
      title: input.title,
      description: input.description,
      annotations: {
        'backstage.io/source-location': input.sourceLocation,
        'rhdh.io/ai-asset-category': 'skill',
        'rhdh.io/ai-asset-version': input.version,
        'rhdh.io/ai-asset-source': input.source,
        [input.sourceReferenceKey]: input.sourceReference,
      },
    },
    spec: { type: 'skill', owner: input.owner, lifecycle: input.lifecycle },
  };
}
