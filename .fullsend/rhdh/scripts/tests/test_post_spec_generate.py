"""Regression tests for the fs-spec runner handoff."""

import os
from pathlib import Path
import subprocess
import tempfile
import unittest


SCRIPTS = Path(__file__).resolve().parents[1]
SCRIPTS_SHA = "a" * 64


class PostSpecGenerateTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.run_dir = self.root / "run"
        self.repo = self.run_dir / "repo"
        self.workspace = self.root / "workspace"
        self.result = self.root / "result.txt"
        self.repo.mkdir(parents=True)

        self.env = dict(
            os.environ,
            GITHUB_WORKSPACE=str(self.workspace),
            REPO_DIR="repo",
            FULLSEND_WORK_ITEM_KEY="RHDHPLAN-1745",
            SPEC_GENERATE_BASE_SCRIPTS_SHA256=SCRIPTS_SHA,
            TEST_RESULT=str(self.result),
            GIT_CONFIG_GLOBAL=os.devnull,
            GIT_CONFIG_NOSYSTEM="1",
        )

        self.git("init", "-b", "main")
        self.git("config", "user.email", "test@example.invalid")
        self.git("config", "user.name", "Spec test")
        (self.repo / "seed.txt").write_text("seed\n")
        self.git("add", "seed.txt")
        self.git("commit", "-m", "chore: seed")
        self.git("update-ref", "refs/remotes/origin/main", "HEAD")

        base_script = (
            self.workspace
            / ".fullsend/.fullsend-cache/resources/sha256"
            / SCRIPTS_SHA
            / "scripts/post-code.sh"
        )
        base_script.parent.mkdir(parents=True)
        base_script.write_text(
            "#!/usr/bin/env bash\n"
            "set -euo pipefail\n"
            "git -C \"${REPO_DIR}\" branch --show-current > \"${TEST_RESULT}\"\n"
            "pwd >> \"${TEST_RESULT}\"\n"
        )

    def git(self, *args):
        return subprocess.check_output(
            ["git", "-c", "core.hooksPath=/dev/null", "-C", str(self.repo), *args],
            env=self.env,
            text=True,
            stderr=subprocess.DEVNULL,
        ).strip()

    def commit_change(self):
        (self.repo / "spec.md").write_text("spec\n")
        self.git("add", "spec.md")
        self.git("commit", "-m", "feat(openspec): add generated spec")

    def run_script(self, **env):
        return subprocess.run(
            ["bash", str(SCRIPTS / "post-spec-generate.sh")],
            cwd=self.run_dir,
            env=dict(self.env, **env),
            text=True,
            capture_output=True,
        )

    def result_lines(self):
        return self.result.read_text().splitlines()

    def test_moves_commit_from_main_to_scoped_feature_branch(self):
        self.commit_change()

        completed = self.run_script()

        self.assertEqual(completed.returncode, 0, completed.stderr)
        result = self.result_lines()
        self.assertEqual(result[0], "agent/RHDHPLAN-1745-spec")
        self.assertEqual(Path(result[1]).resolve(), self.run_dir.resolve())
        self.assertIn("Moving 1 spec commit(s)", completed.stdout)

    def test_moves_commit_from_detached_head_to_scoped_feature_branch(self):
        self.commit_change()
        self.git("checkout", "--detach")

        completed = self.run_script()

        self.assertEqual(completed.returncode, 0, completed.stderr)
        self.assertEqual(self.result_lines()[0], "agent/RHDHPLAN-1745-spec")

    def test_leaves_existing_feature_branch_unchanged(self):
        self.git("switch", "-c", "agent/RHDHPLAN-1745-custom")
        self.commit_change()

        completed = self.run_script()

        self.assertEqual(completed.returncode, 0, completed.stderr)
        self.assertEqual(self.result_lines()[0], "agent/RHDHPLAN-1745-custom")

    def test_delegates_without_branching_when_agent_made_no_commit(self):
        completed = self.run_script()

        self.assertEqual(completed.returncode, 0, completed.stderr)
        self.assertEqual(self.result_lines()[0], "main")
        self.assertNotIn("Moving", completed.stdout)

    def test_rejects_unsafe_work_item_key_before_branching(self):
        self.commit_change()

        completed = self.run_script(FULLSEND_WORK_ITEM_KEY="../unsafe")

        self.assertNotEqual(completed.returncode, 0)
        self.assertIn("safe work-item key", completed.stdout)
        self.assertFalse(self.result.exists())


if __name__ == "__main__":
    unittest.main()
