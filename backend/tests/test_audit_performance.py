"""
Performance tests for audit system N+1 query optimization
T-13: Validates that the optimized audit statistics queries eliminate N+1 patterns
"""

import pytest
import asyncio
import time
from datetime import datetime, timedelta
from typing import Dict
from unittest.mock import patch

from app.services.audit import AuditService
from app.models.audit import AuditLog
from app.db.session import AsyncSessionLocal


class AuditPerformanceTestSuite:
    """
    Comprehensive performance test suite for audit system optimizations

    Tests both the legacy N+1 pattern and the optimized approach to validate
    performance improvements and functional equivalence.
    """

    def __init__(self):
        self.audit_service = AuditService()
        self.test_data_created = False

    async def create_test_data(self, session, record_count: int = 1000):
        """
        Create realistic test data for performance testing

        Args:
            session: Database session
            record_count: Number of audit log records to create
        """

        if self.test_data_created:
            return

        print(f"Creating {record_count} test audit log records...")

        # Create diverse test data
        test_records = []
        base_time = datetime.utcnow() - timedelta(days=30)

        action_types = [
            "login_success",
            "login_failure",
            "document_create",
            "document_update",
            "document_delete",
            "config_update",
            "unauthorized_access",
            "permission_denied",
        ]

        users = [f"user{i}@test.com" for i in range(1, 51)]  # 50 different users

        for i in range(record_count):
            # Distribute records across time periods
            days_offset = i % 30
            hours_offset = i % 24
            timestamp = base_time + timedelta(days=days_offset, hours=hours_offset)

            record = AuditLog(
                id=f"test-audit-{i:06d}",
                action_type=action_types[i % len(action_types)],
                resource_type="document" if i % 3 == 0 else "user",
                resource_id=f"resource-{i % 100}",
                user_id=f"user-{i % 50}",
                user_email=users[i % len(users)],
                user_role="admin" if i % 10 == 0 else "user",
                ip_address=f"192.168.1.{(i % 254) + 1}",
                user_agent="TestAgent/1.0",
                session_id=f"session-{i % 200}",
                description=f"Test audit event {i}",
                details=f'{{"test_id": {i}, "operation": "test"}}',
                status="success" if i % 4 != 0 else "failure",
                timestamp=timestamp,
                created_at=timestamp,
                record_hash=f"testhash{i:06d}",
            )
            test_records.append(record)

            # Batch insert for better performance
            if len(test_records) >= 100:
                session.add_all(test_records)
                test_records = []

        # Insert remaining records
        if test_records:
            session.add_all(test_records)

        await session.commit()
        self.test_data_created = True
        print(f"Test data creation completed: {record_count} records")

    async def cleanup_test_data(self, session):
        """Clean up test data"""
        await session.execute("DELETE FROM audit_logs WHERE id LIKE 'test-audit-%'")
        await session.commit()
        self.test_data_created = False

    async def benchmark_query_performance(
        self, query_func, iterations: int = 5
    ) -> Dict[str, float]:
        """
        Benchmark query performance with multiple iterations

        Args:
            query_func: Async function to benchmark
            iterations: Number of iterations to run

        Returns:
            dict: Performance metrics
        """

        execution_times = []

        for i in range(iterations):
            start_time = time.perf_counter()

            try:
                await query_func()
                end_time = time.perf_counter()
                execution_time = (end_time - start_time) * 1000  # Convert to milliseconds
                execution_times.append(execution_time)
                print(f"Iteration {i+1}: {execution_time:.2f}ms")

            except Exception as e:
                print(f"Iteration {i+1} failed: {e}")
                raise

        return {
            "average_ms": sum(execution_times) / len(execution_times),
            "min_ms": min(execution_times),
            "max_ms": max(execution_times),
            "total_ms": sum(execution_times),
            "iterations": iterations,
        }

    async def test_optimized_vs_legacy_performance(self):
        """
        Test performance comparison between optimized and legacy approaches
        """

        async with self.audit_service.get_session() as session:
            # Create test data
            await self.create_test_data(session, 2000)

            print("\n=== AUDIT STATISTICS PERFORMANCE COMPARISON ===")

            # Test optimized version
            print("\n1. Testing OPTIMIZED statistics method...")

            async def optimized_stats():
                return await self.audit_service.get_audit_stats("admin")

            optimized_metrics = await self.benchmark_query_performance(optimized_stats, 5)

            # Test legacy version
            print("\n2. Testing LEGACY statistics method...")

            async def legacy_stats():
                return await self.audit_service.get_audit_stats_legacy("admin")

            legacy_metrics = await self.benchmark_query_performance(legacy_stats, 5)

            # Calculate performance improvement
            improvement_ratio = legacy_metrics["average_ms"] / optimized_metrics["average_ms"]
            improvement_percentage = (
                (legacy_metrics["average_ms"] - optimized_metrics["average_ms"])
                / legacy_metrics["average_ms"]
            ) * 100

            print("\n=== PERFORMANCE RESULTS ===")
            print("Optimized Method:")
            print(f"  Average: {optimized_metrics['average_ms']:.2f}ms")
            print(f"  Min: {optimized_metrics['min_ms']:.2f}ms")
            print(f"  Max: {optimized_metrics['max_ms']:.2f}ms")

            print("\nLegacy Method:")
            print(f"  Average: {legacy_metrics['average_ms']:.2f}ms")
            print(f"  Min: {legacy_metrics['min_ms']:.2f}ms")
            print(f"  Max: {legacy_metrics['max_ms']:.2f}ms")

            print("\nPerformance Improvement:")
            print(f"  Speed increase: {improvement_ratio:.1f}x faster")
            print(f"  Time reduction: {improvement_percentage:.1f}%")

            # Cleanup
            await self.cleanup_test_data(session)

            return {
                "optimized": optimized_metrics,
                "legacy": legacy_metrics,
                "improvement_ratio": improvement_ratio,
                "improvement_percentage": improvement_percentage,
            }

    async def test_functional_equivalence(self):
        """
        Test that optimized and legacy methods return identical results
        """

        async with self.audit_service.get_session() as session:
            # Create test data
            await self.create_test_data(session, 500)

            print("\n=== FUNCTIONAL EQUIVALENCE TEST ===")

            # Get results from both methods
            optimized_result = await self.audit_service.get_audit_stats("admin")
            legacy_result = await self.audit_service.get_audit_stats_legacy("admin")

            # Compare results
            differences = []

            # Compare basic metrics
            basic_metrics = [
                "total_events",
                "events_today",
                "events_this_week",
                "events_this_month",
                "security_events",
                "failed_logins",
            ]

            for metric in basic_metrics:
                opt_value = getattr(optimized_result, metric)
                leg_value = getattr(legacy_result, metric)

                if opt_value != leg_value:
                    differences.append(f"{metric}: optimized={opt_value}, legacy={leg_value}")
                else:
                    print(f"✓ {metric}: {opt_value} (match)")

            # Compare top actions (order might differ, so convert to sets)
            opt_actions = {
                (item["action_type"], item["count"]) for item in optimized_result.top_actions
            }
            leg_actions = {
                (item["action_type"], item["count"]) for item in legacy_result.top_actions
            }

            if opt_actions == leg_actions:
                print(f"✓ top_actions: {len(optimized_result.top_actions)} items (match)")
            else:
                differences.append("top_actions differ")

            # Compare top users (order might differ, so convert to sets)
            opt_users = {(item["user_email"], item["count"]) for item in optimized_result.top_users}
            leg_users = {(item["user_email"], item["count"]) for item in legacy_result.top_users}

            if opt_users == leg_users:
                print(f"✓ top_users: {len(optimized_result.top_users)} items (match)")
            else:
                differences.append("top_users differ")

            # Report results
            if differences:
                print("\n❌ FUNCTIONAL EQUIVALENCE FAILED:")
                for diff in differences:
                    print(f"  - {diff}")
                return False
            else:
                print("\n✅ FUNCTIONAL EQUIVALENCE PASSED: All results match")
                return True

            # Cleanup
            await self.cleanup_test_data(session)

    async def test_query_efficiency(self):
        """
        Test query efficiency by counting database calls
        """

        print("\n=== QUERY EFFICIENCY ANALYSIS ===")

        # Mock session to count queries
        query_count = {"count": 0}

        original_execute = AsyncSessionLocal.execute
        original_scalar = AsyncSessionLocal.scalar

        async def mock_execute(*args, **kwargs):
            query_count["count"] += 1
            return await original_execute(*args, **kwargs)

        async def mock_scalar(*args, **kwargs):
            query_count["count"] += 1
            return await original_scalar(*args, **kwargs)

        with (
            patch.object(AsyncSessionLocal, "execute", mock_execute),
            patch.object(AsyncSessionLocal, "scalar", mock_scalar),
        ):

            async with self.audit_service.get_session() as session:
                await self.create_test_data(session, 100)

                # Test optimized method
                query_count["count"] = 0
                await self.audit_service.get_audit_stats("admin")
                optimized_queries = query_count["count"]

                # Test legacy method
                query_count["count"] = 0
                await self.audit_service.get_audit_stats_legacy("admin")
                legacy_queries = query_count["count"]

                print(f"Optimized method: {optimized_queries} database queries")
                print(f"Legacy method: {legacy_queries} database queries")
                print(f"Query reduction: {legacy_queries - optimized_queries} fewer queries")
                print(
                    f"Efficiency improvement: {(legacy_queries - optimized_queries) / legacy_queries * 100:.1f}%"
                )

                await self.cleanup_test_data(session)

                return {
                    "optimized_queries": optimized_queries,
                    "legacy_queries": legacy_queries,
                    "query_reduction": legacy_queries - optimized_queries,
                    "efficiency_improvement_percent": (legacy_queries - optimized_queries)
                    / legacy_queries
                    * 100,
                }


