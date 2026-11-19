"""CVE scoring regressions for colored Yarn output and PR leftover tables."""

import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


SCORER = Path(__file__).resolve().parents[1] / "cve-review-score.py"


class CveReviewScoreTest(unittest.TestCase):
    def score(self, title, body, packages, *, colored=False):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            why_dir = root / "why"
            why_dir.mkdir()
            advisories = [{
                "ghsa_id": "GHSA-test",
                "packages": [
                    {"name": name, "patched": "2.0.0", "vulnerable_range": "< 2.0.0"}
                    for name in packages
                ],
            }]
            (root / "advisories.json").write_text(json.dumps(advisories))
            (root / "pr.json").write_text(json.dumps({"title": title, "body": body}))
            for name in packages:
                version = f"{name}@npm:1.0.0"
                if colored:
                    version = f"\x1b[34m{version}\x1b[0m"
                (why_dir / f"{name}.txt").write_text(version + "\n")
            output = root / "verification.json"
            subprocess.run([
                sys.executable, str(SCORER), "--advisories",
                str(root / "advisories.json"),
                "--why-dir", str(why_dir), "--pr-context", str(root / "pr.json"),
                "--workspace", "example", "--out", str(output),
            ], check=True, capture_output=True, text=True)
            return json.loads(output.read_text())

    def test_ansi_colored_yarn_why_versions_are_scored(self):
        result = self.score("CVE bump", "", ["axios"], colored=True)
        self.assertEqual(result["packages"][0]["versions"], ["1.0.0"])
        self.assertEqual(result["packages"][0]["status"], "fail")

    def test_partial_and_unchanged_tables_from_cve_bump_report(self):
        result = self.score(
            "CVE bump",
            "## Fully fixed\n| package | before | after | CVEs cleared |\n"
            "| --- | --- | --- | --- |\n| handlebars | 1.0.0 | 2.0.0 | GHSA-test |\n"
            "## Partial leftovers\n| package | before | after | remaining |\n"
            "| --- | --- | --- | --- |\n| fast-xml-parser | 1.0.0 | 1.0.0 | 1.0.0 |\n"
            "## Unchanged\n| package | before | after | remaining |\n"
            "| --- | --- | --- | --- |\n| lodash | 1.0.0 | 1.0.0 | 1.0.0 |\n",
            ["fast-xml-parser", "handlebars", "lodash"],
        )
        self.assertEqual(result["leftover_packages"], ["fast-xml-parser", "lodash"])
        self.assertEqual(
            {entry["package"]: entry["status"] for entry in result["packages"]},
            {"fast-xml-parser": "partial", "handlebars": "fail", "lodash": "partial"},
        )

    def test_filtered_leftover_does_not_mark_other_vulnerabilities_partial(self):
        result = self.score(
            "[PARTIAL] CVE bump",
            "## Partial leftovers\n| package | remaining |\n| --- | --- |\n"
            "| unrelated-pkg | 1.0.0 |\n",
            ["axios"],
        )
        self.assertEqual(result["leftover_packages"], [])
        self.assertEqual(result["packages"][0]["status"], "fail")

    def test_partial_title_without_list_keeps_existing_fallback(self):
        result = self.score("[PARTIAL] CVE bump", "No leftover list.", ["axios"])
        self.assertEqual(result["packages"][0]["status"], "partial")


if __name__ == "__main__":
    unittest.main()
