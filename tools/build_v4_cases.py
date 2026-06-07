#!/usr/bin/env python3
# Build the V4 (GitHub Pages public) cases.json from the IT-deploy source,
# stripping PII / internal-only fields. Source folder is READ-ONLY.
# ASCII-only output to console per cross-platform rules.
import json
import sys
import os

SRC = r"C:\Users\glen.ho\Projects\primax-ai-cases-it-deploy\web\data\cases.json"
DST = os.path.join(os.path.dirname(__file__), "..", "v4", "data", "cases.json")

# Fields removed from every case before publishing to the public site.
STRIP = [
    "owner_email",     # PII
    "owner_photo",     # internal upload path, 404s on static host
    "evidenceurl",     # often internal SharePoint links
    "source_meeting",  # internal process metadata
    "reviewer",        # internal process metadata
    "sourcechannel",   # internal process metadata
]


def main():
    with open(SRC, "r", encoding="utf-8") as f:
        data = json.load(f)

    removed = {k: 0 for k in STRIP}
    for c in data.get("cases", []):
        for k in STRIP:
            if k in c:
                removed[k] += 1
                del c[k]

    data["build"] = "github-pages-v4-public"

    os.makedirs(os.path.dirname(DST), exist_ok=True)
    with open(DST, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print("[OK] wrote %s" % os.path.normpath(DST))
    print("[OK] cases: %d" % len(data.get("cases", [])))
    for k in STRIP:
        print("  - stripped %-16s from %d cases" % (k, removed[k]))


if __name__ == "__main__":
    sys.exit(main())
