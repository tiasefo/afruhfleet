from __future__ import annotations

import json
import logging
import os
from functools import lru_cache
from pathlib import Path
from typing import Any

logger = logging.getLogger("afruheritage.i18n")

SUPPORTED_LANGUAGES = {"en", "zh"}
DEFAULT_LANGUAGE = "en"
LOCALE_DIR = Path(__file__).resolve().parent.parent / "locales"

_translations: dict[str, dict[str, str]] = {}


def _load_locale(lang: str) -> dict[str, str]:
    filepath = LOCALE_DIR / f"{lang}.json"
    if not filepath.exists():
        logger.warning("Locale file not found: %s", filepath)
        return {}
    with open(filepath, encoding="utf-8") as f:
        return json.load(f)


def init_i18n() -> None:
    for lang in SUPPORTED_LANGUAGES:
        _translations[lang] = _load_locale(lang)
    logger.info("Loaded i18n locales: %s", list(_translations.keys()))


def t(key: str, lang: str = DEFAULT_LANGUAGE, **kwargs: Any) -> str:
    lang = lang if lang in SUPPORTED_LANGUAGES else DEFAULT_LANGUAGE
    translations = _translations.get(lang, {})
    text = translations.get(key)
    if text is None:
        fallback = _translations.get(DEFAULT_LANGUAGE, {})
        text = fallback.get(key, key)
    if kwargs:
        try:
            text = text.format(**kwargs)
        except (KeyError, IndexError):
            pass
    return text


def detect_language(accept_language: str | None) -> str:
    if not accept_language:
        return DEFAULT_LANGUAGE
    for part in accept_language.split(","):
        lang = part.strip().split(";")[0].strip().lower()
        if lang.startswith("zh"):
            return "zh"
        if lang.startswith("en"):
            return "en"
    return DEFAULT_LANGUAGE
