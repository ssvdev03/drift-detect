import json
import yaml
from deepdiff import DeepDiff
from typing import Dict, Any, List

def parse_file(content: str, filename: str) -> Dict[str, Any]:
    if filename.endswith(".yaml") or filename.endswith(".yml"):
        return yaml.safe_load(content)
    elif filename.endswith(".json"):
        return json.loads(content)
    else:
        raise ValueError("Unsupported file format. Please use JSON or YAML.")

def determine_severity(key: str) -> str:
    key_lower = key.lower()
    
    # Breaking keywords
    breaking_keywords = ['ssl', 'port', 'database', 'auth', 'security', 'password', 'secret', 'host', 'username']
    for keyword in breaking_keywords:
        if keyword in key_lower:
            return "Breaking"
            
    # Functional keywords
    functional_keywords = ['timeout', 'memory', 'retry', 'cache', 'performance', 'limit', 'max', 'min', 'debug']
    for keyword in functional_keywords:
        if keyword in key_lower:
            return "Functional"
            
    # Default to Cosmetic
    return "Cosmetic"

def compare_configs(intended_content: str, intended_filename: str, actual_content: str, actual_filename: str) -> List[Dict[str, Any]]:
    intended_data = parse_file(intended_content, intended_filename)
    actual_data = parse_file(actual_content, actual_filename)
    
    diff = DeepDiff(intended_data, actual_data, ignore_order=True)
    
    drifts = []
    
    if "values_changed" in diff:
        for key, value in diff["values_changed"].items():
            # Clean up DeepDiff key format e.g. root['database']['port'] -> database.port
            clean_key = key.replace("root", "").replace("['", ".").replace("']", "").replace('["', '.').replace('"]', '').strip('.')
            
            drifts.append({
                "key": clean_key,
                "old_value": str(value.get("old_value")),
                "new_value": str(value.get("new_value")),
                "severity": determine_severity(clean_key),
                "type": "value_changed"
            })
            
    if "dictionary_item_added" in diff:
        for key in diff["dictionary_item_added"]:
            clean_key = key.replace("root", "").replace("['", ".").replace("']", "").replace('["', '.').replace('"]', '').strip('.')
            
            # Since DeepDiff might not easily give the added value without eval, we try to extract from actual_data
            drifts.append({
                "key": clean_key,
                "old_value": "NOT PRESENT",
                "new_value": "ADDED",
                "severity": determine_severity(clean_key),
                "type": "item_added"
            })
            
    if "dictionary_item_removed" in diff:
        for key in diff["dictionary_item_removed"]:
            clean_key = key.replace("root", "").replace("['", ".").replace("']", "").replace('["', '.').replace('"]', '').strip('.')
            
            drifts.append({
                "key": clean_key,
                "old_value": "PRESENT",
                "new_value": "REMOVED",
                "severity": determine_severity(clean_key),
                "type": "item_removed"
            })
            
    return drifts
