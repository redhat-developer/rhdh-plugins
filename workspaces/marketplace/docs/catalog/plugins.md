# Plugins

## User facing attributes

| Attribute              | Type                               | Description                                                                               |
| ---------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------- |
| `metadata.description` | `string`                           | Short description that is shown on the cards (text)                                       |
| `spec.author`          | `string`                           | A single author name, this attribute is automatically converted to `authors` if specified |
| `spec.authors`         | `{ name: string, url?: string }[]` | Authors array if a plugin is developed by multiple authors                                |
| `spec.categories`      | `string[]`                         | Categories are displayed directly as filter and labels                                    |
| `spec.highlights`      | `string[]`                         | Highlights for the details page                                                           |
| `spec.description`     | `string`                           | Full description that is shown on the details page (markdown)                             |
| `spec.installation`    | `string`                           | Full installation description that is shown later on the install page (markdown)          |
| `spec.icon`            | `string`                           | Icon URL                                                                                  |

## Annotations

### Certification

```yaml
metadata:
  annotations:
    marketplace.backstage.io/certified-by: Company name
```

### Verification

```yaml
metadata:
  annotations:
    marketplace.backstage.io/verified-by: Company name
```

### Support type for Core and Community plugins

```yaml
metadata:
  annotations:
    marketplace.backstage.io/support-type: Core plugins | Community plugins
```

### Pre-installed / custom plugin

```yaml
metadata:
  annotations:
    marketplace.backstage.io/pre-installed: 'true'
```
