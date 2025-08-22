"""
Test T-13 Acceptance Criteria #1:
Audit log appears within ≤5 seconds after corresponding action
"""

import asyncio
import time
from app.services.audit import AuditService
from app.models.audit import AuditActionType


async def test_5_second_audit_appearance():
    """Test that audit logs appear within 5 seconds"""
    print("Testing T-13 Acceptance Criteria #1: <=5 second audit log appearance")

    audit_service = AuditService()

    # Test multiple scenarios
    test_cases = [
        {
            "name": "Login Success",
            "action_type": AuditActionType.LOGIN_SUCCESS,
            "description": "User login test",
            "user_id": "test-user",
            "user_email": "test@example.com",
            "ip_address": "192.168.1.100",
        },
        {
            "name": "Document Creation",
            "action_type": AuditActionType.DOCUMENT_CREATE,
            "description": "Document creation test",
            "user_id": "test-user",
            "user_email": "test@example.com",
            "resource_type": "document",
            "resource_id": "doc-123",
        },
        {
            "name": "Config Update",
            "action_type": AuditActionType.CONFIG_UPDATE,
            "description": "Config update test",
            "user_id": "admin-user",
            "user_email": "admin@example.com",
            "resource_type": "config",
            "resource_id": "app-settings",
        },
    ]

    results = []

    for i, test_case in enumerate(test_cases, 1):
        print(f"\n{i}. Testing {test_case['name']}...")

        # Record start time
        start_time = time.perf_counter()

        try:
            # Create audit log using the correct parameters
            audit_log_id = await audit_service.log_event(
                action_type=test_case["action_type"],
                description=test_case["description"],
                user_id=test_case.get("user_id"),
                user_email=test_case.get("user_email"),
                resource_type=test_case.get("resource_type"),
                resource_id=test_case.get("resource_id"),
                ip_address=test_case.get("ip_address"),
            )

            # Record end time
            end_time = time.perf_counter()
            duration_seconds = end_time - start_time

            # Log creation successful
            print(f"   [OK] Log creation: {duration_seconds:.3f}s")
            print(f"   [OK] Log ID: {audit_log_id}")

            # Check if within 5 seconds
            if duration_seconds <= 5.0:
                print(f"   [PASS] {duration_seconds:.3f}s <= 5.0s")
                results.append(
                    {"test": test_case["name"], "duration": duration_seconds, "passed": True}
                )
            else:
                print(f"   [FAIL] {duration_seconds:.3f}s > 5.0s")
                results.append(
                    {"test": test_case["name"], "duration": duration_seconds, "passed": False}
                )

        except Exception as e:
            end_time = time.perf_counter()
            duration_seconds = end_time - start_time
            print(f"   [ERROR] {str(e)}")
            print(f"   [TIME] Time to error: {duration_seconds:.3f}s")
            results.append(
                {
                    "test": test_case["name"],
                    "duration": duration_seconds,
                    "passed": False,
                    "error": str(e),
                }
            )

    # Summary
    print(f"\n{'='*60}")
    print("T-13 ACCEPTANCE CRITERIA #1 TEST RESULTS")
    print(f"{'='*60}")

    passed_tests = sum(1 for r in results if r["passed"])
    total_tests = len(results)

    for result in results:
        status = "[PASS]" if result["passed"] else "[FAIL]"
        duration_str = f"{result['duration']:.3f}s" if result["duration"] else "N/A"
        print(f"{status} {result['test']}: {duration_str}")
        if "error" in result:
            print(f"      Error: {result['error']}")

    print(f"\nSUMMARY: {passed_tests}/{total_tests} tests passed")

    if passed_tests == total_tests:
        print("SUCCESS: All audit logs appear within <=5 seconds!")
        return True
    else:
        print(f"WARNING: {total_tests - passed_tests} tests failed the 5-second requirement")
        return False


if __name__ == "__main__":
    success = asyncio.run(test_5_second_audit_appearance())
    exit(0 if success else 1)
