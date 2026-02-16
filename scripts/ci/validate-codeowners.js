#!/usr/bin/env node
/*
 * Copyright The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * This script validates that all individual users mentioned in the CODEOWNERS file
 * are members of the 'rhdh-plugins-codeowners' GitHub team.
 *
 * It extracts usernames from CODEOWNERS (excluding team mentions like @org/team),
 * fetches the team membership via the GitHub REST API, and reports any users
 * that are not part of the team.
 *
 * Usage: GITHUB_TOKEN=<token> node scripts/ci/validate-codeowners.js
 *
 * The token must have 'read:org' scope to access team membership.
 */

import { readFile } from 'fs/promises';
import { join } from 'path';

const ORG = 'redhat-developer';
const TEAM_SLUG = 'rhdh-plugins-codeowners';

/**
 * Fetch all members of a GitHub team using the REST API
 */
async function fetchTeamMembers() {
  console.log(`Fetching members of ${ORG}/${TEAM_SLUG} team...`);

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN environment variable is required');
  }

  const members = [];
  let page = 1;
  const perPage = 100;
  let hasMore = true;

  while (hasMore) {
    const url = `https://api.github.com/orgs/${ORG}/teams/${TEAM_SLUG}/members?per_page=${perPage}&page=${page}`;
    const response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch team members: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    if (data.length === 0) {
      hasMore = false;
    } else {
      members.push(
        ...data.map(member => member.login.toLocaleLowerCase('en-US')),
      );
      page++;
    }
  }

  if (members.length === 0) {
    throw new Error('Failed to fetch team members or team is empty');
  }

  return new Set(members);
}

/**
 * Extract individual usernames from CODEOWNERS file
 * Excludes team mentions like @org/team
 */
async function extractCodeownersUsers() {
  const codeownersPath = join(
    import.meta.dirname,
    '..',
    '..',
    '.github',
    'CODEOWNERS',
  );
  const content = await readFile(codeownersPath, 'utf8');

  // Match @username but not @org/team patterns
  const userPattern = /@([a-zA-Z0-9_-]+)(?!\/)(?![a-zA-Z0-9_/-])/g;
  const users = new Set();

  for (const match of content.matchAll(userPattern)) {
    const username = match[1].toLocaleLowerCase('en-US');
    // Skip org names (they're followed by / in team mentions)
    if (!content.includes(`@${match[1]}/`)) {
      users.add(username);
    }
  }

  return users;
}

async function main() {
  const teamMembers = await fetchTeamMembers();

  console.log('Team members found:');
  for (const member of [...teamMembers].sort()) {
    console.log(`  - ${member}`);
  }
  console.log();

  const codeownersUsers = await extractCodeownersUsers();

  console.log('Individual users found in CODEOWNERS:');
  for (const user of [...codeownersUsers].sort()) {
    console.log(`  - ${user}`);
  }
  console.log();

  // Find users not in the team
  const missingUsers = [...codeownersUsers].filter(
    user => !teamMembers.has(user),
  );

  if (missingUsers.length > 0) {
    console.log();
    console.log('***********************************************************');
    console.log('*         CODEOWNERS validation failed!                   *');
    console.log('***********************************************************');
    console.log();
    console.log(
      `The following users are in CODEOWNERS but not in the ${ORG}/${TEAM_SLUG} team:`,
    );
    console.log();
    for (const user of missingUsers.sort()) {
      console.log(`  - @${user}`);
    }
    console.log();
    console.log(
      `Please add these users to the team: https://github.com/orgs/${ORG}/teams/${TEAM_SLUG}/members`,
    );
    console.log();
    console.log('***********************************************************');
    console.log();
    process.exit(1);
  }

  console.log('All CODEOWNERS entries are valid team members!');
}

main().catch(error => {
  console.error(error.stack);
  process.exit(1);
});
