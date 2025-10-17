"""
Generate test fixture documents for performance benchmarking.

Creates sample documents in multiple formats:
- PDF files (small, medium, large)
- DOCX files
- Markdown files

Usage:
    python backend/tests/performance/fixtures/generate_fixtures.py
"""

from pathlib import Path
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from docx import Document
import textwrap


def generate_sample_text(size: str) -> str:
    """
    Generate sample text content based on size.

    Args:
        size: One of 'small', 'medium', 'large'

    Returns:
        Generated text content
    """
    base_text = """
    Artificial Intelligence and Machine Learning

    Introduction to AI
    Artificial Intelligence (AI) is the simulation of human intelligence processes by machines,
    especially computer systems. These processes include learning, reasoning, and self-correction.
    Machine learning is a subset of AI that focuses on the development of algorithms that can
    learn from and make predictions or decisions based on data.

    Key Concepts in Machine Learning
    1. Supervised Learning: Learning from labeled data
    2. Unsupervised Learning: Finding patterns in unlabeled data
    3. Reinforcement Learning: Learning through trial and error
    4. Neural Networks: Computing systems inspired by biological neural networks
    5. Deep Learning: Neural networks with multiple layers

    Applications of AI
    AI has numerous applications across various industries:
    - Healthcare: Diagnosis, drug discovery, personalized treatment
    - Finance: Fraud detection, algorithmic trading, risk assessment
    - Transportation: Autonomous vehicles, traffic optimization
    - Manufacturing: Quality control, predictive maintenance
    - Customer Service: Chatbots, recommendation systems

    Natural Language Processing
    NLP enables computers to understand, interpret, and generate human language.
    Applications include machine translation, sentiment analysis, text summarization,
    and question answering systems. Modern NLP models like transformers have
    revolutionized the field with their ability to capture long-range dependencies.

    Computer Vision
    Computer vision enables machines to interpret and understand visual information from
    the world. Applications include image classification, object detection, facial recognition,
    and autonomous driving. Convolutional Neural Networks (CNNs) have been particularly
    successful in computer vision tasks.

    Ethics and Future of AI
    As AI systems become more powerful, ethical considerations become increasingly important.
    Issues include bias in algorithms, privacy concerns, job displacement, and the need for
    transparency and accountability in AI decision-making. The future of AI promises even
    more advanced capabilities, but requires careful consideration of societal impacts.
    """

    if size == "small":
        return base_text[:500]  # ~500 characters
    elif size == "medium":
        return base_text * 3  # ~3000 characters
    elif size == "large":
        return base_text * 8  # ~8000 characters
    else:
        return base_text


def generate_small_pdf(output_path: Path):
    """Generate small PDF (~10KB)."""
    c = canvas.Canvas(str(output_path), pagesize=letter)
    width, height = letter

    # Title
    c.setFont("Helvetica-Bold", 16)
    c.drawString(72, height - 72, "AI Document - Small Sample")

    # Content
    c.setFont("Helvetica", 10)
    text = generate_sample_text("small")
    y = height - 120

    for line in textwrap.wrap(text, width=80):
        c.drawString(72, y, line)
        y -= 14
        if y < 72:
            break

    c.save()
    print(f"Created: {output_path} ({output_path.stat().st_size / 1024:.2f} KB)")


def generate_medium_pdf(output_path: Path):
    """Generate medium PDF (~50KB)."""
    c = canvas.Canvas(str(output_path), pagesize=letter)
    width, height = letter

    # Title
    c.setFont("Helvetica-Bold", 16)
    c.drawString(72, height - 72, "AI Document - Medium Sample")

    # Content
    c.setFont("Helvetica", 9)
    text = generate_sample_text("medium")
    y = height - 120

    for line in textwrap.wrap(text, width=90):
        c.drawString(72, y, line)
        y -= 12
        if y < 72:
            c.showPage()
            c.setFont("Helvetica", 9)
            y = height - 72

    c.save()
    print(f"Created: {output_path} ({output_path.stat().st_size / 1024:.2f} KB)")


def generate_large_pdf(output_path: Path):
    """Generate large PDF (~100KB)."""
    c = canvas.Canvas(str(output_path), pagesize=letter)
    width, height = letter

    # Title page
    c.setFont("Helvetica-Bold", 20)
    c.drawString(72, height - 100, "Comprehensive AI Documentation")
    c.setFont("Helvetica", 12)
    c.drawString(72, height - 140, "Large Sample Document for Performance Testing")

    c.showPage()

    # Content pages
    c.setFont("Helvetica", 9)
    text = generate_sample_text("large")
    y = height - 72

    for line in textwrap.wrap(text, width=90):
        c.drawString(72, y, line)
        y -= 11
        if y < 72:
            c.showPage()
            c.setFont("Helvetica", 9)
            y = height - 72

    c.save()
    print(f"Created: {output_path} ({output_path.stat().st_size / 1024:.2f} KB)")


def generate_docx(output_path: Path):
    """Generate DOCX document (~15KB)."""
    doc = Document()

    # Title
    doc.add_heading("AI Document - DOCX Sample", level=1)

    # Content
    text = generate_sample_text("medium")
    doc.add_paragraph(text)

    # Add sections
    doc.add_heading("Additional Sections", level=2)
    doc.add_paragraph("This document contains structured content for RAG processing.")

    doc.add_heading("Key Points", level=2)
    doc.add_paragraph("- Machine learning algorithms")
    doc.add_paragraph("- Neural network architectures")
    doc.add_paragraph("- Deep learning applications")
    doc.add_paragraph("- Natural language processing")

    doc.save(str(output_path))
    print(f"Created: {output_path} ({output_path.stat().st_size / 1024:.2f} KB)")


def generate_markdown(output_path: Path):
    """Generate Markdown document (~5KB)."""
    content = (
        """# AI Document - Markdown Sample

## Introduction

This is a sample Markdown document for RAG pipeline testing.

"""
        + generate_sample_text("small")
        + """

## Technical Details

### Machine Learning Frameworks

- **TensorFlow**: Open-source machine learning framework
- **PyTorch**: Deep learning framework with dynamic computation graphs
- **scikit-learn**: Machine learning library for Python
- **Keras**: High-level neural networks API

### Best Practices

1. Start with simple models
2. Use cross-validation for model evaluation
3. Monitor training and validation metrics
4. Implement proper data preprocessing
5. Document model architecture and hyperparameters

## Conclusion

This document demonstrates various AI concepts and is used for performance benchmarking
of the RAG pipeline ingestion and search capabilities.

---
*Generated for T-04 Performance Testing*
"""
    )

    output_path.write_text(content, encoding="utf-8")
    print(f"Created: {output_path} ({output_path.stat().st_size / 1024:.2f} KB)")


def main():
    """Generate all fixture documents."""
    fixtures_dir = Path(__file__).parent
    print(f"Generating fixtures in: {fixtures_dir}")
    print("=" * 70)

    # Generate PDFs
    generate_small_pdf(fixtures_dir / "sample_small.pdf")
    generate_medium_pdf(fixtures_dir / "sample_medium.pdf")
    generate_large_pdf(fixtures_dir / "sample_large.pdf")

    # Generate DOCX
    generate_docx(fixtures_dir / "sample.docx")

    # Generate Markdown
    generate_markdown(fixtures_dir / "sample.md")

    print("=" * 70)
    print("All fixtures generated successfully!")


if __name__ == "__main__":
    main()
