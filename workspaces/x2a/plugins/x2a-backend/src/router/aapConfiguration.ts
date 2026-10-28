/* Copyright Red Hat, Inc. */
import express from 'express';
import type { RouterDeps } from './types';

export function registerAapConfigurationRoutes(
  router: express.Router,
  deps: RouterDeps,
): void {
  router.get('/aap/configuration', (_req, res) => {
    const organization = deps.config.getOptionalString(
      'x2a.credentials.aap.orgName',
    );
    res.json({
      configured: Boolean(organization),
      ...(organization ? { organization } : {}),
    });
  });
}
