"""
Locust load test for document ingestion (PERF-003).

Validates KPI: Ingestion rate >= 100 documents/hour

Test Configuration:
- 10 concurrent users
- 5-minute test duration
- Mixed document types (PDF, DOCX, MD)
- JWT authentication required

Usage:
    # Run with Locust web UI
    locust -f backend/tests/performance/locust_ingestion.py --host=http://localhost:8000

    # Run headless (5 minutes, 10 users)
    locust -f backend/tests/performance/locust_ingestion.py --host=http://localhost:8000 \
           --headless -u 10 -r 2 -t 5m --html=reports/ingestion_report.html

KPI Validation:
    - Target: >= 100 documents/hour (1.67 docs/min, 0.028 docs/sec)
    - Measured: Total successful uploads / duration (hours)
    - Pass criteria: Throughput >= 100 docs/hour AND p95 latency acceptable
"""

import os
import time
from pathlib import Path
from typing import Optional

from locust import HttpUser, task, between, events
from locust.env import Environment


class DocumentIngestionUser(HttpUser):
    """
    Simulates users uploading documents to the RAG pipeline.

    Authentication:
        - Uses JWT token from TEST_AUTH_TOKEN environment variable
        - Token must be valid for the test duration

    Tasks:
        - upload_small_pdf (40% probability)
        - upload_medium_pdf (30% probability)
        - upload_large_pdf (20% probability)
        - upload_docx (5% probability)
        - upload_markdown (5% probability)
    """

    wait_time = between(1, 3)  # Wait 1-3 seconds between requests
    host = "http://localhost:8000"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.auth_token: Optional[str] = None
        self.fixtures_dir: Optional[Path] = None
        self.upload_count = 0

    def on_start(self):
        """
        Initialize user session and authenticate.

        Retrieves JWT token from environment variable.
        Sets up path to test fixtures.
        """
        # Get JWT token from environment
        self.auth_token = os.getenv("TEST_AUTH_TOKEN")
        if not self.auth_token:
            raise ValueError(
                "TEST_AUTH_TOKEN environment variable not set. "
                "Run: export TEST_AUTH_TOKEN='your-jwt-token'"
            )

        # Set up fixtures directory
        test_dir = Path(__file__).parent
        self.fixtures_dir = test_dir / "fixtures"

        if not self.fixtures_dir.exists():
            raise FileNotFoundError(
                f"Fixtures directory not found: {self.fixtures_dir}. "
                f"Run: python backend/tests/performance/setup_perf_test.py"
            )

        # Verify health endpoint
        with self.client.get("/api/upload/health", catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Health check failed: {response.status_code}")

    def _upload_document(self, file_path: Path, task_name: str):
        """
        Upload a document file to the /api/upload endpoint.

        Args:
            file_path: Path to document file
            task_name: Locust task name for metrics grouping
        """
        if not file_path.exists():
            print(f"Warning: Fixture not found: {file_path}")
            return

        headers = {"Authorization": f"Bearer {self.auth_token}"}

        # Read file as binary
        with open(file_path, "rb") as f:
            files = {"file": (file_path.name, f, self._get_mime_type(file_path.suffix))}

            # Upload with catch_response for custom success/failure handling
            with self.client.post(
                "/api/upload", headers=headers, files=files, catch_response=True, name=task_name
            ) as response:
                if response.status_code == 200:
                    self.upload_count += 1
                    response.success()
                elif response.status_code == 401:
                    response.failure("Authentication failed - check TEST_AUTH_TOKEN")
                elif response.status_code == 400:
                    response.failure(f"Invalid file: {response.text}")
                else:
                    response.failure(f"Upload failed: {response.status_code}")

    def _get_mime_type(self, extension: str) -> str:
        """Get MIME type for file extension."""
        mime_types = {
            ".pdf": "application/pdf",
            ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".md": "text/markdown",
        }
        return mime_types.get(extension, "application/octet-stream")

    @task(40)
    def upload_small_pdf(self):
        """Upload small PDF (10KB) - 40% of requests."""
        file_path = self.fixtures_dir / "sample_small.pdf"
        self._upload_document(file_path, "upload_small_pdf")

    @task(30)
    def upload_medium_pdf(self):
        """Upload medium PDF (50KB) - 30% of requests."""
        file_path = self.fixtures_dir / "sample_medium.pdf"
        self._upload_document(file_path, "upload_medium_pdf")

    @task(20)
    def upload_large_pdf(self):
        """Upload large PDF (100KB) - 20% of requests."""
        file_path = self.fixtures_dir / "sample_large.pdf"
        self._upload_document(file_path, "upload_large_pdf")

    @task(5)
    def upload_docx(self):
        """Upload DOCX document (15KB) - 5% of requests."""
        file_path = self.fixtures_dir / "sample.docx"
        self._upload_document(file_path, "upload_docx")

    @task(5)
    def upload_markdown(self):
        """Upload Markdown document (5KB) - 5% of requests."""
        file_path = self.fixtures_dir / "sample.md"
        self._upload_document(file_path, "upload_markdown")


# Global metrics tracking
total_uploads = 0
test_start_time = None


@events.test_start.add_listener
def on_test_start(environment: Environment, **kwargs):
    """Record test start time for throughput calculation."""
    global test_start_time
    test_start_time = time.time()
    print("\n" + "=" * 70)
    print("PERF-003: Document Ingestion Load Test")
    print("=" * 70)
    print("Target KPI: >= 100 documents/hour")
    print("Test Configuration: 10 users, 5 minutes")
    print(f"Host: {environment.host}")
    print("=" * 70 + "\n")


@events.request.add_listener
def on_request_success(
    request_type, name, response_time, response_length, exception, context, **kwargs
):
    """Track successful uploads for throughput calculation."""
    global total_uploads
    if request_type == "POST" and "/api/upload" in name and exception is None:
        total_uploads += 1


@events.test_stop.add_listener
def on_test_stop(environment: Environment, **kwargs):
    """
    Calculate and report KPI metrics.

    Metrics:
        - Total uploads (successful)
        - Test duration (seconds)
        - Throughput (documents/hour)
        - KPI validation (PASS/FAIL)
    """
    global total_uploads, test_start_time

    if test_start_time is None:
        print("Error: Test start time not recorded")
        return

    duration_seconds = time.time() - test_start_time
    duration_hours = duration_seconds / 3600

    # Calculate throughput
    throughput_per_hour = total_uploads / duration_hours if duration_hours > 0 else 0

    # Get statistics from environment
    stats = environment.stats.total
    p50 = stats.get_response_time_percentile(0.50) if stats.num_requests > 0 else 0
    p95 = stats.get_response_time_percentile(0.95) if stats.num_requests > 0 else 0
    p99 = stats.get_response_time_percentile(0.99) if stats.num_requests > 0 else 0

    # KPI validation
    kpi_target = 100  # documents/hour
    kpi_passed = throughput_per_hour >= kpi_target

    # Report results
    print("\n" + "=" * 70)
    print("PERF-003: KPI VALIDATION RESULTS")
    print("=" * 70)
    print(f"Test Duration: {duration_seconds:.2f} seconds ({duration_hours:.4f} hours)")
    print(f"Total Uploads: {total_uploads} documents")
    print(f"Successful Requests: {stats.num_requests}")
    print(f"Failed Requests: {stats.num_failures}")
    print(f"\nThroughput: {throughput_per_hour:.2f} documents/hour")
    print(f"Target KPI: >= {kpi_target} documents/hour")
    print("\nLatency Metrics:")
    print(f"  - Average: {stats.avg_response_time:.2f}ms")
    print(f"  - p50: {p50:.2f}ms")
    print(f"  - p95: {p95:.2f}ms")
    print(f"  - p99: {p99:.2f}ms")
    print(f"\nKPI Status: {'PASS' if kpi_passed else 'FAIL'}")
    print("=" * 70 + "\n")

    # Exit with error code if KPI not met
    if not kpi_passed:
        print(f"WARNING: Throughput {throughput_per_hour:.2f} below target {kpi_target}")
        environment.process_exit_code = 1
