# This variables defines the rhdh and dynamic-plugins-root paths.
#
# The default expects that you have this redhat-developer/rhdh-plugins
# repo and https://github.com/redhat-developer/rhdh side by side incl. the
# org structure.
#
# If you don't have the org structure locally you can override this
# with make arguments like this:
#
#   make rhdh=../../../backstage-rhdh <command like copy>
#
# Or use an absolute path:
#
#   make rhdh=~/git/backstage-rhdh <command like copy>
rhdh=../../../../redhat-developer/rhdh

# The dynamic-plugins-root has two more ../.. because it's relative
# to the plugins/* folders
dproot=../../${rhdh}/dynamic-plugins-root

clean=true

dev=true

fix:
	@echo
	@echo fix and format theme workspace
	@echo
	yarn tsc:full
	yarn build:api-reports:only

add-to-rhdh: add-theme-to-rhdh add-tests-to-rhdh

add-theme-to-rhdh:
	@echo
	@echo Will build and install theme plugin into ${rhdh}
	@echo
	cd plugins/theme && yarn build && yarn pack
	test plugins/theme/package.tgz
	test -d "${rhdh}/node_modules/@red-hat-developer-hub/backstage-plugin-theme"
	tar -xzf plugins/theme/package.tgz -C "${rhdh}/node_modules/@red-hat-developer-hub/backstage-plugin-theme" --strip-components=1

add-tests-to-rhdh:
	@echo
	@echo Will build and install test plugins into ${rhdh}
	@echo
	cd plugins/bcc-test && npx --yes @red-hat-developer-hub/cli@latest plugin export --dynamic-plugins-root "${dproot}" --clean "${clean}" --dev "${dev}"
	cd plugins/mui4-test && npx --yes @red-hat-developer-hub/cli@latest plugin export --dynamic-plugins-root "${dproot}" --clean "${clean}" --dev "${dev}"
	cd plugins/mui5-test && npx --yes @red-hat-developer-hub/cli@latest plugin export --dynamic-plugins-root "${dproot}" --clean "${clean}" --dev "${dev}"

remove-from-rhdh:
	@echo
	@echo Remove theme and test plugins from ${rhdh}
	@echo
	rm -rf "${dproot}/red-hat-developer-hub-backstage-plugin-bcc-test"
	rm -rf "${dproot}/red-hat-developer-hub-backstage-plugin-mui4-test"
	rm -rf "${dproot}/red-hat-developer-hub-backstage-plugin-mui5-test"
