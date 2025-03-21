# Top visited

> [!CAUTION]
> This feature is not part of RHDH 1.3 and 1.4, it is planned for RHDH 1.5.

Shows the top visited pages (incl. catalog entities) the current user visited.

![Home page with top visited card](top-visited.png)

## Example

```yaml
dynamicPlugins:
  frontend:
    red-hat-developer-hub.backstage-plugin-dynamic-home-page:
      mountPoints:
        - mountPoint: home.page/cards
          importName: TopVisitedCard
```

## Contributions

The dynamic home page plugin reexports the [`HomePageTopVisited`](https://github.com/backstage/backstage/tree/master/plugins/home/src/homePageComponents/VisitedByType) from the [home plugin](https://github.com/backstage/backstage/tree/master/plugins/home).
