import sys
import os
import io
from pypdf import PdfWriter

# Add project root directory to python path
# Current file: backend/tests/test_parser_manual.py
# Root: ../../
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(current_dir))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from backend.services.parser import parser_service

def test_parser_workflow():
    print("Testing Parser Service...")

    # 1. Create a dummy PDF in memory
    print("Creating dummy PDF...")
    pdf_writer = PdfWriter()
    page = pdf_writer.add_blank_page(width=72, height=72)
    
    # We can't easily write text with pypdf to a new PDF without reportlab,
    # but we can try to mock the extraction part.
    # Actually, let's test extraction with a real sample PDF if possible, or skip extraction
    # and test LLM analysis directly with a string.
    
    sample_text = """
    AGREEMENT
    
    This agreement is made on 2024-05-20.
    
    1. Payment Schedule
    The Client agrees to pay the total sum of $5,000.
    - Initial deposit of $1,000 due on 2024-06-01.
    - Final payment of $4,000 due on 2024-07-15.
    
    2. Deliverables
    The Contractor must submit the Final Report by 2024-08-01.
    """
    
    print(f"Sample Text:\n{sample_text}")
    print("-" * 30)

    # 2. Test LLM Analysis
    print("Calling Azure OpenAI...")
    events = parser_service.analyze_text_with_llm(sample_text)
    
    print(f"Result: Found {len(events)} events.")
    for event in events:
        print(f" - {event.get('title')}: {event.get('due_date')} (Score: {event.get('confidence_score')})")

    print("-" * 30)

    # 4. Test Chinese comprehension
    print("Testing Traditional Chinese Text...")
    chinese_sample_text = """
    合約協議書
    
    本合約於 2024年10月1日 簽訂。
    
    第一條 付款時程
    甲方同意支付乙方總金額新台幣壹拾萬元整。
    - 第一期款：簽約後十日內，即 2024-10-11 前支付 30%。
    - 第二期款：期中報告審核通過後，預計於 2024年12月5日 支付 40%。
    - 尾款：專案驗收完成後，於 2025/01/20 前支付剩餘 30%。
    
    第二條 交付項目
    乙方應於 2024-11-30 前提交期中報告。
    乙方應於 2025年1月10日 前提交結案報告與原始碼。
    """
    
    print(f"Chinese Sample Text:\n{chinese_sample_text}")
    print("-" * 30)
    
    events_zh = parser_service.analyze_text_with_llm(chinese_sample_text)
    
    print(f"Result (Chinese): Found {len(events_zh)} events.")
    for event in events_zh:
        print(f" - {event.get('title')}: {event.get('due_date')} (Score: {event.get('confidence_score')})")

    # 5. Overall Validation
    if len(events) >= 3 and len(events_zh) >= 5:
        print("SUCCESS: Retrieved expected number of events for both English and Chinese.")
    else:
        print(f"WARNING: Expected events, got En:{len(events)}, Zh:{len(events_zh)}")

if __name__ == "__main__":
    test_parser_workflow()
