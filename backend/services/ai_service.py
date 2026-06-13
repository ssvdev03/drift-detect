import os
from google import genai
from google.genai import types
from typing import List, Dict, Any


def get_ai_explanation(drifts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Add AI explanations and recommendations to each detected drift."""

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("Warning: GEMINI_API_KEY not found in environment. Returning mock AI responses.")
        for drift in drifts:
            drift["ai_explanation"] = (
                f"The configuration key '{drift['key']}' changed from "
                f"'{drift['old_value']}' to '{drift['new_value']}'. "
                f"This is classified as a {drift['severity']} severity drift."
            )
            drift["recommendation"] = (
                "Review this change carefully and ensure it aligns with your "
                "intended configuration baseline."
            )
        return drifts

    client = genai.Client(api_key=api_key)

    for drift in drifts:
        prompt = f"""You are a Cloud Infrastructure and Configuration Expert.

A configuration drift has been detected:
Configuration Key: {drift['key']}
Old Value: {drift['old_value']}
New Value: {drift['new_value']}
Assigned Severity: {drift['severity']}

Explain:
1. What changed and its potential impact.
2. The risk level.
3. A specific recommendation on how to address or fix this.

Format your response as two sections separated by the exact text "RECOMMENDATION_START":
- First section: explanation of the change and its impact.
- Second section (after RECOMMENDATION_START): the specific recommendation.
Keep it concise and avoid markdown formatting."""

        try:
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt,
            )
            text = response.text or ""
            if "RECOMMENDATION_START" in text:
                parts = text.split("RECOMMENDATION_START", 1)
                drift["ai_explanation"] = parts[0].strip()
                drift["recommendation"] = parts[1].strip()
            else:
                drift["ai_explanation"] = text.strip()
                drift["recommendation"] = "Review the explanation above for guidance."
        except Exception as e:
            drift["ai_explanation"] = f"AI analysis unavailable: {str(e)}"
            drift["recommendation"] = "Manually review this configuration change."

    return drifts
