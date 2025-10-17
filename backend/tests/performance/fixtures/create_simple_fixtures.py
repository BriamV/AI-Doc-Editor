"""
Create simple fixture files for performance testing.

This script creates minimal PDF and DOCX files that can be parsed by PyPDF2 and python-docx.
Uses basic file formats without requiring additional dependencies.

Usage:
    python backend/tests/performance/fixtures/create_simple_fixtures.py
"""

from pathlib import Path


def create_minimal_pdf(output_path: Path, content: str, size_target: int):
    """
    Create a minimal valid PDF file.

    Args:
        output_path: Output file path
        content: Text content
        size_target: Target size in bytes (will pad to reach approximately this size)
    """
    # Pad content to reach target size
    padding_needed = max(0, size_target - len(content) - 500)
    padded_content = content + (" " * padding_needed)

    pdf_content = f"""%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
>>
endobj
4 0 obj
<<
/Length {len(padded_content) + 50}
>>
stream
BT
/F1 12 Tf
50 700 Td
({padded_content}) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000317 00000 n
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
{400 + len(padded_content)}
%%EOF
"""

    output_path.write_text(pdf_content, encoding="latin-1")
    actual_size = output_path.stat().st_size
    print(f"Created: {output_path} ({actual_size / 1024:.2f} KB)")


def create_minimal_docx(output_path: Path, content: str):
    """
    Create a minimal DOCX file using python-docx.

    Args:
        output_path: Output file path
        content: Text content
    """
    try:
        from docx import Document

        doc = Document()
        doc.add_heading("AI Performance Test Document", level=1)

        # Split content into paragraphs
        paragraphs = content.split("\n\n")
        for para in paragraphs:
            if para.strip():
                doc.add_paragraph(para.strip())

        doc.save(str(output_path))
        actual_size = output_path.stat().st_size
        print(f"Created: {output_path} ({actual_size / 1024:.2f} KB)")

    except ImportError:
        print(f"Warning: python-docx not installed. Skipping {output_path.name}")


def get_sample_content(size: str) -> str:
    """Generate sample AI/ML content based on size."""
    base_content = """
Artificial Intelligence and Machine Learning

Introduction to AI: Artificial Intelligence (AI) is the simulation of human intelligence
processes by machines, especially computer systems. These processes include learning,
reasoning, and self-correction. Machine learning is a subset of AI that focuses on the
development of algorithms that can learn from and make predictions based on data.

Key Concepts: Supervised Learning, Unsupervised Learning, Reinforcement Learning,
Neural Networks, Deep Learning, Natural Language Processing, Computer Vision.

Applications: Healthcare diagnosis, financial fraud detection, autonomous vehicles,
manufacturing quality control, customer service chatbots, recommendation systems.

Neural Networks: Computing systems inspired by biological neural networks. They consist
of interconnected nodes organized in layers that process information through weighted
connections.

Deep Learning: Neural networks with multiple layers that can learn hierarchical
representations of data. Revolutionized AI in image recognition, speech processing,
and natural language understanding.

Natural Language Processing: Enables computers to understand and generate human language.
Applications include machine translation, sentiment analysis, text summarization,
question answering systems.

Computer Vision: Enables machines to interpret visual information. Applications include
image classification, object detection, facial recognition, autonomous driving,
medical image analysis.

Machine Learning Frameworks: TensorFlow, PyTorch, scikit-learn, Keras, JAX.

Best Practices: Start simple, use cross-validation, monitor metrics, preprocess data,
document architecture, version control, ensure reproducibility.

Ethics: Bias in algorithms, privacy concerns, transparency needs, accountability,
job displacement considerations.

Future of AI: General AI systems, improved natural language understanding, advanced
robotics, personalized medicine, climate modeling, quantum computing integration.
"""

    if size == "small":
        return base_content[:1000]
    elif size == "medium":
        return base_content * 3
    elif size == "large":
        return base_content * 10
    else:
        return base_content


def main():
    """Generate all fixture files."""
    fixtures_dir = Path(__file__).parent
    print(f"Generating fixtures in: {fixtures_dir}")
    print("=" * 70)

    # Generate PDFs with different sizes
    create_minimal_pdf(
        fixtures_dir / "sample_small.pdf", get_sample_content("small"), size_target=10 * 1024
    )

    create_minimal_pdf(
        fixtures_dir / "sample_medium.pdf", get_sample_content("medium"), size_target=50 * 1024
    )

    create_minimal_pdf(
        fixtures_dir / "sample_large.pdf", get_sample_content("large"), size_target=100 * 1024
    )

    # Generate DOCX
    create_minimal_docx(fixtures_dir / "sample.docx", get_sample_content("medium"))

    # Markdown already created manually
    md_path = fixtures_dir / "sample.md"
    if md_path.exists():
        print(f"Existing: {md_path} ({md_path.stat().st_size / 1024:.2f} KB)")
    else:
        print(f"Warning: {md_path} not found. Create it manually.")

    print("=" * 70)
    print("Fixture generation complete!")
    print("\nNext steps:")
    print("1. Install locust: pip install locust")
    print("2. Run setup script: python backend/tests/performance/setup_perf_test.py")
    print("3. Run benchmarks: locust -f backend/tests/performance/locust_*.py")


if __name__ == "__main__":
    main()
