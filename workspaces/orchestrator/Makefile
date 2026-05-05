workspace=orchestrator

# This variables defines the rhdh and dynamic-plugins-root paths.
#
# The default expects that you have this rhdh-plugins and the rhdh
# repo are cloned close to each other.
#
# If you don't have the org structure locally you can override this
# with make arguments like this:
#
#   make rhdh=../../../rhdh <command like copy>
#
# Or use an absolute path:
#
#   make rhdh=~/git/rhdh <command like copy>
rhdh=../../../rhdh

# Expand ~ to the user's home directory
override rhdh := $(patsubst ~%,$(HOME)%,$(rhdh))

# The dynamic-plugins-root path is relative to the plugins/* folders,
# so prepend ../../ only when rhdh is a relative path.
ifneq ($(filter /%,$(rhdh)),)
dproot=${rhdh}/dynamic-plugins-root
else
dproot=../../${rhdh}/dynamic-plugins-root
endif

clean=true

dev=true

fix:
	@echo
	@echo fix and format ${workspace} workspace
	@echo
	yarn tsc:full
	yarn build:api-reports:only

add-to-rhdh: add-frontend-to-rhdh add-backend-to-rhdh add-backend-modules-to-rhdh copy-config-to-rhdh

add-frontend-to-rhdh:
	@echo
	@echo Will build and install ${workspace} frontend plugins into ${rhdh}
	@echo
	cd plugins/custom-authentication-provider-module && npx --yes @red-hat-developer-hub/cli plugin export --dynamic-plugins-root "${dproot}" --clean "${clean}" --dev "${dev}"
	cd plugins/orchestrator && npx --yes @red-hat-developer-hub/cli plugin export --dynamic-plugins-root "${dproot}" --clean "${clean}" --dev "${dev}"
	cd plugins/orchestrator-form-widgets && npx --yes @red-hat-developer-hub/cli plugin export --dynamic-plugins-root "${dproot}" --clean "${clean}" --dev "${dev}"

add-backend-to-rhdh:
	@echo
	@echo Will build and install ${workspace} backend plugins into ${rhdh}
	@echo
	# Backend plugins need a two-step export: rhdh cli to build, then janus-idp cli to package.
	# Using only rhdh cli plugin export for backends causes RHDH to fail to start.
	# Clean existing dproot destinations to avoid "copy to subdirectory of itself" errors on re-runs.
	cd plugins/custom-authentication-provider-module-backend && rm -rf dist-dynamic "${dproot}/custom-authentication-provider-module-backend" && npx --yes @red-hat-developer-hub/cli@1.9.1 plugin export && npx --yes @janus-idp/cli package package-dynamic-plugins --export-to "${dproot}"
	cd plugins/orchestrator-backend && rm -rf dist-dynamic "${dproot}/red-hat-developer-hub-backstage-plugin-orchestrator-backend" && npx --yes @red-hat-developer-hub/cli@1.9.1 plugin export && npx --yes @janus-idp/cli package package-dynamic-plugins --export-to "${dproot}"

add-backend-modules-to-rhdh:
	@echo
	@echo Will build and install ${workspace} backend modules into ${rhdh}
	@echo
	# Backend modules also need the two-step export (see add-backend-to-rhdh).
	cd plugins/orchestrator-backend-module-loki && rm -rf dist-dynamic "${dproot}/red-hat-developer-hub-backstage-plugin-orchestrator-backend-module-loki" && npx --yes @red-hat-developer-hub/cli@1.9.1 plugin export && npx --yes @janus-idp/cli package package-dynamic-plugins --export-to "${dproot}"
	cd plugins/scaffolder-backend-module-orchestrator && rm -rf dist-dynamic "${dproot}/red-hat-developer-hub-backstage-plugin-scaffolder-backend-module-orchestrator" && npx --yes @red-hat-developer-hub/cli@1.9.1 plugin export --embed-package @red-hat-developer-hub/backstage-plugin-orchestrator-common && npx --yes @janus-idp/cli package package-dynamic-plugins --export-to "${dproot}"

copy-config-to-rhdh:
	@echo
	@echo Copy app-config.yaml into ${rhdh}
	@echo
	cp app-config.yaml "${rhdh}/app-config-orchestrator.local.yaml"
	@echo
	@echo You can start your rhdh now with
	@echo
	@echo yarn dev
	@echo

remove-from-rhdh:
	@echo
	@echo Remove packages from ${rhdh}
	@echo
	rm -rf "${dproot}/custom-authentication-provider-module"
	rm -rf "${dproot}/custom-authentication-provider-module-backend"
	rm -rf "${dproot}/red-hat-developer-hub-backstage-plugin-orchestrator"
	rm -rf "${dproot}/red-hat-developer-hub-backstage-plugin-orchestrator-backend"
	rm -rf "${dproot}/red-hat-developer-hub-backstage-plugin-orchestrator-backend-module-loki"
	rm -rf "${dproot}/red-hat-developer-hub-backstage-plugin-orchestrator-form-widgets"
	rm -rf "${dproot}/red-hat-developer-hub-backstage-plugin-scaffolder-backend-module-orchestrator"
	rm -f "${rhdh}/app-config-orchestrator.local.yaml"
