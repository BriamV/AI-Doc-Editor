"""
Locust load testing script for RAG Pipeline Search (T-04-ST6)
Measures search latency for PERF-004 compliance

Usage:
    locust -f backend/performance/locustfile_search.py --host=http://localhost:8000

Web UI: http://localhost:8089
"""

import random
from locust import HttpUser, task, between


# Sample queries for testing (realistic user queries)
QUERIES = {
    "short": [
        "project requirements",
        "API documentation",
        "installation guide",
        "user authentication",
        "database schema",
        "configuration settings",
        "deployment process",
        "security best practices",
        "testing strategy",
        "performance metrics",
        "error handling",
        "logging configuration",
        "backup procedures",
        "monitoring setup",
        "CI/CD pipeline",
    ],
    "medium": [
        "How do I configure OAuth authentication?",
        "What are the API rate limits?",
        "Explain the database migration process",
        "How to deploy to production?",
        "What is the recommended caching strategy?",
        "How to implement user roles and permissions?",
        "What are the security audit requirements?",
        "How to optimize query performance?",
        "What is the backup and recovery process?",
        "How to configure load balancing?",
        "What are the monitoring best practices?",
        "How to handle API versioning?",
        "What is the error handling strategy?",
        "How to implement rate limiting?",
        "What are the testing requirements?",
    ],
    "long": [
        "I need to implement user authentication with OAuth 2.0, support Google and GitHub providers, and integrate with the existing RBAC system. Can you provide documentation and code examples?",
        "What is the recommended architecture for a multi-tenant RAG system with document isolation, vector store partitioning, and tenant-specific embedding models?",
        "I'm experiencing performance issues with the vector search. The p95 latency is exceeding 500ms under load. What are the recommended optimization strategies, caching mechanisms, and infrastructure upgrades?",
        "How do I set up a complete CI/CD pipeline with automated testing, security scanning, dependency auditing, Docker containerization, and deployment to production with zero downtime?",
        "I need to implement comprehensive audit logging with WORM compliance, encryption at rest, tamper-proof storage, and retention policies. What are the architecture patterns and implementation guidelines?",
        "What are the best practices for implementing a high-availability RAG system with automatic failover, load balancing, distributed caching, and disaster recovery across multiple regions?",
        "I want to integrate multiple embedding models (OpenAI, local Sentence-Transformers, custom fine-tuned models) with a hybrid search strategy combining vector similarity and keyword matching. How should I architect this?",
        "How do I implement a secure credential management system with HSM integration, key rotation, AES-256-GCM encryption, Argon2id key derivation, and compliance with OWASP security standards?",
    ],
}


class RAGSearchUser(HttpUser):
    """
    Simulates users performing semantic search queries
    """

    # Wait 0.5-2 seconds between tasks (simulates realistic search behavior)
    wait_time = between(0.5, 2)

    @task(7)  # 70% short queries
    def search_short_query(self):
        """Perform short query search (most common)"""
        query = random.choice(QUERIES["short"])
        self._search(query, query_type="SHORT")

    @task(2)  # 20% medium queries
    def search_medium_query(self):
        """Perform medium query search"""
        query = random.choice(QUERIES["medium"])
        self._search(query, query_type="MEDIUM")

    @task(1)  # 10% long queries
    def search_long_query(self):
        """Perform long query search (most complex)"""
        query = random.choice(QUERIES["long"])
        self._search(query, query_type="LONG")

    def _search(self, query: str, query_type: str = "DEFAULT"):
        """
        Perform semantic search

        Args:
            query: Search query text
            query_type: Query type label for stats grouping
        """
        # Vary top_k (mostly use 5, occasionally 10 or 20)
        top_k = random.choices([5, 10, 20], weights=[0.7, 0.2, 0.1])[0]

        payload = {"query": query, "top_k": top_k}

        with self.client.post(
            "/search",
            json=payload,
            catch_response=True,
            name=f"/search [{query_type}]",  # Group by query type in stats
        ) as response:
            if response.status_code == 200:
                try:
                    data = response.json()
                    if "results" in data and len(data["results"]) > 0:
                        response.success()
                    else:
                        response.failure("Empty results")
                except Exception:
                    response.failure("Invalid JSON response")
            elif response.status_code == 429:
                # Rate limit hit (expected under high load)
                response.failure("Rate limit (429)")
            elif response.status_code == 404:
                # Endpoint not found (check backend configuration)
                response.failure("Endpoint not found (404)")
            elif response.status_code >= 500:
                # Server error
                response.failure(f"Server error ({response.status_code})")
            else:
                # Other errors
                response.failure(f"Failed ({response.status_code})")


class SearchBenchmarkUser(HttpUser):
    """
    Simplified user for pure search benchmarking
    Only performs searches, no other interactions
    """

    wait_time = between(0.1, 1)  # Faster for stress testing

    @task
    def search_random_query(self):
        """Perform random query search"""
        # Weighted random selection: 70% short, 20% medium, 10% long
        query_type = random.choices(["short", "medium", "long"], weights=[0.7, 0.2, 0.1])[0]
        query = random.choice(QUERIES[query_type])

        # Mostly use top_k=5 (typical use case)
        top_k = 5 if random.random() < 0.8 else random.choice([10, 20])

        self.client.post(
            "/search",
            json={"query": query, "top_k": top_k},
            name=f"/search [{query_type.upper()}]",
        )


class SearchLatencyBenchmark(HttpUser):
    """
    Focused latency measurement with minimal variability
    """

    wait_time = between(0, 0.5)  # Very fast for pure latency testing

    @task
    def search_standard_query(self):
        """Standard search with fixed top_k for consistent latency measurement"""
        query = random.choice(QUERIES["short"])
        self.client.post(
            "/search",
            json={"query": query, "top_k": 5},
            name="/search [LATENCY TEST]",
        )


# Configuration for headless mode (CLI)
if __name__ == "__main__":
    print("=" * 70)
    print("RAG PIPELINE SEARCH BENCHMARK (T-04-ST6)")
    print("=" * 70)
    print("\nStarting Locust load test for semantic search...")
    print("\nTest Configuration:")
    print("  - Host: http://localhost:8000")
    print("  - Users: Configure via CLI or Web UI")
    print("  - Duration: Configure via CLI or Web UI")
    print("\nQuery Types:")
    print("  - Short (70%): 'project requirements', 'API documentation', etc.")
    print("  - Medium (20%): 'How do I configure OAuth authentication?', etc.")
    print("  - Long (10%): Complex multi-part questions")
    print("\nWeb UI: http://localhost:8089")
    print("=" * 70)
    print("\nUsage:")
    print("  1. Start FastAPI backend: yarn be:dev")
    print("  2. Index some documents first: POST /upload (use locustfile_ingest.py)")
    print("  3. Run this script: locust -f backend/performance/locustfile_search.py")
    print("  4. Open http://localhost:8089 in browser")
    print("  5. Configure users and spawn rate")
    print("  6. Start test and monitor metrics")
    print("=" * 70)
    print("\nPERF-004 Target: p95 latency < 500ms")
    print("Expected Results (10 users): 250-350ms p95 latency ✅")
    print("Expected Results (50 users): 500-920ms p95 latency ⚠️")
    print("=" * 70)
