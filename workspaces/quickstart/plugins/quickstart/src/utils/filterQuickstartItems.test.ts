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

import { filterQuickstartItemsByRole } from './filterQuickstartItems';
import { QuickstartItemData } from '../types';

describe('filterQuickstartItemsByRole', () => {
  const testItems: QuickstartItemData[] = [
    // Admin-only item
    {
      title: 'Admin Step 1',
      description: 'Admin task',
      icon: 'admin',
      roles: ['admin'],
      cta: { text: 'Start', link: '#' },
    },
    // Developer-only item
    {
      title: 'Developer Step 1',
      description: 'Developer task',
      icon: 'code',
      roles: ['developer'],
      cta: { text: 'Code', link: '#' },
    },
    // Multi-role item (admin + developer)
    {
      title: 'Multi Role Step',
      description: 'Task for both roles',
      icon: 'multi',
      roles: ['admin', 'developer'],
      cta: { text: 'Multi', link: '#' },
    },
    // Item with no roles (should default to admin)
    {
      title: 'No Roles Step',
      description: 'Task with no roles',
      icon: 'default',
      cta: { text: 'Default', link: '#' },
    },
    // Item with empty roles array (should default to admin)
    {
      title: 'Empty Roles Step',
      description: 'Task with empty roles',
      icon: 'empty',
      roles: [],
      cta: { text: 'Empty', link: '#' },
    },
    // Manager-only item
    {
      title: 'Manager Step 1',
      description: 'Manager task',
      icon: 'manager',
      roles: ['manager'],
      cta: { text: 'Manage', link: '#' },
    },
  ];

  describe('Basic role filtering', () => {
    it('filters items for admin role', () => {
      const result = filterQuickstartItemsByRole(testItems, 'admin');

      expect(result).toHaveLength(4);
      expect(result.map(item => item.title)).toEqual([
        'Admin Step 1',
        'Multi Role Step',
        'No Roles Step', // defaults to admin
        'Empty Roles Step', // defaults to admin
      ]);
    });

    it('filters items for developer role', () => {
      const result = filterQuickstartItemsByRole(testItems, 'developer');

      expect(result).toHaveLength(2);
      expect(result.map(item => item.title)).toEqual([
        'Developer Step 1',
        'Multi Role Step',
      ]);
    });

    it('filters items for manager role', () => {
      const result = filterQuickstartItemsByRole(testItems, 'manager');

      expect(result).toHaveLength(1);
      expect(result.map(item => item.title)).toEqual(['Manager Step 1']);
    });

    it('returns empty array for non-existent role', () => {
      const result = filterQuickstartItemsByRole(testItems, 'nonexistent');

      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });
  });

  describe('Default role behavior', () => {
    it('treats items with undefined roles as admin items', () => {
      const itemsWithUndefinedRoles: QuickstartItemData[] = [
        {
          title: 'Undefined Roles',
          description: 'No roles property',
          icon: 'default',
          cta: { text: 'Start', link: '#' },
        },
      ];

      const adminResult = filterQuickstartItemsByRole(
        itemsWithUndefinedRoles,
        'admin',
      );
      const developerResult = filterQuickstartItemsByRole(
        itemsWithUndefinedRoles,
        'developer',
      );

      expect(adminResult).toHaveLength(1);
      expect(adminResult[0].title).toBe('Undefined Roles');

      expect(developerResult).toHaveLength(0);
    });

    it('treats items with empty roles array as admin items', () => {
      const itemsWithEmptyRoles: QuickstartItemData[] = [
        {
          title: 'Empty Roles Array',
          description: 'Empty roles array',
          icon: 'default',
          roles: [],
          cta: { text: 'Start', link: '#' },
        },
      ];

      const adminResult = filterQuickstartItemsByRole(
        itemsWithEmptyRoles,
        'admin',
      );
      const developerResult = filterQuickstartItemsByRole(
        itemsWithEmptyRoles,
        'developer',
      );

      expect(adminResult).toHaveLength(1);
      expect(adminResult[0].title).toBe('Empty Roles Array');

      expect(developerResult).toHaveLength(0);
    });
  });

  describe('Multi-role support', () => {
    it('includes items that have multiple roles when user has one of them', () => {
      const multiRoleItems: QuickstartItemData[] = [
        {
          title: 'Admin Developer Item',
          description: 'For admin and developer',
          icon: 'multi',
          roles: ['admin', 'developer'],
          cta: { text: 'Multi', link: '#' },
        },
        {
          title: 'Developer Manager Item',
          description: 'For developer and manager',
          icon: 'multi2',
          roles: ['developer', 'manager'],
          cta: { text: 'Multi2', link: '#' },
        },
      ];

      const adminResult = filterQuickstartItemsByRole(multiRoleItems, 'admin');
      expect(adminResult).toHaveLength(1);
      expect(adminResult[0].title).toBe('Admin Developer Item');

      const developerResult = filterQuickstartItemsByRole(
        multiRoleItems,
        'developer',
      );
      expect(developerResult).toHaveLength(2);
      expect(developerResult.map(item => item.title)).toEqual([
        'Admin Developer Item',
        'Developer Manager Item',
      ]);

      const managerResult = filterQuickstartItemsByRole(
        multiRoleItems,
        'manager',
      );
      expect(managerResult).toHaveLength(1);
      expect(managerResult[0].title).toBe('Developer Manager Item');
    });
  });

  describe('Edge cases', () => {
    it('handles empty input array', () => {
      const result = filterQuickstartItemsByRole([], 'admin');

      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });

    it('handles empty user role string', () => {
      const result = filterQuickstartItemsByRole(testItems, '');

      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });

    it('is case sensitive for role matching', () => {
      const caseTestItems: QuickstartItemData[] = [
        {
          title: 'Lowercase Role',
          description: 'lowercase admin role',
          icon: 'test',
          roles: ['admin'],
          cta: { text: 'Test', link: '#' },
        },
      ];

      const lowerResult = filterQuickstartItemsByRole(caseTestItems, 'admin');
      const upperResult = filterQuickstartItemsByRole(caseTestItems, 'ADMIN');
      const mixedResult = filterQuickstartItemsByRole(caseTestItems, 'Admin');

      expect(lowerResult).toHaveLength(1);
      expect(upperResult).toHaveLength(0);
      expect(mixedResult).toHaveLength(0);
    });

    it('preserves original item structure in results', () => {
      const singleItem: QuickstartItemData[] = [
        {
          title: 'Test Item',
          description: 'Test description',
          icon: 'test',
          roles: ['admin'],
          cta: { text: 'Test CTA', link: '#test' },
        },
      ];

      const result = filterQuickstartItemsByRole(singleItem, 'admin');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(singleItem[0]);
      expect(result[0].title).toBe('Test Item');
      expect(result[0].description).toBe('Test description');
      expect(result[0].icon).toBe('test');
      expect(result[0].roles).toEqual(['admin']);
      expect(result[0].cta).toEqual({ text: 'Test CTA', link: '#test' });
    });

    it('does not mutate original items array', () => {
      const originalItems = [...testItems];
      const originalFirstItem = { ...testItems[0] };

      filterQuickstartItemsByRole(testItems, 'admin');

      expect(testItems).toHaveLength(originalItems.length);
      expect(testItems[0]).toEqual(originalFirstItem);
    });
  });

  describe('Real-world scenarios', () => {
    it('handles mixed configuration scenarios', () => {
      const mixedItems: QuickstartItemData[] = [
        // Standard admin item
        {
          title: 'Admin Only',
          description: '',
          icon: '',
          roles: ['admin'],
          cta: { text: '', link: '' },
        },
        // Standard developer item
        {
          title: 'Developer Only',
          description: '',
          icon: '',
          roles: ['developer'],
          cta: { text: '', link: '' },
        },
        // Legacy item without roles (defaults to admin)
        {
          title: 'Legacy Item',
          description: '',
          icon: '',
          cta: { text: '', link: '' },
        },
        // Shared item
        {
          title: 'Shared Item',
          description: '',
          icon: '',
          roles: ['admin', 'developer', 'manager'],
          cta: { text: '', link: '' },
        },
        // Different role
        {
          title: 'QA Only',
          description: '',
          icon: '',
          roles: ['qa'],
          cta: { text: '', link: '' },
        },
      ];

      const adminResult = filterQuickstartItemsByRole(mixedItems, 'admin');
      expect(adminResult.map(item => item.title)).toEqual([
        'Admin Only',
        'Legacy Item', // defaults to admin
        'Shared Item',
      ]);

      const developerResult = filterQuickstartItemsByRole(
        mixedItems,
        'developer',
      );
      expect(developerResult.map(item => item.title)).toEqual([
        'Developer Only',
        'Shared Item',
      ]);

      const qaResult = filterQuickstartItemsByRole(mixedItems, 'qa');
      expect(qaResult.map(item => item.title)).toEqual(['QA Only']);

      const unknownResult = filterQuickstartItemsByRole(mixedItems, 'unknown');
      expect(unknownResult).toEqual([]);
    });
  });
});
