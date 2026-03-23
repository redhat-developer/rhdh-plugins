---
'@red-hat-developer-hub/backstage-plugin-dynamic-home-page': patch
---

Enhance home page layout adaptability when QuickStart is displayed.

Updated the homepage layout logic to utilize container width monitoring rather than relying on viewport-based Grid breakpoints. This change ensures the illustration card seamlessly switches to a vertical stack when the QuickStart drawer is open, independent of the user's screen resolution.

Additionally, introduced scrollbars to the onboarding, software catalog, and template sections for improved navigation and usability.
