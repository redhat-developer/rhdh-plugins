# Defaults

The dynamic home page allows admins to customize the homepage in the `app-config`, and plugin authors to extend the home page with additional cards or content.

Additional cards can automatically appear based on installed and enabled plugins.

## Default home page

The default home page shows a "Onboarding Section" card, a "Entity Section" card, and a "Template Section" card by default.

![Default home page](default-homepage.png)

The customization can happen in any loaded `app-config` from the `dynamicPlugins` section.

The home page loads automatically a configuration like this, when no other configiration is passed:

```yaml
dynamicPlugins:
  frontend:
    red-hat-developer-hub.backstage-plugin-dynamic-home-page:
      dynamicRoutes:
        - path: /
          importName: DynamicHomePage
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
              xxs: { w: 12, h: 13 }
        - mountPoint: home.page/cards
          importName: EntitySection
          config:
            layouts:
              xl: { w: 12, h: 6 }
              lg: { w: 12, h: 6 }
              md: { w: 12, h: 6 }
              sm: { w: 12, h: 6 }
              xs: { w: 12, h: 10 }
              xxs: { w: 12, h: 14.5 }
        - mountPoint: home.page/cards
          importName: TemplateSection
          config:
            layouts:
              xl: { w: 12, h: 5 }
              lg: { w: 12, h: 5 }
              md: { w: 12, h: 5 }
              sm: { w: 12, h: 5 }
              xs: { w: 12, h: 7.5 }
              xxs: { w: 12, h: 13.5 }
```

## Adding cards from a plugin

Plugins can add additional cards/content by exporting a react component.

Each card can have a `layouts` definition and `props` that are depending on the used component like this:

```yaml
dynamicPlugins:
  frontend:
    red-hat-developer-hub.backstage-plugin-dynamic-home-page:
      mountPoints:
        - mountPoint: home.page/cards
          importName: Headline
          config:
            layouts:
              xl: { h: 1 }
              lg: { h: 1 }
              md: { h: 1 }
              sm: { h: 1 }
              xs: { h: 1 }
              xxs: { h: 1 }
            props:
              title: Important info
```
