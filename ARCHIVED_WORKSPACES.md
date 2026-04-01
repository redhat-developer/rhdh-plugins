# Archived Workspaces

This document contains a list of workspaces and plugins that have been archived from the rhdh-plugins repository.

## About Archived Workspaces

When a workspace or plugin is archived:

- The code is no longer actively maintained
- The npm packages are deprecated with a deprecation message
- The workspace/plugin is removed from the active codebase
- A Git tag can provide historical reference to the source
- An entry is added to this document for reference

To archive a workspace or plugin, use the `archive-workspace` script:

```bash
# Archive an entire workspace
./scripts/archive-workspace workspace-name

# Archive a specific plugin within a workspace
./scripts/archive-workspace workspace-name plugin-name
```

## Archived Items

| Workspace                | Package                                                            | Reason               | Source                                                                                                                                                                                                                                           |
| ------------------------ | ------------------------------------------------------------------ | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| openshift-image-registry | `@red-hat-developer-hub/backstage-plugin-openshift-image-registry` | No longer maintained | [@red-hat-developer-hub/backstage-plugin-openshift-image-registry@1.18.0](https://github.com/redhat-developer/rhdh-plugins/tree/%40red-hat-developer-hub/backstage-plugin-openshift-image-registry%401.18.0/workspaces/openshift-image-registry) |
