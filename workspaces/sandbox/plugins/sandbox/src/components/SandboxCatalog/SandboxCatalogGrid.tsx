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
import { productData } from './productData';
import useGreenCorners from '../../hooks/useGreenCorners';
import { SandboxCatalogCard } from './SandboxCatalogCard';

export const SandboxCatalogGrid: React.FC = () => {
  const { greenCorners, setGreenCorners } = useGreenCorners(productData);

  const showGreenCorner = (id: number) => {
    setGreenCorners(prev =>
      prev.map(gc => (gc.id === id ? { ...gc, show: true } : gc)),
    );
  };

  return (
    <Grid container spacing={3} sx={{ maxWidth: '100%' }}>
      {productData?.map(product => (
        <Grid item xs={12} sm="auto" md="auto" key={product.id}>
          <Box sx={{ width: '330px', height: '372px' }}>
            <SandboxCatalogCard
              key={product.id}
              title={product.title}
              image={product.image}
              description={product.description}
              link={product.link}
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
