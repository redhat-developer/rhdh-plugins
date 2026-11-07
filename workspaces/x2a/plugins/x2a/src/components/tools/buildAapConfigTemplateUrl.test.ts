/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 */

import {
  buildAapConfigTemplateUrl,
  CREATE_AAP_CONFIG_TEMPLATE_PATH,
} from './buildAapConfigTemplateUrl';

describe('buildAapConfigTemplateUrl', () => {
  it('prefills the stable project directory used by the publisher', () => {
    const result = buildAapConfigTemplateUrl({
      sourceRepository: 'https://github.com/acme/migrations.git',
      sourceBranch: 'main',
      sourceCommit: '0123456789abcdef',
      artifactPath: 'shop-a1b2c3/ansible/aap-config/nginx',
      projectName: 'Shop migration',
      projectDirName: 'shop-a1b2c3',
      moduleName: 'nginx',
    });

    const url = new URL(result, 'https://backstage.example');
    const formData = JSON.parse(url.searchParams.get('formData')!);

    expect(url.pathname).toBe(CREATE_AAP_CONFIG_TEMPLATE_PATH);
    expect(formData).toMatchObject({
      sourceRepository: 'github.com?owner=acme&repo=migrations',
      projectDirName: 'shop-a1b2c3',
      moduleName: 'nginx',
    });
  });

  it('prefills the Bitbucket workspace instead of an owner', () => {
    const result = buildAapConfigTemplateUrl({
      sourceRepository: 'https://bitbucket.org/acme/migrations.git',
      sourceBranch: 'main',
      sourceCommit: '0123456789abcdef',
      artifactPath: 'shop-a1b2c3/ansible/aap-config/nginx',
      projectName: 'Shop migration',
      projectDirName: 'shop-a1b2c3',
      moduleName: 'nginx',
    });

    const url = new URL(result, 'https://backstage.example');
    const formData = JSON.parse(url.searchParams.get('formData')!);

    expect(formData.sourceRepository).toBe(
      'bitbucket.org?workspace=acme&repo=migrations',
    );
  });
});
