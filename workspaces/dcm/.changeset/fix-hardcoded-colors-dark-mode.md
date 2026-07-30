---
'@red-hat-developer-hub/backstage-plugin-dcm': patch
---

Replace hardcoded colors and shadows with theme-aware values for dark mode support.

- ProviderStatus: chip border now uses `theme.palette.divider` instead of `rgba(0,0,0,0.2)`
- CopyButton: "copied" checkmark color now uses `theme.palette.success.main` instead of `#28a745`
- dcmStyles: overview card box-shadow is suppressed in dark mode via `theme.palette.type` check