# Pytest integration
@pytest.mark.asyncio
async def test_audit_performance_optimization():
    """Pytest integration for audit performance tests"""

    test_suite = AuditPerformanceTestSuite()

    # Run performance comparison
    performance_results = await test_suite.test_optimized_vs_legacy_performance()

    # Verify performance improvement
    assert (
        performance_results["improvement_ratio"] > 1.5
    ), f"Performance improvement {performance_results['improvement_ratio']:.1f}x is less than expected 1.5x"

    # Run functional equivalence test
    equivalence_passed = await test_suite.test_functional_equivalence()
    assert equivalence_passed, "Optimized and legacy methods return different results"

    # Run query efficiency test
    efficiency_results = await test_suite.test_query_efficiency()
    assert (
        efficiency_results["query_reduction"] > 0
    ), f"Query count should be reduced, but got {efficiency_results['query_reduction']}"


if __name__ == "__main__":
    """Run performance tests directly"""

    async def main():
        test_suite = AuditPerformanceTestSuite()

        try:
            print("🚀 Starting Audit System Performance Tests...")

            # Run all tests
            await test_suite.test_optimized_vs_legacy_performance()
            await test_suite.test_functional_equivalence()
            await test_suite.test_query_efficiency()

            print("\n✅ All performance tests completed successfully!")

        except Exception as e:
            print(f"\n❌ Performance tests failed: {e}")
            raise

    # Run tests
    asyncio.run(main())
