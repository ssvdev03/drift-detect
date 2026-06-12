from fpdf import FPDF
import tempfile
import os
from typing import List, Dict, Any

class PDFReport(FPDF):
    def header(self):
        self.set_font('Arial', 'B', 15)
        self.cell(0, 10, 'Config Drift Detector - Analysis Report', 0, 1, 'C')
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')

def generate_markdown(drifts: List[Dict[str, Any]], stats: Dict[str, Any]) -> str:
    md = "# Config Drift Detector - Analysis Report\n\n"
    
    md += "## Summary Statistics\n"
    md += f"- **Total Drifts**: {stats['total_drifts']}\n"
    md += f"- **Breaking Issues**: {stats['breaking_count']}\n"
    md += f"- **Functional Issues**: {stats['functional_count']}\n"
    md += f"- **Cosmetic Issues**: {stats['cosmetic_count']}\n\n"
    
    md += "## Drift Details\n\n"
    
    for idx, drift in enumerate(drifts, 1):
        md += f"### {idx}. Key: `{drift['key']}`\n"
        md += f"- **Severity**: {drift['severity']}\n"
        md += f"- **Old Value**: `{drift['old_value']}`\n"
        md += f"- **New Value**: `{drift['new_value']}`\n\n"
        md += f"#### AI Explanation\n{drift['ai_explanation']}\n\n"
        md += f"#### Recommendation\n{drift['recommendation']}\n\n"
        md += "---\n\n"
        
    return md

import textwrap

def generate_pdf(drifts: List[Dict[str, Any]], stats: Dict[str, Any]) -> str:
    pdf = PDFReport()
    pdf.add_page()
    
    # Summary
    pdf.set_font('Arial', 'B', 12)
    pdf.cell(0, 10, 'Summary Statistics', 0, 1)
    
    pdf.set_font('Arial', '', 11)
    pdf.cell(0, 8, f"Total Drifts: {stats['total_drifts']}", 0, 1)
    pdf.cell(0, 8, f"Breaking Issues: {stats['breaking_count']}", 0, 1)
    pdf.cell(0, 8, f"Functional Issues: {stats['functional_count']}", 0, 1)
    pdf.cell(0, 8, f"Cosmetic Issues: {stats['cosmetic_count']}", 0, 1)
    pdf.ln(10)
    
    pdf.set_font('Arial', 'B', 12)
    pdf.cell(0, 10, 'Drift Details', 0, 1)
    
    for idx, drift in enumerate(drifts, 1):
        pdf.set_font('Arial', 'B', 11)
        key_text = f"{idx}. Key: {drift['key']} ({drift['severity']})"
        pdf.cell(0, 8, key_text.encode('latin-1', 'replace').decode('latin-1'), 0, 1)
        
        pdf.set_font('Arial', '', 10)
        old_lines = textwrap.wrap(f"Old Value: {drift['old_value']}".encode('latin-1', 'replace').decode('latin-1'), width=100)
        for line in old_lines:
            pdf.cell(0, 6, line, 0, 1)
            
        new_lines = textwrap.wrap(f"New Value: {drift['new_value']}".encode('latin-1', 'replace').decode('latin-1'), width=100)
        for line in new_lines:
            pdf.cell(0, 6, line, 0, 1)
        
        pdf.set_font('Arial', 'I', 10)
        exp_lines = textwrap.wrap(f"Explanation: {drift['ai_explanation']}".encode('latin-1', 'replace').decode('latin-1'), width=100)
        for line in exp_lines:
            pdf.cell(0, 6, line, 0, 1)
        
        pdf.set_font('Arial', 'B', 10)
        rec_lines = textwrap.wrap(f"Recommendation: {drift['recommendation']}".encode('latin-1', 'replace').decode('latin-1'), width=100)
        for line in rec_lines:
            pdf.cell(0, 6, line, 0, 1)
        pdf.ln(5)
        
    # Save to temp file
    temp_fd, temp_path = tempfile.mkstemp(suffix=".pdf")
    os.close(temp_fd)
    pdf.output(temp_path)
    return temp_path
