# Backstage Plugin Internationalization (i18n) Guide

**Authors**: Rohit Rai  
**Version**: 1.0  
**Purpose**: Comprehensive guide for implementing i18n in Backstage plugins  
**Audience**: Developers and AI assistants

## Overview

This guide provides comprehensive patterns for implementing internationalization in Backstage plugins. It's designed as a source of truth for both AI assistants and developers.

**🚨 CRITICAL**: Never modify original English strings when implementing i18n - preserve them exactly as they were

**Example Languages**: German (de), French (fr), Italian (it), Spanish (es)

## Quick Implementation Checklist

For AI: Follow this exact sequence for any plugin translation:

- [ ] **1. Create translation reference** (`src/translations/ref.ts`)
- [ ] **2. Create language files** (`src/translations/{de,fr,it,es}.ts` - add more as needed)
- [ ] **3. Create translation resource** (`src/translations/index.ts`)
- [ ] **4. Create hooks** (`src/hooks/useTranslation.ts`, `src/hooks/useLanguage.ts`)
- [ ] **5. Create Trans component** (`src/components/Trans.tsx`)
- [ ] **6. Replace hardcoded strings** (components, utilities, constants)
- [ ] **7. Add translation key integrity test** (`src/translations/ref.test.ts`)
- [ ] **8. Add test mocks** (`src/test-utils/mockTranslations.ts`)
- [ ] **9. Update all tests** (apply mock pattern)
- [ ] **10. Configure app integration** (dev mode + main app)
- [ ] **11. Validate translations** (consistency, grammar, interpolation)

## Decision Trees

### When to Use What

```
String replacement needed?
├── Simple text → Use t('key')
├── Text with variables → Use t('key', {param: value})
├── JSX content/formatting → Use <Trans message="key" params={...} />
└── Reusable logic + fallbacks → Create utility function with t? parameter
```

### File Structure Decisions

```
Plugin structure:
src/
├── translations/
│   ├── ref.ts          # English messages (nested objects)
│   ├── ref.test.ts     # Key integrity test (ref vs language files)
│   ├── de.ts           # German (flat keys)
│   ├── fr.ts           # French (flat keys)
│   ├── it.ts           # Italian (flat keys)
│   ├── es.ts           # Spanish (flat keys)
│   │                   # Add more language files as needed
│   └── index.ts        # Translation resource
├── hooks/
│   ├── useTranslation.ts
│   └── useLanguage.ts
├── components/
│   └── Trans.tsx
└── test-utils/
    └── mockTranslations.ts
```

## Core Implementation Templates

### 1. Translation Reference (ref.ts)

```typescript
import { createTranslationRef } from '@backstage/core-plugin-api/alpha';

// CRITICAL: Export messages separately for testing
export const myPluginMessages = {
  page: {
    title: 'My Plugin',
    subtitle: 'Plugin description',
  },
  header: {
    title: 'Header Title',
    dateRange: {
      today: 'Today',
      lastWeek: 'Last week',
    },
  },
  table: {
    headers: {
      name: 'Name',
      count: 'Count',
    },
    pagination: {
      topN: 'Top {{count}}', // Use interpolation for dynamic values
    },
  },
  common: {
    exportCSV: 'Export CSV',
    csvFilename: 'data-export.csv',
    noResults: 'No results for this date range.',
  },
};

export const myPluginTranslationRef = createTranslationRef({
  id: 'plugin.my-plugin',
  messages: myPluginMessages,
});
```

### 2. Language Files Template

```typescript
// src/translations/de.ts
import { createTranslationMessages } from '@backstage/core-plugin-api/alpha';
import { myPluginTranslationRef } from './ref';

const myPluginTranslationDe = createTranslationMessages({
  ref: myPluginTranslationRef,
  messages: {
    // CRITICAL: Use flat dot notation, not nested objects
    'page.title': 'Mein Plugin',
    'page.subtitle': 'Plugin-Beschreibung',
    'header.title': 'Header-Titel',
    'header.dateRange.today': 'Heute',
    'header.dateRange.lastWeek': 'Letzte Woche',
    'table.headers.name': 'Name',
    'table.headers.count': 'Anzahl',
    'table.pagination.topN': 'Top {{count}}',
    'common.exportCSV': 'CSV exportieren',
    'common.csvFilename': 'daten-export.csv',
    'common.noResults': 'Keine Ergebnisse für diesen Zeitraum.',
  },
});

export default myPluginTranslationDe;
```

**Why Different Key Formats Matter:**

