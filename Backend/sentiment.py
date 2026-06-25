from gemini_client import GeminiClient


class SentimentAnalyzer:
    def __init__(self):
        self.client = GeminiClient()

    def analyze(self, symbol):
        if not self.client.enabled:
            return {
                "score": 0.0,
                "label": "Neutral",
                "warning": f"Live news sentiment is not configured for {symbol}.",
            }

        prompt = (
            f"Analyze the overall sentiment for the stock symbol {symbol} today. "
            "Return valid JSON only with the fields score, label, and warning. "
            "Use score between -1.0 and 1.0, label should be Positive, Neutral, or Negative, "
            "and warning should be a brief caution message if there is uncertainty."
        )
        text = self.client.generate_text(prompt, temperature=0.0, max_output_tokens=120)
        parsed = self.client.extract_json(text) if text else None

        if parsed and self._valid_result(parsed):
            score = float(parsed.get("score", 0.0))
            return {
                "score": max(-1.0, min(1.0, score)),
                "label": str(parsed.get("label", "Neutral")).title(),
                "warning": str(parsed.get("warning", "No warning.")) or "No warning.",
            }

        return {
            "score": 0.0,
            "label": "Neutral",
            "warning": f"Sentiment service could not parse Gemini response for {symbol}.",
        }

    @staticmethod
    def _valid_result(parsed):
        if not isinstance(parsed, dict):
            return False
        if "score" not in parsed or "label" not in parsed:
            return False
        try:
            float(parsed["score"])
        except (TypeError, ValueError):
            return False
        return True
