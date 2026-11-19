"""CVE scoring regressions for colored Yarn output and PR leftover tables."""

import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


SCORER = Path(__file__).resolve().parents[1] / "cve-review-score.py"


def _load_scorer():
    spec = importlib.util.spec_from_file_location("cve_review_score", SCORER)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


class CveReviewScoreTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.score_mod = _load_scorer()

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

    def test_extract_versions_expects_plain_text(self):
        colored = "\x1b[34maxios@npm:1.2.3\x1b[0m"
        self.assertEqual(
            self.score_mod.extract_versions(colored, "axios"),
            [],
        )
        plain = self.score_mod.strip_ansi(colored)
        self.assertEqual(
            self.score_mod.extract_versions(plain, "axios"),
            ["1.2.3"],
        )

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

    def test_table_header_words_are_not_packages(self):
        """Structural header skip: before/after/version never enter leftovers."""
        _, pkgs, listed = self.score_mod.documented_leftovers(
            "CVE bump",
            "## Partial leftovers\n"
            "| before | after | version | status |\n"
            "| --- | --- | --- | --- |\n"
            "| axios | 1.0.0 | 1.0.0 | open |\n",
            known_packages={"before", "after", "version", "status", "axios"},
        )
        self.assertTrue(listed)
        self.assertEqual(pkgs, {"axios"})
        # Header-only table contributes nothing.
        _, empty, listed_empty = self.score_mod.documented_leftovers(
            "CVE bump",
            "## Partial leftovers\n"
            "| before | after | version | status |\n"
            "| --- | --- | --- | --- |\n",
            known_packages={"before", "after", "version", "status"},
        )
        self.assertFalse(listed_empty)
        self.assertEqual(empty, set())

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

    def test_prose_and_bullets_are_not_leftovers(self):
        """Intentional: only tables count; prose/bullets stay fail without [PARTIAL]."""
        result = self.score(
            "CVE bump",
            "## Partial leftovers\n\n- lodash remains vulnerable\n"
            "axios is still unresolved after the bump.\n",
            ["axios", "lodash"],
        )
        self.assertEqual(result["leftover_packages"], [])
        self.assertEqual(
            {entry["package"]: entry["status"] for entry in result["packages"]},
            {"axios": "fail", "lodash": "fail"},
        )


if __name__ == "__main__":
    unittest.main()
