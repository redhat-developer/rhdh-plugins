'use strict';

var errors = require('@backstage/errors');
var util = require('../util.cjs.js');
var octokit = require('octokit');

function createHandleAutocompleteRequest(options) {
  return async function handleAutocompleteRequest({
    resource,
    token,
    context
  }) {
    const { integrations } = options;
    const octokitOptions = await util.getOctokitOptions({
      integrations,
      token,
      host: context.host ?? "github.com"
    });
    const client = new octokit.Octokit(octokitOptions);
    switch (resource) {
      case "repositoriesWithOwner": {
        const repositoriesWithOwner = await client.paginate(
          client.rest.repos.listForAuthenticatedUser
        );
        const results = repositoriesWithOwner.map((r) => ({ id: r.full_name }));
        return { results };
      }
      case "branches": {
        if (!context.owner || !context.repository)
          throw new errors.InputError(
            "Missing owner and/or repository context parameter"
          );
        const branches = await client.paginate(client.rest.repos.listBranches, {
          owner: context.owner,
          repo: context.repository
        });
        const results = branches.map((r) => ({ id: r.name }));
        return { results };
      }
      default:
        throw new errors.InputError(`Invalid resource: ${resource}`);
    }
  };
}

exports.createHandleAutocompleteRequest = createHandleAutocompleteRequest;
//# sourceMappingURL=autocomplete.cjs.js.map
