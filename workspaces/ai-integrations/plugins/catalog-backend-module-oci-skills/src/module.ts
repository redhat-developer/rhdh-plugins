/* Copyright Red Hat, Inc. Licensed under the Apache License, Version 2.0. */
import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node';
import { OciSkillsEntityProvider } from './OciSkillsEntityProvider';

export const catalogModuleOciSkills = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'oci-skills',
  register(env) {
    env.registerInit({
      deps: {
        catalog: catalogProcessingExtensionPoint,
        config: coreServices.rootConfig,
        logger: coreServices.logger,
        scheduler: coreServices.scheduler,
      },
      async init({ catalog, config, logger, scheduler }) {
        const runner = scheduler.createScheduledTaskRunner({
          frequency: { minutes: 10 },
          timeout: { minutes: 2 },
        });
        OciSkillsEntityProvider.fromConfig(config, logger, runner).forEach(
          (provider) => catalog.addEntityProvider(provider),
        );
      },
    });
  },
});
