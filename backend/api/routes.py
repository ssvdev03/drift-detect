from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse, PlainTextResponse
from typing import List, Dict, Any
import os
import tempfile
import json

from services.diff_service import compare_configs
from services.ai_service import get_ai_explanation
from services.report_service import generate_markdown, generate_pdf

router = APIRouter()

# In-memory storage for simple reporting functionality without a DB
results_cache = {}

@router.post("/api/analyze")
async def analyze_configs(
    intended_file: UploadFile = File(...),
    actual_file: UploadFile = File(...)
):
    try:
        intended_content = (await intended_file.read()).decode("utf-8")
        actual_content = (await actual_file.read()).decode("utf-8")
        
        drifts = compare_configs(
            intended_content, intended_file.filename,
            actual_content, actual_file.filename
        )
        
        # Add AI Explanations
        drifts_with_ai = get_ai_explanation(drifts)
        
        # Calculate stats
        breaking = sum(1 for d in drifts if d['severity'] == 'Breaking')
        functional = sum(1 for d in drifts if d['severity'] == 'Functional')
        cosmetic = sum(1 for d in drifts if d['severity'] == 'Cosmetic')
        
        stats = {
            "total_drifts": len(drifts),
            "breaking_count": breaking,
            "functional_count": functional,
            "cosmetic_count": cosmetic
        }
        
        result_id = os.urandom(8).hex()
        results_cache[result_id] = {
            "drifts": drifts_with_ai,
            "stats": stats
        }
        
        return {
            "result_id": result_id,
            "drifts": drifts_with_ai,
            "stats": stats
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/api/reports/markdown/{result_id}")
async def get_markdown_report(result_id: str):
    if result_id not in results_cache:
        raise HTTPException(status_code=404, detail="Result not found")
        
    data = results_cache[result_id]
    md_content = generate_markdown(data["drifts"], data["stats"])
    
    # Write to temp file
    temp_fd, temp_path = tempfile.mkstemp(suffix=".md")
    with os.fdopen(temp_fd, 'w', encoding='utf-8') as f:
        f.write(md_content)
        
    return FileResponse(path=temp_path, filename="drift_report.md", media_type='text/markdown')

@router.get("/api/reports/pdf/{result_id}")
async def get_pdf_report(result_id: str):
    if result_id not in results_cache:
        raise HTTPException(status_code=404, detail="Result not found")
        
    data = results_cache[result_id]
    pdf_path = generate_pdf(data["drifts"], data["stats"])
    
    return FileResponse(path=pdf_path, filename="drift_report.pdf", media_type='application/pdf')
