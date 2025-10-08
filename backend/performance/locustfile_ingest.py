"""
Locust load testing script for RAG Pipeline Ingestion (T-04-ST5)
Measures ingestion performance for PERF-003 compliance

Usage:
    locust -f backend/performance/locustfile_ingest.py --host=http://localhost:8000

Web UI: http://localhost:8089
"""

import random
from io import BytesIO
from locust import HttpUser, task, between
from pathlib import Path


class RAGIngestionUser(HttpUser):
    """
    Simulates users uploading documents to the RAG pipeline
    """

    # Wait 1-3 seconds between tasks (simulates realistic user behavior)
    wait_time = between(1, 3)

    # Test file paths (adjust if needed)
    fixtures_dir = Path(__file__).parent.parent / "tests" / "fixtures" / "documents"

    def on_start(self):
        """Initialize test files on user spawn"""
        self.test_files = {
            "pdf": self.fixtures_dir / "sample.pdf",
            "docx": self.fixtures_dir / "report.docx",
            "md": self.fixtures_dir / "sample.md",
        }

        # Verify test files exist
        for file_type, file_path in self.test_files.items():
            if not file_path.exists():
                print(f"WARNING: Test file not found: {file_path}")
                print(f"Creating dummy {file_type} file for testing...")
                self._create_dummy_file(file_type, file_path)

    def _create_dummy_file(self, file_type: str, file_path: Path):
        """Create dummy test file if fixtures don't exist"""
        file_path.parent.mkdir(parents=True, exist_ok=True)

        if file_type == "md":
            # Create dummy markdown
            content = (
                "# Test Document\n\n"
                + "This is a test document for ingestion benchmarks. " * 50
                + "\n\n## Section 1\n\n"
                + "Lorem ipsum dolor sit amet. " * 100
                + "\n\n## Section 2\n\n"
                + "More content here. " * 100
            )
            file_path.write_text(content, encoding="utf-8")
        elif file_type == "pdf":
            # For PDF, we'd need PyPDF or similar - skip for now
            print(f"Please provide a real PDF file at: {file_path}")
        elif file_type == "docx":
            # For DOCX, we'd need python-docx - skip for now
            print(f"Please provide a real DOCX file at: {file_path}")

    @task(5)  # 50% of tasks (weighted)
    def upload_pdf(self):
        """Upload PDF document (most common use case)"""
        self._upload_file("pdf", "application/pdf")

    @task(3)  # 30% of tasks
    def upload_docx(self):
        """Upload DOCX document"""
        self._upload_file(
            "docx",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )

    @task(2)  # 20% of tasks
    def upload_markdown(self):
        """Upload Markdown document (fastest)"""
        self._upload_file("md", "text/markdown")

    def _upload_file(self, file_type: str, mime_type: str):
        """
        Upload file to /upload endpoint

        Args:
            file_type: File extension (pdf, docx, md)
            mime_type: MIME type for the file
        """
        file_path = self.test_files.get(file_type)

        if not file_path or not file_path.exists():
            print(f"Skipping {file_type} upload - file not found")
            return

        try:
            # Read file content
            with open(file_path, "rb") as f:
                file_content = f.read()

            # Generate unique document name
            doc_id = f"bench_{file_type}_{random.randint(1000, 9999)}"
            filename = f"{doc_id}.{file_type}"

            # Prepare multipart form data
            files = {"file": (filename, BytesIO(file_content), mime_type)}
            data = {"document_name": filename}

            # Send POST request to /upload
            with self.client.post(
                "/upload",
                files=files,
                data=data,
                catch_response=True,
                name=f"/upload [{ file_type.upper()}]",  # Group by file type in stats
            ) as response:
                if response.status_code == 200:
                    response.success()
                elif response.status_code == 429:
                    # Rate limit hit (expected under high load)
                    response.failure("Rate limit (429)")
                elif response.status_code >= 500:
                    # Server error
                    response.failure(f"Server error ({response.status_code})")
                else:
                    # Other errors
                    response.failure(f"Failed ({response.status_code})")

        except Exception as e:
            print(f"Error uploading {file_type}: {e}")


class IngestBenchmarkUser(HttpUser):
    """
    Simplified user for pure ingestion benchmarking
    Only uploads files, no other interactions
    """

    wait_time = between(0.5, 2)  # Faster for stress testing

    fixtures_dir = Path(__file__).parent.parent / "tests" / "fixtures" / "documents"

    def on_start(self):
        """Load test files"""
        self.pdf_file = self.fixtures_dir / "sample.pdf"
        self.docx_file = self.fixtures_dir / "report.docx"
        self.md_file = self.fixtures_dir / "sample.md"

    @task
    def upload_mixed_documents(self):
        """Upload random document type"""
        file_type = random.choices(["pdf", "docx", "md"], weights=[0.5, 0.3, 0.2])[0]

        file_map = {
            "pdf": (self.pdf_file, "application/pdf"),
            "docx": (
                self.docx_file,
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ),
            "md": (self.md_file, "text/markdown"),
        }

        file_path, mime_type = file_map[file_type]

        if not file_path.exists():
            return

        try:
            with open(file_path, "rb") as f:
                files = {
                    "file": (
                        f"doc_{random.randint(1000, 9999)}.{file_type}",
                        f,
                        mime_type,
                    )
                }

                self.client.post(
                    "/upload",
                    files=files,
                    data={"document_name": f"benchmark_{file_type}"},
                    name=f"/upload [{file_type.upper()}]",
                )
        except Exception as e:
            print(f"Upload error: {e}")


# Configuration for headless mode (CLI)
if __name__ == "__main__":
    print("=" * 70)
    print("RAG PIPELINE INGESTION BENCHMARK (T-04-ST5)")
    print("=" * 70)
    print("\nStarting Locust load test...")
    print("\nTest Configuration:")
    print("  - Host: http://localhost:8000")
    print("  - Users: Configure via CLI or Web UI")
    print("  - Duration: Configure via CLI or Web UI")
    print("\nWeb UI: http://localhost:8089")
    print("=" * 70)
    print("\nUsage:")
    print("  1. Start FastAPI backend: yarn be:dev")
    print("  2. Run this script: locust -f backend/performance/locustfile_ingest.py")
    print("  3. Open http://localhost:8089 in browser")
    print("  4. Configure users and spawn rate")
    print("  5. Start test and monitor metrics")
    print("=" * 70)
