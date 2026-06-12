import os
import google.generativeai as genai
from typing import List, Dict, Any

def get_ai_explanation(drifts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    # In a real scenario we'd batch this or do it asynchronously, 
    # but for simplicity we'll generate one response covering all drifts
    # or iterate through them. Let's do it individually for precision if count is small,
    # or batch if large. Let's do individually for best results.
    
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("Warning: GEMINI_API_KEY not found in environment. Returning mock AI responses.")
        for drift in drifts:
            drift["ai_explanation"] = f"Mock AI Explanation for {drift['key']} changing to {drift['new_value']}."
            drift["recommendation"] = "Mock recommendation: Review this change."
        return drifts
        
    genai.configure(api_key=api_key)
    # Using a fast model
    model = genai.GenerativeModel('gemini-1.5-flash')
    
    for drift in drifts:
        prompt = f"""
        You are a Cloud Infrastructure and Configuration Expert.
        
        A configuration drift has been detected:
        Configuration Key: {drift['key']}
        Old Value: {drift['old_value']}
        New Value: {drift['new_value']}
        Assigned Severity: {drift['severity']}
        
        Explain:
        1. What changed and its potential impact.
        2. The risk level.
        3. A specific recommendation on how to address or fix this.
        
        Please format your response clearly, avoiding markdown blocks if possible, just return two sections separated by "RECOMMENDATION_START":
        The first part should be the explanation. The second part (after RECOMMENDATION_START) should be the recommendation.
        Keep it concise.
        """
        
        try:
            response = model.generate_content(prompt)
            text = response.text
            if "RECOMMENDATION_START" in text:
                parts = text.split("RECOMMENDATION_START")
                drift["ai_explanation"] = parts[0].strip()
                drift["recommendation"] = parts[1].strip()
            else:
                drift["ai_explanation"] = text.strip()
                drift["recommendation"] = "Review the explanation above."
        except Exception as e:
            drift["ai_explanation"] = f"Failed to generate AI explanation: {str(e)}"
            drift["recommendation"] = "N/A"
            
    return drifts
