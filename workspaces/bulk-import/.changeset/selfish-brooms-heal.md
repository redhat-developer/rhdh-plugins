---
'@red-hat-developer-hub/backstage-plugin-bulk-import': patch
---

Improve Bulk Import UI performance by optimizing API call behavior:

- Prevent unnecessary API calls when switching between **Organizations** and **Repositories** tabs.
- Avoid redundant calls when clicking on pagination controls without changing page or page size.
- Suppress extraneous API requests triggered by random screen clicks.
- Introduce **debouncing** to the search input to reduce network load during fast typing.

These changes reduce client-side overhead and improve the responsiveness of the Bulk Import page.
