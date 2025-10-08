"""Performance benchmark script for T-04-ST5.
Uses Locust to measure ingestion throughput against the /api/upload endpoint.
"""

from __future__ import annotations

import json
import os
import random
import time
import uuid
from dataclasses import dataclass
from io import BytesIO
from pathlib import Path
from typing import Optional

from locust import HttpUser, events, task


def _to_bool(value: str | None, default: bool) -> bool:
    if value is None:
        return default
    return value.lower() in {"1", "true", "yes", "on"}


@dataclass
class BenchmarkConfig:
    auth_token: str
    file_size_mb: float
    wait_time_min: float
    wait_time_max: float
    delete_after_upload: bool
    report_path: Path
    metadata_title: str
    metadata_description: str
    mime_type: str = "text/markdown"
    file_extension: str = ".md"

    @property
    def file_size_bytes(self) -> int:
        return int(self.file_size_mb * 1024 * 1024)

    @classmethod
    def from_env(cls) -> "BenchmarkConfig":
        token = os.getenv("BENCHMARK_AUTH_TOKEN")
        if not token:
            raise RuntimeError(
                "Missing BENCHMARK_AUTH_TOKEN environment variable. "
                "Provide a valid Bearer token for the upload API before running the benchmark."
            )

        file_size_mb = float(os.getenv("BENCHMARK_FILE_SIZE_MB", "10"))
        wait_time_min = float(os.getenv("BENCHMARK_WAIT_TIME_MIN", "0.2"))
        wait_time_max = float(os.getenv("BENCHMARK_WAIT_TIME_MAX", "1.0"))
        delete_after = _to_bool(os.getenv("BENCHMARK_DELETE_AFTER_UPLOAD"), True)
        report_path = Path(
            os.getenv(
                "BENCHMARK_REPORT_PATH",
                "backend/reports/ingest_benchmark_report.json",
            )
        )
        title = os.getenv("BENCHMARK_TITLE_PREFIX", "Benchmark Document")
        description = os.getenv(
            "BENCHMARK_DESCRIPTION",
            "Synthetic document used for ingestion throughput benchmark (T-04-ST5)",
        )

        if wait_time_min > wait_time_max:
            raise ValueError(
                "BENCHMARK_WAIT_TIME_MIN cannot be greater than BENCHMARK_WAIT_TIME_MAX"
            )

        return cls(
            auth_token=token,
            file_size_mb=file_size_mb,
            wait_time_min=wait_time_min,
            wait_time_max=wait_time_max,
            delete_after_upload=delete_after,
            report_path=report_path,
            metadata_title=title,
            metadata_description=description,
        )


class BenchmarkStats:
    """Collects aggregate metrics across the benchmark run."""

    def __init__(self) -> None:
        self.reset()

    def reset(self) -> None:
        self.start_time: Optional[float] = None
        self.total_bytes: int = 0
        self.successful_uploads: int = 0
        self.failed_uploads: int = 0
        self.response_times_ms: list[float] = []

    def start(self) -> None:
        self.start_time = time.time()

    def record_success(self, bytes_uploaded: int, response_time_ms: float) -> None:
        self.total_bytes += bytes_uploaded
        self.successful_uploads += 1
        self.response_times_ms.append(response_time_ms)

    def record_failure(self) -> None:
        self.failed_uploads += 1


CONFIG: Optional[BenchmarkConfig] = None
BENCHMARK_PAYLOAD: Optional[bytes] = None
STATS = BenchmarkStats()


def ensure_config() -> BenchmarkConfig:
    """Load configuration lazily to allow env setup prior to import."""

    global CONFIG, BENCHMARK_PAYLOAD

    if CONFIG is None:
        CONFIG = BenchmarkConfig.from_env()
        BENCHMARK_PAYLOAD = _build_payload(CONFIG.file_size_bytes)
    return CONFIG


