/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 */

import type { Entity } from '@backstage/catalog-model';

import { entityHref, entityRefHref } from './entityLinks';

const entity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'AiResource',
  metadata: { name: 'code-review', namespace: 'default' },
};

describe('entity links', () => {
  it('builds an entity page URL', () => {
    expect(entityHref(entity)).toBe('/catalog/default/airesource/code-review');
  });

  it('parses bare, fully-qualified, and invalid refs', () => {
    expect(entityRefHref('team-ai-platform')).toBe(
      '/catalog/default/group/team-ai-platform',
    );
    expect(entityRefHref('user:default/jdoe')).toBe(
      '/catalog/default/user/jdoe',
    );
    expect(entityRefHref('group:')).toBeUndefined();
  });
});
