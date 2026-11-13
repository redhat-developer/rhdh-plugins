"""Exercise grillme's transcript publisher without making GitHub writes."""

import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

SCRIPTS = Path(__file__).resolve().parents[1]


class GrillmeTest(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.root = Path(temp.name)
        self.bin = self.root / "bin"
        self.bin.mkdir()
        self.iteration = self.root / "iteration-1"
        self.iteration.mkdir()
        self.log = self.root / "calls.jsonl"
        gh = self.bin / "gh"
        gh.write_text(f"#!{sys.executable}\n" + '''
import json, os, sys
args = sys.argv[1:]
body = sys.stdin.read() if '--input' in args or '--body-file' in args else ''
with open(os.environ['GRILLME_TEST_LOG'], 'a') as log:
    log.write(json.dumps({'args': args, 'body': body}) + '\\n')
if args[:2] == ['pr', 'view']:
    print(os.environ.get('GRILLME_TEST_PR_STATE', 'OPEN'))
if args[:1] == ['api'] and args[1].endswith('/reviews') and os.environ.get('GRILLME_TEST_REJECT_INLINE'):
    sys.exit(1)
''')
        gh.chmod(0o755)
        self.env = dict(
            os.environ, PATH=f"{self.bin}:{os.environ['PATH']}",
            GH_TOKEN="fixture-token", REPO_FULL_NAME="example/repo",
            GITHUB_ISSUE_URL="https://github.com/example/repo/pull/21",
            FULLSEND_VALIDATED_ITERATION_DIR=str(self.iteration),
            GRILLME_TEST_LOG=str(self.log),
        )
        for key in ('ISSUE_NUMBER', 'PR_NUMBER', 'REVIEW_TOKEN', 'GITHUB_ENV'):
            self.env.pop(key, None)

    def run_script(self, name="post-grillme.sh"):
        return subprocess.run(["bash", str(SCRIPTS / name)], cwd=self.root,
                              env=self.env, capture_output=True, text=True)

    def transcript(self, actions=None, heading="### Grillme — Turn 1"):
        text = f"Preamble that must not be posted\n{heading}\nDesign questions."
        if actions is not None:
            text += "\n```json:grillme\n" + json.dumps(actions) + "\n```"
        (self.iteration / "output.jsonl").write_text(json.dumps({
            "type": "assistant", "message": {"content": [{"type": "text", "text": text}]},
        }) + "\n")

    def calls(self):
        return [json.loads(line) for line in self.log.read_text().splitlines()]

    def test_publishes_inline_questions_replies_and_resolutions(self):
        self.transcript({
            "new_comments": [{"path": "design.md", "line": 3, "body": "Why this choice? <!-- grillme -->"}],
            "thread_replies": [{"comment_id": 123, "body": "What about migration? <!-- grillme -->"}],
            "resolve_threads": ["PRRT_fixture"],
        })
        result = self.run_script()
        self.assertEqual(result.returncode, 0, result.stderr)
        review, reply, resolve = self.calls()
        self.assertEqual(review["args"][1], "repos/example/repo/pulls/21/reviews")
        payload = json.loads(review["body"])
        self.assertEqual(payload["event"], "COMMENT")
        self.assertEqual(payload["comments"][0]["line"], 3)
        self.assertIn("<!-- fullsend:grillme -->", payload["body"])
        self.assertNotIn("Preamble", payload["body"])
        self.assertNotIn("json:grillme", payload["body"])
        self.assertIn("/pulls/21/comments/123/replies", reply["args"][1])
        self.assertIn("threadId=PRRT_fixture", resolve["args"])

    def test_session_complete_posts_summary_without_inline_comments(self):
        self.transcript(heading="### Grillme — Session Complete")
        result = self.run_script()
        self.assertEqual(result.returncode, 0, result.stderr)
        call, = self.calls()
        self.assertEqual(call["args"][:3], ["issue", "comment", "21"])
        self.assertIn("Start a new session", call["body"])

    def test_rejected_inline_locations_fall_back_to_pr_comment(self):
        self.env["GRILLME_TEST_REJECT_INLINE"] = "1"
        self.transcript({"new_comments": [{"path": "design.md", "line": 3, "body": "Why?"}]})
        result = self.run_script()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("Inline comments were not pinned", self.calls()[-1]["body"])

    def test_missing_transcript_posts_failure_context(self):
        result = self.run_script()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("produced no output", self.calls()[0]["body"])

    def test_invalid_target_does_not_publish(self):
        self.env["GITHUB_ISSUE_URL"] = "https://github.com/example/repo/pull/invalid"
        self.assertNotEqual(self.run_script().returncode, 0)
        self.assertFalse(self.log.exists())

    def test_pre_script_rejects_closed_pr(self):
        self.env["GRILLME_TEST_PR_STATE"] = "CLOSED"
        result = self.run_script("pre-grillme.sh")
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("already **closed**", self.calls()[-1]["body"])


if __name__ == "__main__":
    unittest.main()
