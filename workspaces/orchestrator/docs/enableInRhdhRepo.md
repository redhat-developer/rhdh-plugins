## 🔌 Enabling the Orchestrator Plugin in rhdh repo locally

To enable the Orchestrator plugin in your [Red Hat Developer Hub (RHDH)](https://github.com/redhat-developer/rhdh) setup, run the following command from the workspaces/orchestrator directory:

```bash
yarn enable-in-rhdh-repo
```

This script will:

- Export both the frontend and backend of the plugin as dynamic plugins and copy the result to dynamic-plugins-root in rhdh repo.
- Add the necessary configuration to your RHDH `app-config.local.yaml`. If it doesn’t exist, it copies a ready-to-use config from `scripts/config-for-rhdh-repo.yaml` — a better starting point than `app-config.example.yaml`, with defaults that work out of the box.
- Avoid duplicate configuration if it's already present

### 📁 Required Directory Layout

The script assumes that your local clone of the RHDH repo is located **alongside** your `rhdh-plugins` (or equivalent) monorepo. Specifically:

```bash
your-workspace/
├── rhdh/                  # Clone of https://github.com/redhat-developer/rhdh
  └── dynamic-plugin-root/
└── rhdh-plugins/          # This repo, where the orchestrator plugin lives
  └── workspaces/
    └── orchestrator/
      ├── plugins/
      │   ├── orchestrator/
      │   └── orchestrator-backend/
      └── enable-in-rhdh-repo.sh
```

If you follow this layout, the script will work out of the box.  
If your RHDH repo is in a different location, you can override the path by setting the `RHDH_DIR` environment variable:

```bash
RHDH_DIR=~/path/to/rhdh yarn enable-in-rhdh-repo
```
