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
import { useState, useEffect } from 'react';
import { getCookie, setCookie } from '../utils/cookie-utils';
import { Product, ProductData } from '../components/SandboxCatalog/productData';

type GreenCorner = {
  show: boolean;
  id: Product;
};

const useGreenCorners = (productData: ProductData[]) => {
  const [greenCorners, setGreenCorners] = useState<GreenCorner[]>([]);

  useEffect(() => {
    const triedProducts = getCookie('triedProducts')?.split(',') || [];
    setGreenCorners(
      productData.map(product => ({
        show: triedProducts.includes(String(product.id)),
        id: product.id,
      })),
    );
  }, [productData]);

  useEffect(() => {
    setCookie(
      'triedProducts',
      greenCorners
        .filter(gc => gc.show)
        .map(gc => String(gc.id))
        .join(','),
    );
  }, [greenCorners]);

  return { greenCorners, setGreenCorners };
};

export default useGreenCorners;
