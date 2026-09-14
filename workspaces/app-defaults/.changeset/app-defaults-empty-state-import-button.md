---
'@red-hat-developer-hub/backstage-plugin-app-defaults': patch
---

Move the empty-state action button into `EmptyCatalogGate`. Custom pages now pass an `importButtonTitle` string instead of an `action` element, and the gate renders a single "import" button. The button is only shown when the `page:catalog-import` extension is installed (its route is also used to resolve the button's href) and the user has permission to create catalog entities (`catalog.entity.create`).
