'use strict';

function defaultGroupNameTransformer(options) {
  if (options.providerConfig.group && options.group.full_path.startsWith(`${options.providerConfig.group}/`)) {
    return options.group.full_path.replace(`${options.providerConfig.group}/`, "").replaceAll("/", "-");
  }
  return options.group.full_path.replaceAll("/", "-");
}
function defaultGroupEntitiesTransformer(options) {
  const idMapped = {};
  const entities = [];
  for (const group of options.groups) {
    idMapped[group.id] = group;
  }
  for (const group of options.groups) {
    const annotations = {};
    annotations[`${options.providerConfig.host}/team-path`] = group.full_path;
    if (group.visibility !== void 0) {
      annotations[`${options.providerConfig.host}/visibility`] = group.visibility;
    }
    const entity = {
      apiVersion: "backstage.io/v1alpha1",
      kind: "Group",
      metadata: {
        name: options.groupNameTransformer({
          group,
          providerConfig: options.providerConfig
        }),
        annotations
      },
      spec: {
        type: "team",
        children: [],
        profile: {
          displayName: group.name
        }
      }
    };
    if (group.description) {
      entity.metadata.description = group.description;
    }
    if (group.parent_id && idMapped.hasOwnProperty(group.parent_id)) {
      entity.spec.parent = options.groupNameTransformer({
        group: idMapped[group.parent_id],
        providerConfig: options.providerConfig
      });
    }
    entities.push(entity);
  }
  return entities;
}
function defaultUserTransformer(options) {
  const annotations = {};
  annotations[`${options.integrationConfig.host}/user-login`] = options.user.web_url;
  if (options.user?.group_saml_identity?.extern_uid) {
    annotations[`${options.integrationConfig.host}/saml-external-uid`] = options.user.group_saml_identity.extern_uid;
  }
  const entity = {
    apiVersion: "backstage.io/v1alpha1",
    kind: "User",
    metadata: {
      name: options.user.username,
      annotations
    },
    spec: {
      profile: {
        displayName: options.user.name || void 0,
        picture: options.user.avatar_url || void 0
      },
      memberOf: []
    }
  };
  if (options.user.email) {
    if (!entity.spec) {
      entity.spec = {};
    }
    if (!entity.spec.profile) {
      entity.spec.profile = {};
    }
    entity.spec.profile.email = options.user.email;
  }
  if (options.user.groups) {
    for (const group of options.user.groups) {
      if (!entity.spec.memberOf) {
        entity.spec.memberOf = [];
      }
      entity.spec.memberOf.push(
        options.groupNameTransformer({
          group,
          providerConfig: options.providerConfig
        })
      );
    }
  }
  return entity;
}

exports.defaultGroupEntitiesTransformer = defaultGroupEntitiesTransformer;
exports.defaultGroupNameTransformer = defaultGroupNameTransformer;
exports.defaultUserTransformer = defaultUserTransformer;
//# sourceMappingURL=defaultTransformers.cjs.js.map
