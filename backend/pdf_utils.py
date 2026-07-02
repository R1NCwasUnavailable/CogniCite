from pypdf import PdfReader
import io

def extract_pdf_text(file_bytes: bytes) -> str:
    """Extract all text content from PDF binary data."""
    reader = PdfReader(io.BytesIO(file_bytes))
    text_chunks = []
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text_chunks.append(page_text)
    return "\n".join(text_chunks)
