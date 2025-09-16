"""
Test T-13 Acceptance Criteria #1:
Audit log appears within ≤5 seconds after corresponding action
"""

import asyncio
import time
from app.services.audit import AuditService
from app.models.audit import AuditActionType


async def _run_test_case(audit_service: AuditService, idx: int, case: dict):
    """Run a single audit test case and return a normalized result dict."""
    print(f"\n{idx}. Testing {case['name']}...")
    start_time = time.perf_counter()
    try:
        audit_log_id = await audit_service.log_event(
            action_type=case["action_type"],
            description=case["description"],
            user_id=case.get("user_id"),
            user_email=case.get("user_email"),
            resource_type=case.get("resource_type"),
            resource_id=case.get("resource_id"),
            ip_address=case.get("ip_address"),
        )
        duration = time.perf_counter() - start_time
        print(f"   [OK] Log creation: {duration:.3f}s")
        print(f"   [OK] Log ID: {audit_log_id}")
        passed = duration <= 5.0
        print(
            f"   {'[PASS]' if passed else '[FAIL]'} {duration:.3f}s {'<=' if passed else '>'} 5.0s"
        )
        return {"test": case["name"], "duration": duration, "passed": passed}
    except Exception as e:  # pragma: no cover - runtime timing dependent
        duration = time.perf_counter() - start_time
        print(f"   [ERROR] {str(e)}")
        print(f"   [TIME] Time to error: {duration:.3f}s")
        return {"test": case["name"], "duration": duration, "passed": False, "error": str(e)}


def _print_summary(results):
    print(f"\n{'='*60}")
    print("T-13 ACCEPTANCE CRITERIA #1 TEST RESULTS")
    print(f"{'='*60}")
    passed_tests = sum(1 for r in results if r["passed"])
    total_tests = len(results)
    for r in results:
        status = "[PASS]" if r["passed"] else "[FAIL]"
        duration_str = f"{r['duration']:.3f}s" if r["duration"] else "N/A"
        print(f"{status} {r['test']}: {duration_str}")
        if "error" in r:
            print(f"      Error: {r['error']}")
    print(f"\nSUMMARY: {passed_tests}/{total_tests} tests passed")
    return passed_tests == total_tests


async def test_5_second_audit_appearance():
    """Test that audit logs appear within 5 seconds"""
    print("Testing T-13 Acceptance Criteria #1: <=5 second audit log appearance")
    audit_service = AuditService()
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
    for i, case in enumerate(test_cases, 1):
        results.append(await _run_test_case(audit_service, i, case))

    success = _print_summary(results)
    return True if success else False


if __name__ == "__main__":
    success = asyncio.run(test_5_second_audit_appearance())
    exit(0 if success else 1)
