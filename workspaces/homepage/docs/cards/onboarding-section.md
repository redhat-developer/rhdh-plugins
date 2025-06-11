# Onboarding section card

The Learn Section Card is designed to help users quickly discover learning resources within RHDH. Positioned prominently on the homepage, it serves as a starting point for onboarding, exploring docs, and deepening knowledge of core RHDH features.

> 🎯 Ideal for improving user orientation and encouraging self-guided learning across the platform.

![Home page with onBoarding section card](onboarding-section.png)

## Example

```yaml
dynamicPlugins:
  frontend:
    red-hat-developer-hub.backstage-plugin-dynamic-home-page:
      mountPoints:
        - mountPoint: home.page/cards
          importName: OnboardingSection
          config:
            layouts:
              xl: { w: 12, h: 5 }
              lg: { w: 12, h: 5 }
              md: { w: 12, h: 5 }
              sm: { w: 12, h: 5 }
              xs: { w: 12, h: 7 }
              xxs: { w: 12, h: 12 }
```
