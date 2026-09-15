/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 */
import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node';
import { NpxSkillsEntityProvider } from './NpxSkillsEntityProvider';

export const catalogModuleNpxSkills = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'npx-skills',
  register(env) {
    env.registerInit({
      deps: {
        catalog: catalogProcessingExtensionPoint,
        config: coreServices.rootConfig,
        logger: coreServices.logger,
        scheduler: coreServices.scheduler,
      },
      async init({ catalog, config, logger, scheduler }) {
        const providers = NpxSkillsEntityProvider.fromConfig(
          config,
          logger,
          scheduler.createScheduledTaskRunner({
            frequency: { minutes: 10 },
            timeout: { minutes: 2 },
          }),
        );
        providers.forEach((provider) => catalog.addEntityProvider(provider));
      },
    });
  },
});