def _build_payload(size_bytes: int) -> bytes:
    """Build deterministic Markdown payload for the desired size."""

    if size_bytes <= 0:
        raise ValueError("File size must be greater than zero")

    base_block = (
        "# Benchmark Document\n"
        "Este archivo es generado automaticamente para medir el rendimiento de ingesta.\n"
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit.\n"
    ).encode("utf-8")

    repeats = (size_bytes // len(base_block)) + 2
    payload = (base_block * repeats)[:size_bytes]
    return payload


def _dynamic_wait_time(_: HttpUser) -> float:
    cfg = ensure_config()
    return random.uniform(cfg.wait_time_min, cfg.wait_time_max)


class UploadBenchmarkUser(HttpUser):
    wait_time = _dynamic_wait_time

    def on_start(self) -> None:
        cfg = ensure_config()
        self.headers = {"Authorization": f"Bearer {cfg.auth_token}"}

    @task
    def upload_document(self) -> None:
        cfg = ensure_config()
        payload = BENCHMARK_PAYLOAD or _build_payload(cfg.file_size_bytes)

        file_name = f"benchmark_{uuid.uuid4().hex}{cfg.file_extension}"
        file_stream = BytesIO(payload)
        file_stream.name = file_name

        metadata = {
            "title": f"{cfg.metadata_title} {uuid.uuid4().hex[:8]}",
            "description": cfg.metadata_description,
        }

        with self.client.post(
            "/api/upload",
            files={"file": (file_name, file_stream, cfg.mime_type)},
            data=metadata,
            headers=self.headers,
            name="/api/upload",
            catch_response=True,
        ) as response:
            if response.status_code == 201:
                response_json = response.json()
                document = response_json.get("document", {})
                document_id = document.get("id")
                elapsed_ms = response.elapsed.total_seconds() * 1000 if response.elapsed else 0.0
                STATS.record_success(len(payload), elapsed_ms)
                response.success()

                if cfg.delete_after_upload and document_id:
                    delete_name = "/api/documents/{id}"
                    delete_response = self.client.delete(
                        f"/api/documents/{document_id}?hard_delete=true",
                        headers=self.headers,
                        name=delete_name,
                        catch_response=True,
                    )
                    if delete_response.status_code in {204, 404}:
                        delete_response.success()
                    else:
                        delete_response.failure(
                            f"Failed to delete document {document_id}: "
                            f"{delete_response.status_code}"
                        )
            else:
                STATS.record_failure()
                detail = None
                try:
                    detail = response.json()
                except Exception:  # pragma: no cover - best-effort logging only
                    detail = response.text
                response.failure(f"Upload failed with status {response.status_code}: {detail}")


@events.test_start.add_listener
def on_test_start(_environment, **kwargs):
    ensure_config()
    STATS.reset()
    STATS.start()


@events.quitting.add_listener
def on_quitting(environment, **kwargs):
    cfg = ensure_config()

    duration_seconds = time.time() - STATS.start_time if STATS.start_time else 0.0
    total_mb = STATS.total_bytes / (1024 * 1024)
    throughput_mb_per_hour = (total_mb / duration_seconds) * 3600 if duration_seconds > 0 else 0.0

    upload_stats = environment.stats.get("/api/upload", method="POST")
    avg_response_ms = float(upload_stats.avg_response_time) if upload_stats else None
    p95_response_ms = (
        float(upload_stats.get_response_time_percentile(0.95)) if upload_stats else None
    )

    report = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "task": "T-04-ST5",
        "metrics": {
            "total_uploads": STATS.successful_uploads,
            "failed_uploads": STATS.failed_uploads,
            "total_megabytes": round(total_mb, 4),
            "duration_seconds": round(duration_seconds, 2),
            "throughput_mb_per_hour": round(throughput_mb_per_hour, 2),
            "avg_response_time_ms": avg_response_ms,
            "p95_response_time_ms": p95_response_ms,
        },
        "config": {
            "file_size_mb": cfg.file_size_mb,
            "delete_after_upload": cfg.delete_after_upload,
            "wait_time_min": cfg.wait_time_min,
            "wait_time_max": cfg.wait_time_max,
            "description": cfg.metadata_description,
        },
    }

    cfg.report_path.parent.mkdir(parents=True, exist_ok=True)
    cfg.report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")

    print("\n=== Ingest Benchmark Summary (T-04-ST5) ===")
    print(json.dumps(report, indent=2))
    print(f"Report written to {cfg.report_path.resolve()}")
