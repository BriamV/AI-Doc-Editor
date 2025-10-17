"""
Locust load test for document search (PERF-004).

Validates KPI: Search latency p95 < 500ms

Test Configuration:
- 20 concurrent users
- 5-minute test duration
- Realistic search queries (technical content)
- JWT authentication required

Prerequisites:
    - Database populated with >= 100 documents
    - Run: python backend/tests/performance/setup_perf_test.py

Usage:
    # Run with Locust web UI
    locust -f backend/tests/performance/locust_search.py --host=http://localhost:8000

    # Run headless (5 minutes, 20 users)
    locust -f backend/tests/performance/locust_search.py --host=http://localhost:8000 \
           --headless -u 20 -r 4 -t 5m --html=reports/search_report.html

KPI Validation:
    - Target: p95 latency < 500ms
    - Measured: 95th percentile of search response times
    - Pass criteria: p95 < 500ms AND error rate < 5%
"""

import os
import random
import time
from typing import Optional

from locust import HttpUser, task, between, events
from locust.env import Environment


# Realistic search queries for technical documentation
SEARCH_QUERIES = [
    # AI & Machine Learning
    "machine learning algorithms",
    "neural network architecture",
    "deep learning models",
    "natural language processing",
    "computer vision techniques",
    "reinforcement learning strategies",
    "transformer models attention mechanism",
    "gradient descent optimization",
    # Software Engineering
    "REST API design patterns",
    "microservices architecture",
    "database indexing strategies",
    "authentication and authorization",
    "cloud computing infrastructure",
    "CI/CD pipeline automation",
    "containerization with Docker",
    "kubernetes orchestration",
    # Data Science
    "data preprocessing techniques",
    "statistical analysis methods",
    "feature engineering strategies",
    "model evaluation metrics",
    "time series forecasting",
    "anomaly detection algorithms",
    "data visualization best practices",
    "exploratory data analysis",
    # Web Development
    "frontend framework comparison",
    "backend API development",
    "database schema design",
    "web security best practices",
    "performance optimization techniques",
    "responsive design patterns",
    "state management in React",
    "GraphQL vs REST API",
    # DevOps & Infrastructure
    "infrastructure as code",
    "monitoring and alerting systems",
    "log aggregation strategies",
    "disaster recovery planning",
    "high availability architecture",
    "load balancing techniques",
    "security scanning automation",
    "automated testing frameworks",
]


class DocumentSearchUser(HttpUser):
    """
    Simulates users searching documents in the RAG system.

    Authentication:
        - Uses JWT token from TEST_AUTH_TOKEN environment variable
        - Token must be valid for the test duration

    Tasks:
        - search_short_query (50% probability)
        - search_medium_query (30% probability)
        - search_long_query (20% probability)
    """

    wait_time = between(0.5, 2)  # Wait 0.5-2 seconds between requests
    host = "http://localhost:8000"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.auth_token: Optional[str] = None
        self.search_count = 0

    def on_start(self):
        """
        Initialize user session and authenticate.

        Retrieves JWT token from environment variable.
        Verifies search endpoint availability.
        """
        # Get JWT token from environment
        self.auth_token = os.getenv("TEST_AUTH_TOKEN")
        if not self.auth_token:
            raise ValueError(
                "TEST_AUTH_TOKEN environment variable not set. "
                "Run: export TEST_AUTH_TOKEN='your-jwt-token'"
            )

        # Verify documents endpoint is accessible
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        with self.client.get("/api/documents", headers=headers, catch_response=True) as response:
            if response.status_code == 200:
                data = response.json()
                doc_count = data.get("total", 0)
                if doc_count < 10:
                    print(
                        f"Warning: Only {doc_count} documents in database. "
                        f"Run: python backend/tests/performance/setup_perf_test.py"
                    )
                response.success()
            else:
                response.failure(f"Documents endpoint check failed: {response.status_code}")

    def _search_documents(self, query: str, limit: int, task_name: str):
        """
        Search documents using the /api/documents/search endpoint.

        Args:
            query: Search query text
            limit: Maximum results to return
            task_name: Locust task name for metrics grouping
        """
        headers = {"Authorization": f"Bearer {self.auth_token}", "Content-Type": "application/json"}

        payload = {"query": query, "limit": limit, "collection_name": "documents"}

        # Search with catch_response for custom success/failure handling
        with self.client.post(
            "/api/documents/search",
            headers=headers,
            json=payload,
            catch_response=True,
            name=task_name,
        ) as response:
            if response.status_code == 200:
                self.search_count += 1
                data = response.json()
                _ = data.get("results_count", 0)
                # Success even if no results (valid empty response)
                response.success()
            elif response.status_code == 401:
                response.failure("Authentication failed - check TEST_AUTH_TOKEN")
            elif response.status_code == 402:
                response.failure("API key not configured - check user settings")
            elif response.status_code == 500:
                response.failure(f"Search failed: {response.text}")
            else:
                response.failure(f"Search error: {response.status_code}")

    @task(50)
    def search_short_query(self):
        """Search with short query (1-2 words) - 50% of requests."""
        query = random.choice(SEARCH_QUERIES).split()[:2]
        query_text = " ".join(query)
        self._search_documents(query_text, limit=5, task_name="search_short")

    @task(30)
    def search_medium_query(self):
        """Search with medium query (3-4 words) - 30% of requests."""
        query = random.choice(SEARCH_QUERIES)
        self._search_documents(query, limit=10, task_name="search_medium")

    @task(20)
    def search_long_query(self):
        """Search with long query (5+ words) - 20% of requests."""
        # Combine two queries for longer text
        query1 = random.choice(SEARCH_QUERIES)
        query2 = random.choice(SEARCH_QUERIES)
        query_text = f"{query1} {query2}"
        self._search_documents(query_text, limit=20, task_name="search_long")


