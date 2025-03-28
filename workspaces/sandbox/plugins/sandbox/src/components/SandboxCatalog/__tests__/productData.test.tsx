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
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import { Product, productData } from '../productData';

describe('productData', () => {
  describe('Product enum', () => {
    it('should have all expected product values', () => {
      expect(Product.OPENSHIFT_CONSOLE).toBe('openshift-console');
      expect(Product.OPENSHIFT_AI).toBe('red-hat-data-science');
      expect(Product.DEVSPACES).toBe('devspaces');
      expect(Product.AAP).toBe('ansible-automation-platform');
      expect(Product.OPENSHIFT_VIRT).toBe('openshift-virtualization');
    });
  });

  describe('productData array', () => {
    it('should contain data for all products', () => {
      const productIds = productData.map(product => product.id);
      expect(productIds).toEqual([
        Product.OPENSHIFT_CONSOLE,
        Product.OPENSHIFT_AI,
        Product.DEVSPACES,
        Product.AAP,
        Product.OPENSHIFT_VIRT,
      ]);
    });

    it('should have required properties for each product', () => {
      productData.forEach(product => {
        expect(product).toHaveProperty('id');
        expect(product).toHaveProperty('title');
        expect(product).toHaveProperty('image');
        expect(product).toHaveProperty('description');
        expect(Array.isArray(product.description)).toBe(true);
      });
    });

    it('should have valid description items for each product', () => {
      productData.forEach(product => {
        product.description.forEach(item => {
          expect(item).toHaveProperty('icon');
          expect(item).toHaveProperty('value');
          expect(typeof item.value).toBe('string');
          expect(React.isValidElement(item.icon)).toBe(true);
        });
      });
    });
  });

  describe('icon generation', () => {
    // Access the private getSandboxCatalogCardIcon function
    // We need to get it from a description item since it's not exported
    const successIcon = productData[0].description[0].icon;
    const warningIcon = productData[3].description[4].icon; // AAP's warning icon

    it('should use TaskAltRoundedIcon for success status', () => {
      expect(successIcon.type).toBe(TaskAltRoundedIcon);
      expect(successIcon.props.htmlColor).toBe('#8476D1');
    });

    it('should use ErrorOutlineRoundedIcon for warning status', () => {
      expect(warningIcon.type).toBe(ErrorOutlineRoundedIcon);
      expect(warningIcon.props.htmlColor).toBe('#009596');
    });

    it('should have correct icon sizing', () => {
      const expectedSx = { width: '16px' };
      expect(successIcon.props.sx).toEqual(expectedSx);
      expect(warningIcon.props.sx).toEqual(expectedSx);
    });
  });

  describe('specific product data', () => {
    it('should have correct OpenShift Console data', () => {
      const openshift = productData.find(
        p => p.id === Product.OPENSHIFT_CONSOLE,
      );
      expect(openshift).toBeDefined();
      expect(openshift?.title).toBe('OpenShift');
      expect(openshift?.description).toHaveLength(4);
    });

    it('should have correct OpenShift AI data', () => {
      const openshiftAI = productData.find(p => p.id === Product.OPENSHIFT_AI);
      expect(openshiftAI).toBeDefined();
      expect(openshiftAI?.title).toBe('OpenShift AI');
      expect(openshiftAI?.description).toHaveLength(5);
    });

    it('should have correct AAP warning message', () => {
      const aap = productData.find(p => p.id === Product.AAP);
      const warningMessage = aap?.description[4];
      expect(warningMessage?.value).toBe('20-minute environment provisioning');
      expect(warningMessage?.icon.type).toBe(ErrorOutlineRoundedIcon);
    });
  });
});
