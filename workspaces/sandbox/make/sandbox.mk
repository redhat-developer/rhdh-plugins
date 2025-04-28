TMP_DIR := $(shell mktemp -d)
TAG := $(shell date +'%d%H%M%S')
SANDBOX_RHDH_PLUGIN_IMAGE ?= quay.io/$(QUAY_NAMESPACE)/sandbox-rhdh-plugin:$(TAG)
OS := $(shell uname -s)
ARCH := $(shell uname -m)
PLATFORM ?= $(OS)/$(ARCH)

.PHONY: push-plugin
push-plugin:
	npx @janus-idp/cli@3.3.1 package package-dynamic-plugins \
		--tag $(SANDBOX_RHDH_PLUGIN_IMAGE) \
		--platform $(PLATFORM) && \
	podman push $(SANDBOX_RHDH_PLUGIN_IMAGE)


RHDH_LOCAL_DIR := "$(TMP_DIR)/rhdh-local"
.PHONY: clone-rhdh-local
clone-rhdh-local:
	git clone https://github.com/redhat-developer/rhdh-local $(RHDH_LOCAL_DIR) && \
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
	cp deploy/base/app-config.yaml $(RHDH_LOCAL_DIR)/configs/app-config.local.yaml && \
	SANDBOX_RHDH_PLUGIN_IMAGE=$(SANDBOX_RHDH_PLUGIN_IMAGE) envsubst < deploy/base/dynamic-plugins.yaml > $(RHDH_LOCAL_DIR)/configs/dynamic-plugins.yaml && \
	cd $(RHDH_LOCAL_DIR) && \
	yq e '.services.rhdh.ports = ["3000:3000"] | (.services.rhdh.ports) |= map(. style="double")' -i compose.yaml && \
	yq e '.services.rhdh.env_file = ["./default.env", "./.env"]' -i compose.yaml && \
	podman compose up