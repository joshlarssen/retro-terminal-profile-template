from __future__ import annotations

import json
from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parent.parent
CONFIG_PATH = ROOT / "profile.config.yaml"
OUTPUT_PATH = ROOT / "src" / "profile-data.generated.js"
THEME_PRESETS_PATH = ROOT / "scripts" / "theme-presets.json"
MIN_GIF_STEP_DELAY_MS = 700
MAX_GIF_STEP_DELAY_MS = 2400
DEFAULT_GIF_STEP_DELAY_MS = 1100


def load_theme_presets() -> dict[str, dict[str, object]]:
    presets_data = json.loads(THEME_PRESETS_PATH.read_text(encoding="utf-8"))

    if not isinstance(presets_data, dict) or "presets" not in presets_data:
        raise SystemExit("scripts/theme-presets.json must contain a top-level 'presets' object")

    presets = presets_data["presets"]
    if not isinstance(presets, dict) or not presets:
        raise SystemExit("scripts/theme-presets.json must define at least one preset")

    return presets


def resolve_theme(data: dict[str, object], presets: dict[str, dict[str, object]]) -> dict[str, object]:
    preset_name = data.get("themePreset") or "vault-green"
    if not isinstance(preset_name, str):
        raise SystemExit("themePreset must be a string when provided")

    preset = presets.get(preset_name)
    if not isinstance(preset, dict):
        available = ", ".join(sorted(presets.keys()))
        raise SystemExit(f"Unknown themePreset '{preset_name}'. Available presets: {available}")

    preset_theme = preset.get("theme")
    if not isinstance(preset_theme, dict):
        raise SystemExit(f"Theme preset '{preset_name}' must define a 'theme' object")

    if "theme" in data:
        raise SystemExit(
            "Direct 'theme' overrides are no longer supported. Pick a themePreset and edit scripts/theme-presets.json to add new palettes."
        )

    data["theme"] = dict(preset_theme)
    data["themePreset"] = preset_name
    return data


def resolve_teaser_gif(data: dict[str, object]) -> dict[str, object]:
    raw_teaser = data.get("teaserGif")
    if raw_teaser is None:
        raw_teaser = {}

    if not isinstance(raw_teaser, dict):
        raise SystemExit("teaserGif must be an object when provided")

    step_delay = raw_teaser.get("stepDelayMs", DEFAULT_GIF_STEP_DELAY_MS)
    if not isinstance(step_delay, int):
        raise SystemExit("teaserGif.stepDelayMs must be an integer")

    if not MIN_GIF_STEP_DELAY_MS <= step_delay <= MAX_GIF_STEP_DELAY_MS:
        raise SystemExit(
            f"teaserGif.stepDelayMs must stay between {MIN_GIF_STEP_DELAY_MS} and {MAX_GIF_STEP_DELAY_MS} ms"
        )

    data["teaserGif"] = {
        "stepDelayMs": step_delay,
        "minStepDelayMs": MIN_GIF_STEP_DELAY_MS,
        "maxStepDelayMs": MAX_GIF_STEP_DELAY_MS,
    }
    return data


def require_bool(mapping: dict[str, object], key: str, default: bool) -> bool:
    value = mapping.get(key, default)
    if not isinstance(value, bool):
        raise SystemExit(f"crtEffects.{key} must be a boolean")
    return value


def resolve_crt_effects(data: dict[str, object]) -> dict[str, object]:
    raw_effects = data.get("crtEffects")
    if raw_effects is None:
        raw_effects = {}

    if not isinstance(raw_effects, dict):
        raise SystemExit("crtEffects must be an object when provided")

    data["crtEffects"] = {
        "enabled": require_bool(raw_effects, "enabled", True),
        "scanlines": require_bool(raw_effects, "scanlines", True),
    }
    return data


def main() -> None:
    data = yaml.safe_load(CONFIG_PATH.read_text(encoding="utf-8"))

    if not isinstance(data, dict):
        raise SystemExit("profile.config.yaml must contain a top-level mapping")

    if not isinstance(data.get("modules"), list) or not data["modules"]:
        raise SystemExit("profile.config.yaml must define at least one module")

    data = resolve_theme(data, load_theme_presets())
    data = resolve_teaser_gif(data)
    data = resolve_crt_effects(data)

    output = "export const profileData = " + json.dumps(data, indent=2, ensure_ascii=False) + ";\n"
    OUTPUT_PATH.write_text(output, encoding="utf-8")
    print(f"Generated {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
