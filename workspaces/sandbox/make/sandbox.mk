TAG := $(shell date +'%d%H%M%S')
SANDBOX_RHDH_PLUGIN_IMAGE ?= quay.io/$(QUAY_NAMESPACE)/sandbox-rhdh-plugin:$(TAG)
OS := $(shell uname -s)
ARCH := $(shell uname -m)
PLATFORM ?= $(OS)/$(ARCH)

.PHONY: push-plugin
push-plugin:
	npx @red-hat-developer-hub/cli@latest plugin package \
		--tag $(SANDBOX_RHDH_PLUGIN_IMAGE) \
		--platform $(PLATFORM) && \
	podman push $(SANDBOX_RHDH_PLUGIN_IMAGE)


RHDH_LOCAL_DIR := "$(TMPDIR)rhdh-local"
.PHONY: clone-rhdh-local
clone-rhdh-local:
	rm -rf ${RHDH_LOCAL_DIR}; \
	git clone --depth 1 https://github.com/redhat-developer/rhdh-local $(RHDH_LOCAL_DIR) && \
	cd $(RHDH_LOCAL_DIR) && \
	git fetch --unshallow && \
	git checkout 37be302480b1458c3dfd3270c25726d65f0ffe75 && \
	echo "cloned to $(RHDH_LOCAL_DIR)"


.PHONY: generate-env
generate-env:
	cd $(RHDH_LOCAL_DIR) && \
	if [ $(OS) = "Darwin" ] && [ $(ARCH) = "arm64" ]; then \
		echo "# This is a nightly build. This image supports both amd64 and arm64" > .env; \
		echo "RHDH_IMAGE=quay.io/rhdh-community/rhdh:next" >> .env; \
		echo ".env file generated for macOS arm64"; \
	else \
		echo "Skipping .env generation: OS=$$OS, ARCH=$$ARCH"; \
	fi

.PHONY: start-rhdh-local
start-rhdh-local: clone-rhdh-local generate-env
	rm -rf plugins/sandbox/dist-dynamic
	rm -rf red-hat-developer-hub-backstage-plugin-sandbox
	podman run -it --rm -w /home -v $(PWD):/home node:22 bash -c "yarn install && npx --yes @red-hat-developer-hub/cli@latest plugin package --export-to .  && exit"
	cp -r red-hat-developer-hub-backstage-plugin-sandbox $(RHDH_LOCAL_DIR)/local-plugins/
	cp deploy/base/app-config.yaml $(RHDH_LOCAL_DIR)/configs/app-config/app-config.yaml
	cp deploy/base/dynamic-plugins.yaml $(RHDH_LOCAL_DIR)/configs/dynamic-plugins/dynamic-plugins.override.yaml
	cd $(RHDH_LOCAL_DIR) && \
	yq e '.services.rhdh.ports = ["3000:3000"] | (.services.rhdh.ports) |= map(. style="double")' -i compose.yaml && \
	podman-compose up -d  && \
	echo "UI is up and running at: http://localhost:3000"

.PHONY: stop-rhdh-local
stop-rhdh-local:
	cd $(RHDH_LOCAL_DIR) && \
	podman-compose down -v && \
	rm -rf $(RHDH_LOCAL_DIR)

.PHONY: restart-rhdh-local
restart-rhdh-local: stop-rhdh-local start-rhdh-local