- ✅ Reference uses nested objects for TypeScript inference
- ✅ Translation files use flat keys for `createTranslationMessages` API
- ❌ Using nested objects in translation files causes TypeScript errors
- ❌ Using flat keys in reference breaks the mock testing approach

### 3. Translation Resource (index.ts)

```typescript
import { createTranslationResource } from '@backstage/core-plugin-api/alpha';
import { myPluginTranslationRef } from './ref';

export const myPluginTranslations = createTranslationResource({
  ref: myPluginTranslationRef,
  translations: {
    de: () => import('./de'),
    fr: () => import('./fr'),
    it: () => import('./it'),
    es: () => import('./es'),
    // Add more languages as needed
  },
});

export { myPluginTranslationRef };
```

### 4. Hooks Template

```typescript
// src/hooks/useTranslation.ts
import {
  useTranslationRef,
  TranslationFunction,
} from '@backstage/core-plugin-api/alpha';
import { myPluginTranslationRef } from '../translations';

export const useTranslation = (): {
  t: TranslationFunction<typeof myPluginTranslationRef.T>;
} => useTranslationRef(myPluginTranslationRef);

// src/hooks/useLanguage.ts
import { useApi } from '@backstage/core-plugin-api';
import { appLanguageApiRef } from '@backstage/core-plugin-api/alpha';

export const useLanguage = (): string =>
  useApi(appLanguageApiRef).getLanguage().language;
```

### 5. Trans Component Template

```typescript
// src/components/Trans.tsx
import { useTranslation } from '../hooks/useTranslation';
import { myPluginTranslationRef } from '../translations';

type Messages = typeof myPluginTranslationRef.T;

interface TransProps<TMessages extends { [key in string]: string }> {
  message: keyof TMessages;
  params?: any;
}

export const Trans = ({ message, params }: TransProps<Messages>) => {
  const { t } = useTranslation();
  return t(message, params);
};
```

## Implementation Patterns

### Key Naming Convention

- Use camelCase for key names
- Group by semantic hierarchy: `${page}.${section}.${element}`
- Common patterns:
  - `${page}.title` - Page titles
  - `${page}.subtitle` - Page subtitles
  - `${page}.header.title` - Header titles
  - `table.pagination.topN` - Use interpolation for dynamic values

### Component Translation

```typescript
import { useTranslation } from '../hooks/useTranslation';

const MyComponent = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('page.title')}</h1>
      <p>{t('table.pagination.topN' as any, { count: '5' })}</p>
      <Trans
        message="complex.interpolation"
        params={{ user: currentUser.name }}
      />
    </div>
  );
};
```

**Interpolation Guidelines:**

- Use `{{paramName}}` syntax for interpolation
- Pass parameters as strings: `{ count: '5' }`
- Use `as any` type assertion for dynamic keys: `t('dynamic.key' as any, params)`
- Use `Trans` component for complex JSX interpolation

### Utility Functions with Fallbacks

```typescript
import { TranslationFunction } from '@backstage/core-plugin-api/alpha';
import { myPluginTranslationRef } from '../translations';

export const formatDate = (
  date: Date,
  t?: TranslationFunction<typeof myPluginTranslationRef.T>,
) => {
  if (isToday(date)) {
    return t ? t('common.today') : 'Today';
  }
  if (isYesterday(date)) {
    return t ? t('common.yesterday') : 'Yesterday';
  }
  return format(date, 'dd MMMM yyyy');
};
```

### Constants with Translation Keys

```typescript
// GOOD: Use titleKey/labelKey for translation
export const TABLE_HEADERS = [
  { id: 'name', titleKey: 'table.headers.name' },
  { id: 'count', titleKey: 'table.headers.count' },
];

export const DATE_OPTIONS = [
  { value: 'today', labelKey: 'header.dateRange.today' },
  { value: 'lastWeek', labelKey: 'header.dateRange.lastWeek' },
];
```

## Advanced Patterns

### Pluralization

```typescript
// In messages
common: {
  itemCount: {
    zero: 'No items',
    one: '{{count}} item',
    other: '{{count}} items',
  },
}

// Usage
const getItemCountText = (count: number) => {
  if (count === 0) return t('common.itemCount.zero');
  if (count === 1) return t('common.itemCount.one', { count: count.toString() });
  return t('common.itemCount.other', { count: count.toString() });
};
```

### Conditional Translations

