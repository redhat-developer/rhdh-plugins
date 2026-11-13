"""Evaluate the registered command triggers with Fullsend's real CEL router.

Trigger-only fixture harnesses keep these routing tests offline. Full harness
composition is checked separately with `fullsend lock`.
"""

import copy
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

import yaml


FULLSEND_DIR = Path(__file__).resolve().parents[3]
ROLES = {"spec-generate": "coder", "spec-audit": "review", "grillme": "review"}


@unittest.skipUnless(shutil.which("fullsend"), "Fullsend CLI required for CEL tests")
class DispatchTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory()
        cls.addClassCleanup(cls.temp.cleanup)
        cls.root = Path(cls.temp.name)
        cls.config = cls.root / ".fullsend"
        cls.config.mkdir()
        registered = yaml.safe_load((FULLSEND_DIR / "config.yaml").read_text())["agents"]
        agents = []
        for name, role in ROLES.items():
            entry = next(a for a in registered if a["name"] == name)
            source = yaml.safe_load((FULLSEND_DIR / entry["source"]).read_text())
            path = f"{name}.yaml"
            (cls.config / path).write_text(yaml.safe_dump({
                "agent": "fixture.md", "role": role, "trigger": source["trigger"],
            }))
            agents.append({"name": name, "source": path})
        (cls.config / "config.yaml").write_text(yaml.safe_dump({"version": "1", "agents": agents}))

    def event(self, command, *, pr=False, source="github", fork=False, role="write"):
        number = 21
        event = {
            "repo": "example/repo",
            "entity": {"kind": "change_proposal" if pr else "work_item", "id": number,
                       "key": "RHIDP-21" if source == "jira" else str(number),
                       "url": f"https://github.com/example/repo/{'pull' if pr else 'issues'}/{number}"},
            "transition": {"kind": "comment_added", "comment": {
                "id": "42", "body": command, "command": command.split()[0],
                "instruction": command.partition(" ")[2],
            }},
            "actor": {"id": "maintainer", "kind": "human", "role": role, "is_entity_author": False},
            "state": {"labels": []},
            "source": {"system": source, "raw_type": "issue_comment"},
        }
        if pr:
            event["state"]["change_proposal"] = {"is_fork": fork}
        return event

    def dispatch(self, event):
        path = self.root / "event.json"
        path.write_text(json.dumps(event))
        result = subprocess.run([
            "fullsend", "dispatch", "--config-dir", str(self.config),
            "--input-driver", "json", "--input-file", str(path),
            "--output-driver", "json",
        ], text=True, capture_output=True, timeout=30)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertNotIn("::error::", result.stderr)
        return [entry["agent"] for entry in (json.loads(result.stdout) or [])]

    def test_routes_each_command_once(self):
        cases = [
            (self.event("/fs-spec"), ["spec-generate"]),
            (self.event("/fs-spec focus on workspaces/boost"), ["spec-generate"]),
            (self.event("/fs-spec", source="jira"), ["spec-generate"]),
            (self.event("/fs-spec audit", pr=True), ["spec-audit"]),
            (self.event("/fs-spec audit workspaces/boost/openspec/changes/demo", pr=True), ["spec-audit"]),
            (self.event("/fs-spec audit\nexample", pr=True, fork=True), ["spec-audit"]),
            (self.event("/fs-grillme", pr=True), ["grillme"]),
            (self.event("/fs-grillme focus on compatibility", pr=True), ["grillme"]),
        ]
        for event, expected in cases:
            with self.subTest(command=event["transition"]["comment"]["body"], source=event["source"]):
                self.assertEqual(self.dispatch(event), expected)

    def test_wrong_surfaces_and_unauthorized_commands_do_not_dispatch(self):
        cases = [
            self.event("/fs-spec", pr=True),
            self.event("/fs-spec audit"),
            self.event("/fs-spec audit", source="jira"),
            self.event("/fs-grillme"),
            self.event("/fs-grillme", source="jira"),
            self.event("/fs-grillme", pr=True, fork=True),
            self.event("/fs-code"),
            self.event("/fs-review", pr=True),
        ]
        for command, pr in [("/fs-spec", False), ("/fs-spec audit", True), ("/fs-grillme", True)]:
            cases.append(self.event(command, pr=pr, role="read"))
        no_comment = copy.deepcopy(self.event("/fs-spec"))
        no_comment["transition"] = {"kind": "opened"}
        cases.append(no_comment)
        for event in cases:
            with self.subTest(event=event):
                self.assertEqual(self.dispatch(event), [])


if __name__ == "__main__":
    unittest.main()