# Global metrics tracking
total_searches = 0
test_start_time = None


@events.test_start.add_listener
def on_test_start(environment: Environment, **kwargs):
    """Record test start time for metrics calculation."""
    global test_start_time
    test_start_time = time.time()
    print("\n" + "=" * 70)
    print("PERF-004: Document Search Load Test")
    print("=" * 70)
    print("Target KPI: p95 latency < 500ms")
    print("Test Configuration: 20 users, 5 minutes")
    print(f"Host: {environment.host}")
    print("=" * 70 + "\n")


@events.request.add_listener
def on_request_success(
    request_type, name, response_time, response_length, exception, context, **kwargs
):
    """Track successful searches for metrics calculation."""
    global total_searches
    if request_type == "POST" and "/api/documents/search" in name and exception is None:
        total_searches += 1


@events.test_stop.add_listener
def on_test_stop(environment: Environment, **kwargs):
    """
    Calculate and report KPI metrics.

    Metrics:
        - Total searches (successful)
        - Test duration (seconds)
        - Latency percentiles (p50, p95, p99)
        - Error rate
        - KPI validation (PASS/FAIL)
    """
    global total_searches, test_start_time

    if test_start_time is None:
        print("Error: Test start time not recorded")
        return

    duration_seconds = time.time() - test_start_time

    # Get statistics from environment
    stats = environment.stats.total
    p50 = stats.get_response_time_percentile(0.50) if stats.num_requests > 0 else 0
    p95 = stats.get_response_time_percentile(0.95) if stats.num_requests > 0 else 0
    p99 = stats.get_response_time_percentile(0.99) if stats.num_requests > 0 else 0

    # Calculate error rate
    total_requests = stats.num_requests + stats.num_failures
    error_rate = (stats.num_failures / total_requests * 100) if total_requests > 0 else 0

    # KPI validation
    kpi_target_p95 = 500  # milliseconds
    kpi_passed = p95 < kpi_target_p95 and error_rate < 5

    # Calculate throughput
    throughput_per_second = total_searches / duration_seconds if duration_seconds > 0 else 0

    # Report results
    print("\n" + "=" * 70)
    print("PERF-004: KPI VALIDATION RESULTS")
    print("=" * 70)
    print(f"Test Duration: {duration_seconds:.2f} seconds")
    print(f"Total Searches: {total_searches} queries")
    print(f"Successful Requests: {stats.num_requests}")
    print(f"Failed Requests: {stats.num_failures}")
    print(f"Error Rate: {error_rate:.2f}%")
    print(f"\nThroughput: {throughput_per_second:.2f} queries/second")
    print("\nLatency Metrics:")
    print(f"  - Average: {stats.avg_response_time:.2f}ms")
    print(f"  - p50 (median): {p50:.2f}ms")
    print(f"  - p95: {p95:.2f}ms")
    print(f"  - p99: {p99:.2f}ms")
    print(f"\nTarget KPI: p95 < {kpi_target_p95}ms")
    print(f"Measured p95: {p95:.2f}ms")
    print(f"\nKPI Status: {'PASS' if kpi_passed else 'FAIL'}")

    if not kpi_passed:
        if p95 >= kpi_target_p95:
            print(f"  - Reason: p95 latency {p95:.2f}ms exceeds target {kpi_target_p95}ms")
        if error_rate >= 5:
            print(f"  - Reason: Error rate {error_rate:.2f}% exceeds 5%")

    print("=" * 70 + "\n")

    # Exit with error code if KPI not met
    if not kpi_passed:
        environment.process_exit_code = 1