```typescript
// Permission-based content
const getMessage = (hasAdminAccess: boolean) => {
  return hasAdminAccess ? t('admin.welcomeMessage') : t('user.welcomeMessage');
};

// Feature flags
const getFeatureText = (featureEnabled: boolean) => {
  return featureEnabled
    ? t('features.enabled.text')
    : t('features.disabled.text');
};
```

### Dynamic Translation Loading

```typescript
// For large translation sets, load dynamically
const loadTranslations = async (category: string) => {
  const { t } = useTranslation();
  const keys = await import(`../translations/categories/${category}`);
  return keys.map(key => t(key));
};
```

### Localization with Intl APIs

```typescript
// Date formatting
const locale = useLanguage();
const formatDate = (date: Date) =>
  new Intl.DateTimeFormat(locale, {
    timeZone: new Intl.DateTimeFormat().resolvedOptions().timeZone,
    month: 'short',
    day: 'numeric',
  }).format(date);

// Number formatting
const formatNumber = (value: number) =>
  new Intl.NumberFormat(locale, {
    notation: 'compact',
  }).format(value);
```

**Key Principles:**

- ✅ **Use `Intl.NumberFormat`** instead of `.toLocaleString('en-US')`
- ✅ **Pass locale from `useLanguage()`** for consistent formatting
- ❌ **Avoid hardcoded locale strings** in components

## Testing Implementation

### Mock Helper (test-utils/mockTranslations.ts)

```typescript
import { myPluginMessages } from '../translations/ref';

function flattenMessages(obj: any, prefix = ''): Record<string, string> {
  const flattened: Record<string, string> = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'object' && value !== null) {
        Object.assign(flattened, flattenMessages(value, newKey));
      } else {
        flattened[newKey] = value;
      }
    }
  }
  return flattened;
}

const flattenedMessages = flattenMessages(myPluginMessages);

export const mockT = (key: string, params?: any) => {
  let message = flattenedMessages[key] || key;
  if (params) {
    for (const [paramKey, paramValue] of Object.entries(params)) {
      message = message.replace(
        new RegExp(`{{${paramKey}}}`, 'g'),
        String(paramValue),
      );
    }
  }
  return message;
};

export const mockUseTranslation = () => ({ t: mockT });
export const MockTrans = ({
  message,
  params,
}: {
  message: string;
  params?: any;
}) => mockT(message, params);
```

### Test Pattern

```typescript
// CRITICAL: Import mocks BEFORE components
import { MockTrans, mockUseTranslation } from '../../../test-utils/mockTranslations';

jest.mock('../../../hooks/useTranslation', () => ({
  useTranslation: mockUseTranslation,
}));

jest.mock('../../Trans', () => ({ Trans: MockTrans }));

// Component imports AFTER mocks
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('renders translated content', () => {
    render(<MyComponent />);
    expect(screen.getByText('Export CSV')).toBeInTheDocument();
  });
});
```

### Translation Key Integrity Test (ref.test.ts)

Add a test that verifies every language file has exactly the same keys as the
reference. This catches missing or stale keys early — before they surface as
runtime fallbacks.

```typescript
// src/translations/ref.test.ts
import { myPluginMessages } from './ref';
import myPluginTranslationDe from './de';
import myPluginTranslationEs from './es';
import myPluginTranslationFr from './fr';
import myPluginTranslationIt from './it';
// Import additional language modules as needed

function flattenMessages(
  obj: Record<string, unknown>,
  prefix = '',
): Record<string, string> {
  const flattened: Record<string, string> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
      ) {
        Object.assign(
          flattened,
          flattenMessages(value as Record<string, unknown>, newKey),
        );
      } else {
        flattened[newKey] = String(value);
      }
    }
  }
  return flattened;
}

const refKeys = new Set(
  Object.keys(flattenMessages(myPluginMessages as Record<string, unknown>)),
);
const refKeysSorted = Array.from(refKeys).sort();

const deMessages = flattenMessages(myPluginTranslationDe.messages);
const esMessages = flattenMessages(myPluginTranslationEs.messages);
const frMessages = flattenMessages(myPluginTranslationFr.messages);
const itMessages = flattenMessages(myPluginTranslationIt.messages);

const languageModules = [
  ['de', deMessages],
  ['es', esMessages],
  ['fr', frMessages],
  ['it', itMessages],
  // Add more languages as needed
] as const;

describe('ref (translation keys)', () => {
  it('has at least one key', () => {
    expect(refKeys.size).toBeGreaterThan(0);
  });

  describe.each(languageModules)('"%s" translations', (_lang, messages) => {
    describe('has exactly the same keys as ref (no more, no less)', () => {
      const langKeys = Object.keys(messages);
      const langKeysSet = new Set(langKeys);
      const langKeysSorted = [...langKeys].sort();

      const missing = refKeysSorted.filter(k => !langKeysSet.has(k));
      const extra = langKeysSorted.filter(k => !refKeys.has(k));

      it('should have no missing keys', () => {
        expect(missing).toEqual([]);
      });

      it('should have no extra keys', () => {
        expect(extra).toEqual([]);
      });

      it('should have the same number of keys as ref', () => {
        expect(langKeys).toHaveLength(refKeys.size);
      });
    });
  });
});
```

