"""Exercise the runner scripts with local Git repositories and mocked APIs."""

import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


SCRIPTS = Path(__file__).resolve().parents[1]
SCHEMA = SCRIPTS.parent / "schemas/spec-audit-result.schema.json"
SHA = "a" * 40


class AuditTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.bin = self.root / "bin"
        self.bin.mkdir()
        self.output = self.root / "output"
        self.output.mkdir()
        self.context = self.root / "dispatch/context.json"
        self.metadata = self.root / "metadata.json"
        self.calls = self.root / "calls.jsonl"
        self.env = dict(
            os.environ,
            PATH=f"{self.bin}:{os.environ['PATH']}",
            GH_TOKEN="test-read-token",
            REVIEW_TOKEN="test-review-token",
            REPO_FULL_NAME="example/repo",
            PR_NUMBER="21",
            SPEC_AUDIT_CONTEXT_FILE=str(self.context),
            FULLSEND_VALIDATED_ITERATION_DIR=str(self.output),
            FULLSEND_OUTPUT_SCHEMA=str(SCHEMA),
            AUDIT_TEST_METADATA=str(self.metadata),
            AUDIT_TEST_CALLS=str(self.calls),
            GIT_CONFIG_GLOBAL=os.devnull,
            GIT_CONFIG_NOSYSTEM="1",
        )
        self.write_tool("gh", """
import json, os, sys
assert sys.argv[1:3] == ['pr', 'view'], sys.argv
if os.environ.get('AUDIT_TEST_API_FAIL'):
    sys.exit(1)
print(open(os.environ['AUDIT_TEST_METADATA']).read())
""")
        self.write_tool("fullsend", """
import json, os, pathlib, sys
args = sys.argv[1:]
assert args[0] == 'post-comment', args
body = pathlib.Path(args[args.index('--result') + 1]).read_text()
args[args.index('--token') + 1] = '[fixture]'
with open(os.environ['AUDIT_TEST_CALLS'], 'a') as log:
    log.write(json.dumps({'args': args, 'body': body}) + '\\n')
""")
        self.set_metadata()

    def write_tool(self, name, code):
        path = self.bin / name
        path.write_text(f"#!{sys.executable}\n{code}")
        path.chmod(0o755)

    def set_metadata(self, state="OPEN", sha=SHA):
        self.metadata.write_text(json.dumps({"state": state, "headRefOid": sha}))

    def run_script(self, name):
        return subprocess.run(
            ["bash", str(SCRIPTS / name)], cwd=self.root, env=self.env,
            text=True, capture_output=True,
        )

    def git(self, cwd, *args):
        return subprocess.check_output(
            ["git", "-c", "core.hooksPath=/dev/null", "-C", str(cwd), *args],
            env=self.env, text=True, stderr=subprocess.DEVNULL,
        ).strip()


class PrepareAuditTest(AuditTest):
    def setUp(self):
        super().setUp()
        self.source = self.root / "source"
        self.source.mkdir()
        self.git(self.source, "init", "-b", "main")
        self.git(self.source, "config", "user.email", "test@example.invalid")
        self.git(self.source, "config", "user.name", "Audit test")
        (self.source / "README.md").write_text("Base branch\n")
        self.git(self.source, "add", "README.md")
        self.git(self.source, "commit", "-m", "base")
        self.base_sha = self.git(self.source, "rev-parse", "HEAD")
        self.target = self.root / "target-repo"
        self.git(self.root, "clone", str(self.source), str(self.target))
        self.git(self.source, "checkout", "-b", "feature")
        artifact = self.source / "openspec/changes/new-change/proposal.md"
        artifact.parent.mkdir(parents=True)
        artifact.write_text("Artifact present only in the PR\n")
        (self.source / "README.md").write_text("PR branch\n")
        self.git(self.source, "add", "README.md", "openspec")
        self.git(self.source, "commit", "-m", "PR artifacts")
        self.head_sha = self.git(self.source, "rev-parse", "HEAD")
        self.git(self.source, "update-ref", "refs/pull/21/head", self.head_sha)
        self.git(self.target, "config", f"url.{self.source}.insteadOf",
                 "https://github.com/example/repo.git")
        self.env["TARGET_REPO_DIR"] = str(self.target)
        self.set_metadata(sha=self.head_sha)

    def test_checks_out_new_and_changed_pr_files_without_running_hooks(self):
        sentinel = self.root / "hook-ran"
        hook = self.target / ".git/hooks/post-checkout"
        hook.write_text(f"#!/bin/sh\ntouch '{sentinel}'\n")
        hook.chmod(0o755)
        result = self.run_script("pre-spec-audit.sh")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.git(self.target, "rev-parse", "HEAD"), self.head_sha)
        self.assertEqual((self.target / "README.md").read_text(), "PR branch\n")
        self.assertTrue((self.target / "openspec/changes/new-change/proposal.md").exists())
        self.assertFalse(sentinel.exists())
        self.assertEqual(json.loads(self.context.read_text()), {
            "repo": "example/repo", "pr_number": 21, "head_sha": self.head_sha,
        })

    def test_head_moving_during_fetch_aborts_before_checkout(self):
        self.set_metadata(sha=self.base_sha)
        result = self.run_script("pre-spec-audit.sh")
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("head changed", result.stderr)
        self.assertEqual(self.git(self.target, "rev-parse", "HEAD"), self.base_sha)
        self.assertFalse(self.context.exists())

    def test_closed_pr_skips_before_fetch(self):
        self.set_metadata(state="CLOSED", sha=self.head_sha)
        result = self.run_script("pre-spec-audit.sh")
        self.assertEqual(result.returncode, 78)
        self.assertFalse(self.context.exists())
        self.assertEqual(self.git(self.target, "rev-parse", "HEAD"), self.base_sha)

    def test_fetch_failure_does_not_allow_a_base_branch_audit(self):
        self.git(self.source, "update-ref", "-d", "refs/pull/21/head")
        result = self.run_script("pre-spec-audit.sh")
        self.assertNotEqual(result.returncode, 0)
        self.assertFalse(self.context.exists())


