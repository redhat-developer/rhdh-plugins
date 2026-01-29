
<b>Pattern 1: Keep release/versioning and workspace package metadata aligned with the repo’s publishing model: use the smallest semver bump that matches the change (often patch), keep workspace aggregator packages private, and avoid changes that would force unrelated packages to be released together.
</b>

Example code before:
```
// package.json
{
  "name": "@internal/some-workspace",
  "version": "0.1.0",
  "private": false
}
```

Example code after:
```
// package.json
{
  "name": "@internal/some-workspace",
  "version": "0.0.0",
  "private": true
}
```

<details><summary>Examples for relevant past discussions:</summary>

- https://github.com/redhat-developer/rhdh-plugins/pull/2186#discussion_r2736099022
- https://github.com/redhat-developer/rhdh-plugins/pull/2112#discussion_r2707300130
- https://github.com/redhat-developer/rhdh-plugins/pull/1982#discussion_r2686294901
</details>


___

<b>Pattern 2: Make e2e tests deterministic and resilient by avoiding static waits and unnecessary regex/translation-driven selectors; prefer stable role/name selectors with fixed expected values and assert only what truly varies by locale.
</b>

Example code before:
```
await page.waitForTimeout(5000);
await expect(
  page.getByText(new RegExp(`Total: ${count}`))
).toBeVisible();

await page.getByRole('button', { name: translations.fab.menu.tooltip }).click();
```

Example code after:
```
await page.getByRole('button', { name: 'menu' }).click();
await expect(page.getByText('Total: 1')).toBeVisible();
await expect(page.locator('.recharts-surface')).toBeVisible();
```

<details><summary>Examples for relevant past discussions:</summary>

- https://github.com/redhat-developer/rhdh-plugins/pull/2097#discussion_r2720360087
- https://github.com/redhat-developer/rhdh-plugins/pull/2097#discussion_r2720322727
- https://github.com/redhat-developer/rhdh-plugins/pull/2097#discussion_r2720921893
- https://github.com/redhat-developer/rhdh-plugins/pull/2097#discussion_r2720932269
- https://github.com/redhat-developer/rhdh-plugins/pull/2097#discussion_r2720325741
</details>


___

<b>Pattern 3: Prefer reuse of existing shared patterns/components and clean separations of concerns over introducing new custom logic: reuse established icon-resolution logic, model UI features via existing data contracts, and split combined hooks/state so unrelated changes don’t cause extra rerenders or maintenance burden.
</b>

Example code before:
```
// Custom icon parsing duplicated in multiple places
function renderIcon(icon: string) {
  if (icon.startsWith('<svg')) return <span dangerouslySetInnerHTML={{ __html: icon }} />;
  return <img src={icon} />;
}

// One hook handles both sorting and pinning
const { sort, togglePin } = useChatPreferences();
```

Example code after:
```
// Reuse shared icon component / logic
<FabIcon icon={icon} />

// Separate hooks to isolate concerns
const { sort } = useConversationSorting();
const { pinned, togglePin } = usePinnedConversations();
```

<details><summary>Examples for relevant past discussions:</summary>

- https://github.com/redhat-developer/rhdh-plugins/pull/1989#discussion_r2680986988
- https://github.com/redhat-developer/rhdh-plugins/pull/2003#discussion_r2675242406
- https://github.com/redhat-developer/rhdh-plugins/pull/2054#discussion_r2685310445
</details>


___

<b>Pattern 4: Avoid breaking changes and brittle coupling by keeping public APIs/exports/config/docs consistent: don’t drop API capabilities likely needed later, validate unsupported parameter combinations explicitly, ensure required exports exist to avoid runtime UI breakage, and link user-facing UI/docs to stable official documentation (and keep tests in sync with those links).
</b>

Example code before:
```
// router.ts
router.get('/metrics', async (req, res) => {
  // silently ignores unsupported combinations
  const { metricIds, datasource } = req.query as any;
  res.json(await service.list({ metricIds, datasource }));
});

// index.ts (missing export)
// (no exports)

// UI links to repo README
<Button href="https://github.com/org/repo/blob/main/README.md#section">Read more</Button>
```

Example code after:
```
// router.ts
if (metricIds && datasource) {
  throw new InputError('Specify only one of metricIds or datasource');
}

// index.ts
export * from './NewProjectPage';

// UI uses stable docs URL
<Button href="https://docs.redhat.com/...">Read more</Button>
```

<details><summary>Examples for relevant past discussions:</summary>

- https://github.com/redhat-developer/rhdh-plugins/pull/2143#discussion_r2725430640
- https://github.com/redhat-developer/rhdh-plugins/pull/2020#discussion_r2681197510
- https://github.com/redhat-developer/rhdh-plugins/pull/2020#discussion_r2682042987
- https://github.com/redhat-developer/rhdh-plugins/pull/2035#discussion_r2686379749
- https://github.com/redhat-developer/rhdh-plugins/pull/2035#discussion_r2686382532
</details>


___
