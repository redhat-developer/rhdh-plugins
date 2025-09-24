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
	@echo fix and format theme workspace
	@echo
	yarn tsc:full
	yarn build:api-reports:only

add-to-showcase: add-theme-to-showcase add-tests-to-showcase

add-theme-to-showcase:
	@echo
	@echo Will build and install theme plugin into ${showcase}
	@echo
	cd plugins/theme && yarn build && yarn pack
	test plugins/theme/package.tgz
	test -d "${showcase}/node_modules/@red-hat-developer-hub/backstage-plugin-theme"
	tar -xzf plugins/theme/package.tgz -C "${showcase}/node_modules/@red-hat-developer-hub/backstage-plugin-theme" --strip-components=1

add-tests-to-showcase:
	@echo
	@echo Will build and install test plugins into ${showcase}
	@echo
	cd plugins/bcc-test && npx --yes @red-hat-developer-hub/cli@latest plugin export --dynamic-plugins-root "${dproot}" --clean "${clean}" --dev "${dev}"
	cd plugins/mui4-test && npx --yes @red-hat-developer-hub/cli@latest plugin export --dynamic-plugins-root "${dproot}" --clean "${clean}" --dev "${dev}"
	cd plugins/mui5-test && npx --yes @red-hat-developer-hub/cli@latest plugin export --dynamic-plugins-root "${dproot}" --clean "${clean}" --dev "${dev}"

remove-from-showcase:
	@echo
	@echo Remove theme and test plugins from ${showcase}
	@echo
	rm -rf "${dproot}/red-hat-developer-hub-backstage-plugin-bcc-test"
	rm -rf "${dproot}/red-hat-developer-hub-backstage-plugin-mui4-test"
	rm -rf "${dproot}/red-hat-developer-hub-backstage-plugin-mui5-test"
