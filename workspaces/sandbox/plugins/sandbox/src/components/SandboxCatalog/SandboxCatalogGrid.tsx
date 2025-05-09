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
import React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { Product, productData } from './productData';
import useGreenCorners from '../../hooks/useGreenCorners';
import { SandboxCatalogCard } from './SandboxCatalogCard';
import useProductURLs from '../../hooks/useProductURLs';

export const SandboxCatalogGrid: React.FC = () => {
  const { greenCorners, setGreenCorners } = useGreenCorners(productData);
  const productURLs = useProductURLs();

  const showGreenCorner = (id: Product) => {
    setGreenCorners(prev =>
      prev.map(gc => (gc.id === id ? { ...gc, show: true } : gc)),
    );
  };

  return (
    <Grid container spacing={2} sx={{ maxWidth: '100%' }}>
      {productData?.map(product => (
        <Grid item xs="auto" sm="auto" md="auto" lg="auto" key={product.id}>
          <Box sx={{ width: '330px', height: '372px' }}>
            <SandboxCatalogCard
              id={product.id}
              title={product.title}
              image={product.image}
              description={product.description}
              link={productURLs.find(pu => pu.id === product.id)?.url || ''}
              greenCorner={
                greenCorners?.find(gc => gc.id === product.id)?.show || false
              }
              showGreenCorner={() => showGreenCorner(product.id)}
            />
          </Box>
        </Grid>
      ))}
    </Grid>
  );
};
