workspace=marketplace

# This variables defines the showcase and dynamic-plugins-root paths.
#
# The default expects that you have this redhat-developer/rhdh-plugins
# repo and janus-idp/backstage-showcase repo side by side incl. the
# org structure.
#
# If you don't have the org structure locally you can override this
# with make arguments like this:
#
#   make showcase=../../../backstage-showcase <command like copy>
#
# Or use an absolute path:
#
#   make showcase=~/git/backstage-showcase <command like copy>
showcase=../../../../janus-idp/backstage-showcase

# The dynamic-plugins-root has two more ../.. because it's relative
# to the plugins/* folders
dproot=../../${showcase}/dynamic-plugins-root

clean=true

dev=true

fix:
	@echo
	@echo fix and format ${workspace} workspace
	@echo
	yarn tsc:full
	yarn build:api-reports:only

add-to-showcase: add-frontend-to-showcase add-backend-to-showcase add-catalog-modules-to-showcase copy-config-to-showcase

add-frontend-to-showcase:
	@echo
	@echo Will build and install ${workspace} frontend into ${showcase}
	@echo
	cd plugins/marketplace && npx --yes @janus-idp/cli package export-dynamic-plugin --dynamic-plugins-root "${dproot}" --clean "${clean}" --dev "${dev}"

add-backend-to-showcase:
	@echo
	@echo Will build and install ${workspace} backend into ${showcase}
	@echo
	cd plugins/marketplace-backend && npx --yes @janus-idp/cli package export-dynamic-plugin --dynamic-plugins-root "${dproot}" --clean "${clean}" --dev "${dev}"

add-catalog-modules-to-showcase:
	@echo
	@echo Will build and install catalog modules into ${showcase}
	@echo
	cd plugins/catalog-backend-module-marketplace && npx --yes @janus-idp/cli package export-dynamic-plugin --dynamic-plugins-root "${dproot}" --clean "${clean}" --dev "${dev}" --embed-package "@red-hat-developer-hub/backstage-plugin-marketplace-common"

copy-config-to-showcase:
	@echo
	@echo Copy app-config.dynamic.yaml into ${showcase}
	@echo
	cp app-config.dynamic.yaml "${showcase}/app-config-marketplace.local.yaml"
	@echo
	@echo You can start your showcase now with
	@echo
	@echo yarn dev
	@echo

remove-from-showcase:
	@echo
	@echo Remove packages from ${showcase}
	@echo
	rm -rf "${dproot}/red-hat-developer-hub-backstage-plugin-marketplace"
	rm -rf "${dproot}/red-hat-developer-hub-backstage-plugin-marketplace-backend-dynamic"
	rm -rf "${dproot}/red-hat-developer-hub-backstage-plugin-catalog-backend-module-marketplace-dynamic"
