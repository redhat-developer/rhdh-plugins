---
'@red-hat-developer-hub/backstage-plugin-bulk-import': major
---

**BREAKING**: Graduated the New Frontend System (NFS) bulk-import plugin to stable API.

The NFS plugin (`createFrontendPlugin`) has been promoted from the `./alpha` subpath to the primary `.` entry point. The `./alpha` subpath now only exports translations. Legacy (OFS) exports (`bulkImportPlugin`, `BulkImportPage`, `BulkImportSidebarItem`, `BulkImportIcon`) have been moved to the new `./legacy` subpath.

**Migration for NFS consumers (previously using `./alpha`):**

```diff
- import bulkImportPlugin, { bulkImportTranslationsModule } from '@red-hat-developer-hub/backstage-plugin-bulk-import/alpha';
+ import bulkImportPlugin, { bulkImportTranslationsModule } from '@red-hat-developer-hub/backstage-plugin-bulk-import';
```

**Migration for OFS consumers:**

```diff
- import { BulkImportPage } from '@red-hat-developer-hub/backstage-plugin-bulk-import';
+ import { BulkImportPage } from '@red-hat-developer-hub/backstage-plugin-bulk-import/legacy';
```

**Migration for dynamic plugin configurations:**

Legacy exports require `module: Legacy` — they are not available on the default module.

```yaml
dynamicPlugins:
  frontend:
    red-hat-developer-hub.backstage-plugin-bulk-import:
      # Legacy exports require `module: Legacy`
      dynamicRoutes:
        - path: /bulk-import
          importName: BulkImportPage
          module: Legacy
```