class PublishAuditTest(AuditTest):
    def setUp(self):
        super().setUp()
        self.context.parent.mkdir()
        self.context.write_text(json.dumps({
            "repo": "example/repo", "pr_number": 21, "head_sha": SHA,
        }))
        self.result = {
            "action": "comment", "repo": "example/repo", "pr_number": 21,
            "head_sha": SHA, "body": "Audit clean (no CRITICAL)",
        }

    def publish(self):
        (self.output / "agent-result.json").write_text(json.dumps(self.result))
        return self.run_script("post-spec-audit.sh")

    def published(self):
        return [json.loads(line) for line in self.calls.read_text().splitlines()]

    def test_posts_only_a_separate_audit_comment(self):
        result = self.publish()
        self.assertEqual(result.returncode, 0, result.stderr)
        calls = self.published()
        self.assertEqual(len(calls), 1)
        self.assertEqual(calls[0]["args"][:3], ["post-comment", "--repo", "example/repo"])
        self.assertIn("<!-- fullsend:spec-audit -->", calls[0]["args"])
        self.assertNotIn("<!-- fullsend:review-agent -->", calls[0]["body"])
        self.assertIn(SHA, calls[0]["body"])
        self.assertIn(self.result["body"], calls[0]["body"])

    def test_failure_is_an_advisory_comment(self):
        self.result.update(action="failure", reason="missing-context", body="Use /fs-spec audit example")
        result = self.publish()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("Use /fs-spec audit example", self.published()[0]["body"])

    def test_review_actions_and_extra_mutations_are_rejected(self):
        cases = [
            {"action": "approve"}, {"action": "request-changes"},
            {"action": "reject"}, {"findings": []},
            {"label_actions": {}}, {"risk_assessment": {}},
            {"head_sha": "b" * 40}, {"repo": "different/repo"},
            {"pr_number": 22}, {"body": "   "},
        ]
        original = self.result.copy()
        for change in cases:
            with self.subTest(change=change):
                self.result = original | change
                self.assertNotEqual(self.publish().returncode, 0)
                self.assertFalse(self.calls.exists())

    def test_changed_head_replaces_clean_outcome_with_stale_notice(self):
        self.set_metadata(sha="b" * 40)
        result = self.publish()
        self.assertEqual(result.returncode, 0, result.stderr)
        body = self.published()[0]["body"]
        self.assertIn("Audit is stale", body)
        self.assertNotIn("Audit clean", body)
        self.assertIn("/fs-spec audit", body)

    def test_closed_pr_does_not_publish(self):
        self.set_metadata(state="MERGED")
        self.assertEqual(self.publish().returncode, 0)
        self.assertFalse(self.calls.exists())

    def test_unverifiable_head_does_not_publish(self):
        self.env["AUDIT_TEST_API_FAIL"] = "1"
        self.assertNotEqual(self.publish().returncode, 0)
        self.assertFalse(self.calls.exists())

    def test_missing_validated_iteration_does_not_publish(self):
        del self.env["FULLSEND_VALIDATED_ITERATION_DIR"]
        self.assertNotEqual(self.publish().returncode, 0)
        self.assertFalse(self.calls.exists())

    def test_schema_validator_accepts_audit_and_rejects_review_results(self):
        cases = [
            ({}, 0),
            ({"action": "failure", "reason": "tool-failure"}, 0),
            ({"action": "approve"}, 1),
            ({"action": "request-changes"}, 1),
            ({"findings": []}, 1),
            ({"label_actions": {}}, 1),
            ({"action": "failure"}, 1),
            ({"head_sha": ""}, 1),
        ]
        for changes, expected in cases:
            with self.subTest(changes=changes):
                (self.output / "agent-result.json").write_text(json.dumps(self.result | changes))
                result = subprocess.run(
                    [sys.executable, str(SCRIPTS / "validate-spec-audit.py")],
                    cwd=self.root, env=self.env, text=True, capture_output=True,
                )
                self.assertEqual(result.returncode, expected, result.stdout + result.stderr)


if __name__ == "__main__":
    unittest.main()
