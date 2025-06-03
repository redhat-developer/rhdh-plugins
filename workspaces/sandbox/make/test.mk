E2E_REPO_PATH := ""

.PHONY: test-e2e
test-e2e: get-e2e-repo
	# run the e2e tests via toolchain-e2e repo
	$(MAKE) -C ${E2E_REPO_PATH} prepare-and-deploy-e2e deploy-and-test-sandbox-ui RHDH_PLUGINS_DIR=${PWD}/../..

.PHONY: test-e2e-local
test-e2e-local:
	$(MAKE) test-e2e E2E_REPO_PATH=../../../toolchain-e2e

# cleans both toolchain resources and Developer Sandbox UI
.PHONY: clean-all-e2e-resources
clean-e2e-resources: get-e2e-repo
	$(MAKE) -C ${E2E_REPO_PATH} clean-e2e-resources
	$(MAKE) -C ${E2E_REPO_PATH} clean-sandbox-ui

# cleans Developer Sandbox UI
.PHONY: clean-sandbox-ui
clean-sandbox-ui: get-e2e-repo
	$(MAKE) -C ${E2E_REPO_PATH} clean-sandbox-ui

.PHONY: get-e2e-repo
get-e2e-repo:
ifeq ($(E2E_REPO_PATH),"")
	# set e2e repo path to tmp directory
	$(eval E2E_REPO_PATH = /tmp/toolchain-e2e)
	# delete to have clear environment
	rm -rf ${E2E_REPO_PATH}
	# clone
	git clone https://github.com/codeready-toolchain/toolchain-e2e.git ${E2E_REPO_PATH}
    ifneq ($(CI),)
        ifneq ($(GITHUB_ACTIONS),)
			$(eval BRANCH_NAME = ${GITHUB_HEAD_REF})
			$(eval AUTHOR_LINK = https://github.com/${AUTHOR})
        else
			$(eval AUTHOR_LINK = $(shell jq -r '.refs[0].pulls[0].author_link' <<< $${CLONEREFS_OPTIONS} | tr -d '[:space:]'))
			@echo "found author link ${AUTHOR_LINK}"
			$(eval BRANCH_NAME := $(shell jq -r '.refs[0].pulls[0].head_ref' <<< $${CLONEREFS_OPTIONS} | tr -d '[:space:]'))
        endif
		@echo "using author link ${AUTHOR_LINK}"
		@echo "detected branch ${BRANCH_NAME}"
		# check if a branch with the same ref exists in the user's fork of toolchain-e2e repo
		$(eval REMOTE_E2E_BRANCH := $(shell curl ${AUTHOR_LINK}/toolchain-e2e.git/info/refs?service=git-upload-pack --output - 2>/dev/null | grep -a "refs/heads/${BRANCH_NAME}$$" | awk '{print $$2}'))
		@echo "branch ref of the user's fork: \"${REMOTE_E2E_BRANCH}\" - if empty then not found"
		# check if the branch with the same name exists, if so then merge it with master and use the merge branch, if not then use master
		if [[ -n "${REMOTE_E2E_BRANCH}" ]]; then \
			git config --global user.email "devsandbox@redhat.com"; \
			git config --global user.name "KubeSaw"; \
			# add the user's fork as remote repo \
			git --git-dir=${E2E_REPO_PATH}/.git --work-tree=${E2E_REPO_PATH} remote add external ${AUTHOR_LINK}/toolchain-e2e.git; \
			# fetch the branch \
			git --git-dir=${E2E_REPO_PATH}/.git --work-tree=${E2E_REPO_PATH} fetch external ${REMOTE_E2E_BRANCH}; \
			# merge the branch with master \
			git --git-dir=${E2E_REPO_PATH}/.git --work-tree=${E2E_REPO_PATH} merge --allow-unrelated-histories --no-commit FETCH_HEAD; \
		fi;
    endif
endif
