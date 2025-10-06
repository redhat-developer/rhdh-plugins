# RHDH Home Page plugin

The RHDH home page plugin is based on the upstream [home plugin](https://github.com/backstage/backstage/blob/master/plugins/home/README.md).

It allows primarily **admins** to customize the homepage in the `app-config`, and plugin authors to extend the home page with additional cards or content.

The plugin supports two mount points:

- **`home.page/cards`** - Default homepage cards that appear by default
- **`home.page/add-card`** - Additional cards contributed by other plugins

The default home page shows a Search input field, a "Quick Access" card, and a "Your Starred Entities" card by default.

Additional cards can automatically appear based on installed and enabled plugins.

![Default home page](default-homepage.png)
