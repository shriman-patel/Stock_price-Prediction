import json
import os
import re
from typing import Optional

import requests


class GeminiClient:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.access_token = os.getenv("GEMINI_ACCESS_TOKEN", "").strip()
        self.model = os.getenv("GEMINI_MODEL", "gemini-1.5-mini").strip()
        self.base_url = os.getenv("GEMINI_API_URL", "https://generativelanguage.googleapis.com/v1beta2").strip()
        self.enabled = bool(self.api_key or self.access_token)

    def _headers(self):
        headers = {"Content-Type": "application/json"}
        if self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
        return headers

    def generate_text(self, prompt: str, temperature: float = 0.2, max_output_tokens: int = 256) -> Optional[str]:
        if not self.enabled:
            return None

        url = f"{self.base_url}/models/{self.model}:generateText"
        params = {"key": self.api_key} if self.api_key and not self.access_token else None
        payload = {
            "prompt": {"text": prompt},
            "temperature": temperature,
            "maxOutputTokens": max_output_tokens,
        }

        try:
            response = requests.post(url, headers=self._headers(), params=params, json=payload, timeout=15)
            response.raise_for_status()
            data = response.json()
            text = self._extract_output(data)
            return text.strip() if text else None
        except Exception:
            return None

    @staticmethod
    def _extract_output(data: dict) -> Optional[str]:
        if not isinstance(data, dict):
            return None

        if "candidates" in data and isinstance(data["candidates"], list):
            for candidate in data["candidates"]:
                output = candidate.get("output")
                if isinstance(output, str) and output.strip():
                    return output

        if "output" in data and isinstance(data["output"], str):
            return data["output"].strip()

        return None

    @staticmethod
    def extract_json(text: str) -> Optional[dict]:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if not match:
            return None
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            return None
