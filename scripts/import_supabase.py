import json
import os
import re
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

import requests

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
TRANSLATION_API_KEY = os.getenv("TRANSLATION_API_KEY")
TRANSLATION_API_URL = "https://translation.googleapis.com/language/translate/v2"

WORKFLOWS_DIR = Path(__file__).resolve().parent.parent / "workflows"

headers = {
    "apikey": SUPABASE_SERVICE_ROLE_KEY or "",
    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}" if SUPABASE_SERVICE_ROLE_KEY else "",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}


def slugify(value: str) -> str:
    value = value.lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def translate_text(text: str, target_lang: str = "pt") -> str:
    """Translate text using Google Translate API if key is provided."""
    if not text or not TRANSLATION_API_KEY:
        return text
    try:
        resp = requests.post(
            TRANSLATION_API_URL,
            params={"key": TRANSLATION_API_KEY},
            json={"q": text, "target": target_lang},
            timeout=30,
        )
        data = resp.json()
        return data["data"]["translations"][0]["translatedText"]
    except Exception:
        return text


def import_workflow(file_path: Path) -> Dict[str, Any]:
    with open(file_path, "r", encoding="utf-8") as f:
        wf = json.load(f)

    title = wf.get("name") or file_path.stem
    description = wf.get("settings", {}).get("description", "")
    tags: List[str] = [t.get("name", "") for t in wf.get("tags", []) if t.get("name")]

    slug = slugify(title)
    translated_title = translate_text(title)
    translated_description = translate_text(description)

    payload = {
        "slug": slug,
        "title": title,
        "description": description,
        "tags": tags,
        "original_lang": wf.get("lang", "en"),
        "content": wf,
        "status": "free",
        "imported_at": datetime.utcnow().isoformat(),
        "title_pt": translated_title,
        "description_pt": translated_description,
    }

    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        print(f"[DRY RUN] Would insert {slug}")
        return {"slug": slug, "dry_run": True}

    resp = requests.post(
        f"{SUPABASE_URL}/rest/v1/workflows",
        json=payload,
        headers=headers,
        timeout=30,
    )
    if resp.status_code >= 300:
        raise RuntimeError(f"Supabase error {resp.status_code}: {resp.text}")
    return resp.json()[0]


def main() -> None:
    files = sorted(WORKFLOWS_DIR.glob("*.json"))
    if not files:
        print("No workflows found")
        return
    for file_path in files:
        try:
            result = import_workflow(file_path)
            print(f"Imported {result['slug']}")
        except Exception as exc:
            print(f"Error importing {file_path.name}: {exc}")


if __name__ == "__main__":
    main()
