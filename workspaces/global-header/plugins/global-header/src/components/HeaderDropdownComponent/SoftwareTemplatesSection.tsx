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

import { useEffect, useMemo, useState } from 'react';
import type { ComponentType } from 'react';

import { useApi } from '@backstage/core-plugin-api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { Entity } from '@backstage/catalog-model';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { MenuSection } from './MenuSection';
import { MenuItemLink } from '../MenuItemLink/MenuItemLink';
import { useTranslation } from '../../hooks/useTranslation';

/**
 * Software Templates Section properties
 *
 * @public
 */
export type SoftwareTemplatesSectionProps = {
  handleClose: () => void;
  hideDivider?: boolean;
};

export const SoftwareTemplatesSection = ({
  handleClose,
  hideDivider,
}: SoftwareTemplatesSectionProps) => {
  const catalogApi = useApi(catalogApiRef);
  const { t } = useTranslation();

  const [entities, setEntities] = useState<Entity[]>([]);
  // TODO: handle loading
  const [_loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEntities = async () => {
      try {
        const response = await catalogApi.getEntities({
          filter: { kind: ['Template'] },
          limit: 7,
        });
        setEntities(response.items);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEntities();
  }, [catalogApi]);

  const items = useMemo(() => {
    return entities
      .filter(e => e.kind === 'Template')
      .map(m => ({
        Component: MenuItemLink as ComponentType,
        label: m.metadata.title ?? m.metadata.name,
        link: `/create/templates/default/${m.metadata.name}`,
      }));
  }, [entities]);

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={2}>
        <Typography variant="body1" color="error">
          {t('create.templates.errorFetching')}
        </Typography>
      </Box>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <Typography
          variant="body2"
          sx={{ mx: 2, my: 1, color: 'text.disabled' }}
        >
          {t('create.templates.noTemplatesAvailable')}
        </Typography>
        {!hideDivider && <Divider sx={{ my: 0.5 }} />}
      </>
    );
  }
  return (
    <MenuSection
      hideDivider={hideDivider}
      sectionLabel={t('create.templates.sectionTitle')}
      optionalLink="/create"
      optionalLinkLabel={t('create.templates.allTemplates')}
      items={items}
      handleClose={handleClose}
    />
  );
};