**Why this test matters:**

- Detects keys added to `ref.ts` but not yet translated
- Detects stale keys left in language files after a refactor
- Runs with standard `jest` - no extra dependencies needed
- `describe.each` keeps the output clear: each language gets its own test group

Update the checklist item count and the file structure to include this file when
setting up a new plugin.

## App Integration

### Development Mode

```typescript
// plugins/my-plugin/dev/index.tsx
import { myPluginTranslations } from '../src/translations';

createDevApp()
  .registerPlugin(myPluginPlugin)
  .addTranslationResource(myPluginTranslations)
  .setAvailableLanguages(['en', 'de', 'fr', 'it', 'es']) // Add more languages as needed
  .setDefaultLanguage('en')
  .addPage({
    /* ... */
  });
```

### Main App

```typescript
// packages/app/src/App.tsx
import { myPluginTranslations } from '@my-org/backstage-plugin-my-plugin';

const app = createApp({
  apis,
  __experimentalTranslations: {
    availableLanguages: ['en', 'de', 'fr', 'it', 'es'], // Add more languages as needed
    resources: [myPluginTranslations],
  },
});
```

## Translation Quality Guidelines

### Language-Specific Rules

**German**

- ✅ Compound words: `'Top-Vorlagen'` not `'Top Vorlagen'`
- ✅ Proper capitalization: `'Benutzer-Dashboard'`

**French**

- ✅ Proper apostrophes: `'Aujourd\'hui'`
- ✅ Space separation: `'Top recherches'` not `'Top-Recherches'`

**Italian**

- ✅ Article agreement: `'Gli utenti attivi'`
- ✅ Adjective agreement: `'utenti attivi'`, `'nuovi utenti'`

**Spanish**

- ✅ Gender agreement: `'Usuarios activos'` (masculine)
- ✅ Accent marks: `'último'`, `'período'`, `'búsquedas'`

### General Quality Checklist

- [ ] **No untranslated strings** - All keys fully translated
- [ ] **Consistent terminology** - Same terms across related keys
- [ ] **Interpolation preservation** - All `{{parameter}}` patterns match
- [ ] **Cultural adaptation** - Concepts adapted, not literal translations
- [ ] **Localized filenames** - CSV exports use translated names

## Validation Steps

### Pre-Implementation

1. Identify all hardcoded strings in components
2. Group strings by semantic meaning (page, table, common, etc.)
3. Plan key structure using hierarchical naming

### During Implementation

1. Replace strings incrementally by component
2. Test each component after translation
3. Verify interpolation works correctly

### Post-Implementation

1. Test language switching functionality
2. Verify fallback behavior (missing translations → English)
3. Check E2E tests expect translated strings
4. Validate all translation files have identical key sets

## Common Patterns Reference

| Use Case         | Pattern                     | Example                                           |
| ---------------- | --------------------------- | ------------------------------------------------- |
| Simple text      | `t('key')`                  | `t('page.title')`                                 |
| With variables   | `t('key', {param})`         | `t('table.topN', {count: '5'})`                   |
| Dynamic keys     | `t('key' as any, {param})`  | `t('table.topN' as any, {count: '3'})`            |
| JSX content      | `<Trans />`                 | `<Trans message="complex.text" params={{...}} />` |
| Utility fallback | `t ? t('key') : 'fallback'` | `t ? t('common.today') : 'Today'`                 |
| Constants        | `titleKey/labelKey`         | `{titleKey: 'table.headers.name'}`                |

## References

- [Backstage i18n Documentation](https://backstage.io/docs/plugins/internationalization)
- [Translation API Reference](https://backstage.io/docs/reference/core-plugin-api.translation)
- Package: `@backstage/core-plugin-api/alpha`

---

**Success Metrics**: Zero hardcoded strings, 100% test coverage with real translations, seamless language switching.
