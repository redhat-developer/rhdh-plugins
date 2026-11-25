# Software Index

This workspace is being developed to provide a software index of Red Hat products
and container repositories using Container Catalog/Pyxis data. It aims to help
product, program management, and engineering teams identify ownership and track
container image health.

The initial Pyxis integration is planned to support:

- Automatic catalog ingestion of Red Hat products, repositories, and their
  ownership information, without manual onboarding by end users.
- Image browsing by product or repository, grouped by tags or content streams
  and accounting for multiple architectures.
- Container Health Index (CHI) grades and scheduled grade drops, alongside image
  advisories and vulnerabilities.
- Prograde-like notifications when a grade drops or a new drop schedule appears.

## Status

This workspace currently contains scaffolding only. Plugin packages and the
capabilities described above have not yet been implemented.

## Development

Use the Node.js and Yarn versions specified by the repository. From this workspace
directory, install dependencies with:

```sh
yarn install
```

This workspace targets DevHub running RHDH 1.10.3 (Backstage 1.49.4). The Backstage
tooling and `backstage.json` use that baseline, with resolved dependency versions
recorded in `yarn.lock`.

To create a plugin or module in this workspace:

```sh
yarn new
```

There is no runnable application in the scaffold yet. Development and verification
instructions will be expanded as plugin packages are added.

Maintainers are listed in [CODEOWNERS](../../.github/CODEOWNERS).
