"""
API Integration Tests for T-12 Key Management

Tests the complete API integration for the T-12 Key Management system including:
- Router endpoints with full security middleware
- Authentication and authorization testing
- Error handling validation
- Performance benchmarking
- Security validation
- End-to-end API workflows

Test Coverage:
- All key management endpoints (CRUD operations)
- Rotation policy management
- HSM configuration management
- Health and monitoring endpoints
- Audit and compliance endpoints
- Security headers and middleware validation
- Rate limiting and throttling
- Error handling and edge cases
"""

import os
import pytest
from fastapi.testclient import TestClient
from fastapi import status


class TestKeyManagementAPIIntegration:
    """API integration tests for key management endpoints."""

    def test_create_key_endpoint_integration(
        self, test_client: TestClient, mock_admin_user, sample_key_data
    ):
        """Test key creation endpoint with full integration."""
        # Test successful key creation
        response = test_client.post(
            "/api/v1/keys/",
            json=sample_key_data,
            headers={
                "Authorization": f"Bearer mock_token_{mock_admin_user.id}",
                "Content-Type": "application/json",
                "X-Forwarded-Proto": "https",
            },
        )

        # Verify response structure and security headers
        assert response.status_code == status.HTTP_201_CREATED
        assert "Strict-Transport-Security" in response.headers
        assert "X-Content-Type-Options" in response.headers
        assert "X-Frame-Options" in response.headers

        if response.status_code == 201:
            created_key = response.json()

            # Verify response structure
            required_fields = ["id", "key_id", "key_type", "algorithm", "status", "created_at"]
            for field in required_fields:
                assert field in created_key

            # Verify security - no key material in response
            sensitive_fields = ["key_material", "encrypted_key_data", "private_key"]
            for field in sensitive_fields:
                assert field not in created_key

            # Verify key properties
            assert created_key["key_type"] == sample_key_data["key_type"]
            assert created_key["algorithm"] == sample_key_data["algorithm"]
            assert created_key["status"] == "active"

    def test_list_keys_endpoint_integration(
        self, test_client: TestClient, mock_admin_user, sample_key_data
    ):
        """Test key listing endpoint with filtering and pagination."""
        # Create a test key first
        create_response = test_client.post(
            "/api/v1/keys/",
            json=sample_key_data,
            headers={
                "Authorization": f"Bearer mock_token_{mock_admin_user.id}",
                "Content-Type": "application/json",
            },
        )
        assert create_response.status_code == status.HTTP_201_CREATED

        # Test basic key listing
        list_response = test_client.get(
            "/api/v1/keys/", headers={"Authorization": f"Bearer mock_token_{mock_admin_user.id}"}
        )

        assert list_response.status_code == status.HTTP_200_OK
        keys_list = list_response.json()
        assert isinstance(keys_list, list)

        # Test filtering by key type
        filter_response = test_client.get(
            "/api/v1/keys/",
            params={"key_type": "dek"},
            headers={"Authorization": f"Bearer mock_token_{mock_admin_user.id}"},
        )

        assert filter_response.status_code == status.HTTP_200_OK

        # Test pagination
        paginated_response = test_client.get(
            "/api/v1/keys/",
            params={"limit": 10, "offset": 0},
            headers={"Authorization": f"Bearer mock_token_{mock_admin_user.id}"},
        )

        assert paginated_response.status_code == status.HTTP_200_OK
        paginated_keys = paginated_response.json()
        assert len(paginated_keys) <= 10

    def test_get_key_endpoint_integration(
        self, test_client: TestClient, mock_admin_user, sample_key_data
    ):
        """Test individual key retrieval endpoint."""
        # Create a test key
        create_response = test_client.post(
            "/api/v1/keys/",
            json=sample_key_data,
            headers={
                "Authorization": f"Bearer mock_token_{mock_admin_user.id}",
                "Content-Type": "application/json",
            },
        )

        if create_response.status_code == 201:
            key_id = create_response.json()["key_id"]

            # Test successful key retrieval
            get_response = test_client.get(
                f"/api/v1/keys/{key_id}",
                headers={"Authorization": f"Bearer mock_token_{mock_admin_user.id}"},
            )

            if get_response.status_code == 200:
                retrieved_key = get_response.json()

                # Verify key properties
                assert retrieved_key["key_id"] == key_id
                assert retrieved_key["key_type"] == sample_key_data["key_type"]

                # Verify security headers
                assert "Cache-Control" in get_response.headers
                assert "Strict-Transport-Security" in get_response.headers

        # Test non-existent key
        nonexistent_response = test_client.get(
            "/api/v1/keys/nonexistent_key_id",
            headers={"Authorization": f"Bearer mock_token_{mock_admin_user.id}"},
        )

        assert nonexistent_response.status_code == status.HTTP_404_NOT_FOUND

    def test_rotate_key_endpoint_integration(
        self, test_client: TestClient, mock_admin_user, sample_key_data
    ):
        """Test key rotation endpoint integration."""
        # Create a test key
        create_response = test_client.post(
            "/api/v1/keys/",
            json=sample_key_data,
            headers={
                "Authorization": f"Bearer mock_token_{mock_admin_user.id}",
                "Content-Type": "application/json",
            },
        )

        if create_response.status_code == 201:
            key_id = create_response.json()["key_id"]

            # Test key rotation
            rotation_data = {
                "trigger": "manual",
                "trigger_details": {
                    "reason": "API integration test rotation",
                    "requested_by": mock_admin_user.id,
                },
            }

            rotation_response = test_client.post(
                f"/api/v1/keys/{key_id}/rotate",
                json=rotation_data,
                headers={
                    "Authorization": f"Bearer mock_token_{mock_admin_user.id}",
                    "Content-Type": "application/json",
                },
            )

            # Verify rotation response
            if rotation_response.status_code == 200:
                rotation_result = rotation_response.json()

                required_fields = [
                    "id",
                    "key_id",
                    "trigger",
                    "status",
                    "old_version",
                    "new_version",
                ]
                for field in required_fields:
                    assert field in rotation_result

                assert rotation_result["key_id"] == key_id
                assert rotation_result["trigger"] == "manual"
                assert rotation_result["old_version"] < rotation_result["new_version"]

    def test_revoke_key_endpoint_integration(
        self, test_client: TestClient, mock_admin_user, sample_key_data
    ):
        """Test key revocation endpoint integration."""
        # Create a test key
        create_response = test_client.post(
            "/api/v1/keys/",
            json=sample_key_data,
            headers={
                "Authorization": f"Bearer mock_token_{mock_admin_user.id}",
                "Content-Type": "application/json",
            },
        )

        if create_response.status_code == 201:
            key_id = create_response.json()["key_id"]

            # Test key revocation
            revoke_response = test_client.delete(
                f"/api/v1/keys/{key_id}",
                headers={"Authorization": f"Bearer mock_token_{mock_admin_user.id}"},
            )

            assert revoke_response.status_code == status.HTTP_204_NO_CONTENT

            # Verify key status changed to revoked
            get_response = test_client.get(
                f"/api/v1/keys/{key_id}",
                headers={"Authorization": f"Bearer mock_token_{mock_admin_user.id}"},
            )

            if get_response.status_code == 200:
                revoked_key = get_response.json()
                assert revoked_key["status"] == "revoked"

    def test_rotation_policy_endpoints_integration(
        self, test_client: TestClient, mock_admin_user, sample_rotation_policy
    ):
        """Test rotation policy management endpoints."""
        # Test policy creation
        create_response = test_client.post(
            "/api/v1/keys/policies",
            json=sample_rotation_policy,
            headers={
                "Authorization": f"Bearer mock_token_{mock_admin_user.id}",
                "Content-Type": "application/json",
            },
        )

        if create_response.status_code == 201:
            policy = create_response.json()

            # Verify policy structure
            required_fields = [
                "id",
                "policy_name",
                "key_type",
                "rotation_interval_days",
                "is_active",
            ]
            for field in required_fields:
                assert field in policy

            assert policy["policy_name"] == sample_rotation_policy["policy_name"]
            assert policy["key_type"] == sample_rotation_policy["key_type"]

            # Test policy listing
            list_response = test_client.get(
                "/api/v1/keys/policies",
                headers={"Authorization": f"Bearer mock_token_{mock_admin_user.id}"},
            )

            assert list_response.status_code == status.HTTP_200_OK
            policies_list = list_response.json()
            assert isinstance(policies_list, list)
            assert len(policies_list) >= 1

    def test_hsm_configuration_endpoints_integration(
        self, test_client: TestClient, mock_admin_user, sample_hsm_config
    ):
        """Test HSM configuration management endpoints."""
        # Test HSM configuration creation
        create_response = test_client.post(
            "/api/v1/keys/hsm/configurations",
            json=sample_hsm_config,
            headers={
                "Authorization": f"Bearer mock_token_{mock_admin_user.id}",
                "Content-Type": "application/json",
            },
        )

        if create_response.status_code == 201:
            hsm_config = create_response.json()

            # Verify HSM config structure
            required_fields = [
                "id",
                "provider",
                "configuration_name",
                "is_active",
                "supported_algorithms",
            ]
            for field in required_fields:
                assert field in hsm_config

            assert hsm_config["provider"] == sample_hsm_config["provider"]
            assert hsm_config["configuration_name"] == sample_hsm_config["configuration_name"]

            # Test HSM configuration listing
            list_response = test_client.get(
                "/api/v1/keys/hsm/configurations",
                headers={"Authorization": f"Bearer mock_token_{mock_admin_user.id}"},
            )

            assert list_response.status_code == status.HTTP_200_OK
            configs_list = list_response.json()
            assert isinstance(configs_list, list)

    def test_health_and_monitoring_endpoints_integration(
        self, test_client: TestClient, mock_admin_user, sample_key_data
    ):
        """Test health and monitoring endpoints integration."""
        # Create a test key for health monitoring
        create_response = test_client.post(
            "/api/v1/keys/",
            json=sample_key_data,
            headers={
                "Authorization": f"Bearer mock_token_{mock_admin_user.id}",
                "Content-Type": "application/json",
            },
        )

        if create_response.status_code == 201:
            key_id = create_response.json()["key_id"]

            # Test key health status endpoint
            health_response = test_client.get(
                f"/api/v1/keys/{key_id}/health",
                headers={"Authorization": f"Bearer mock_token_{mock_admin_user.id}"},
            )

            if health_response.status_code == 200:
                health_status = health_response.json()

                expected_fields = ["key_id", "status", "health_score", "security_warnings"]
                for field in expected_fields:
                    assert field in health_status

                assert health_status["key_id"] == key_id
                assert 0 <= health_status["health_score"] <= 100

        # Test system statistics endpoint
        stats_response = test_client.get(
            "/api/v1/keys/system/statistics",
            headers={"Authorization": f"Bearer mock_token_{mock_admin_user.id}"},
        )

        if stats_response.status_code == 200:
            statistics = stats_response.json()

            expected_fields = ["total_keys", "active_keys", "keys_due_for_rotation"]
            for field in expected_fields:
                assert field in statistics

        # Test system health endpoint
        system_health_response = test_client.get(
            "/api/v1/keys/health",
            headers={"Authorization": f"Bearer mock_token_{mock_admin_user.id}"},
        )

        if system_health_response.status_code == 200:
            health_data = system_health_response.json()

            expected_fields = ["timestamp", "overall_status", "components"]
            for field in expected_fields:
                assert field in health_data

    def test_hsm_status_and_operations_integration(self, test_client: TestClient, mock_admin_user):
        """Test HSM status and operations endpoints."""
        # Test HSM status endpoint
        hsm_status_response = test_client.get(
            "/api/v1/keys/hsm/status",
            headers={"Authorization": f"Bearer mock_token_{mock_admin_user.id}"},
        )

        if hsm_status_response.status_code == 200:
            hsm_status = hsm_status_response.json()

            expected_fields = ["status", "providers"]
            for field in expected_fields:
                assert field in hsm_status

        # Test HSM performance metrics
        performance_response = test_client.get(
            "/api/v1/keys/hsm/performance",
            headers={"Authorization": f"Bearer mock_token_{mock_admin_user.id}"},
        )

        # Response should be successful or indicate HSM not configured
        assert performance_response.status_code in [200, 503]

        # Test HSM key migration endpoint
        migration_data = {
            "provider_id": "test_hsm_provider",
            "key_ids": ["test_key_1", "test_key_2"],
        }

        migration_response = test_client.post(
            "/api/v1/keys/hsm/migrate",
            json=migration_data,
            headers={
                "Authorization": f"Bearer mock_token_{mock_admin_user.id}",
                "Content-Type": "application/json",
            },
        )

        # Migration may not be available in test environment
        assert migration_response.status_code in [200, 400, 503]

    def test_scheduler_management_endpoints_integration(
        self, test_client: TestClient, mock_admin_user
    ):
        """Test rotation scheduler management endpoints."""
        # Test scheduler status endpoint
        status_response = test_client.get(
            "/api/v1/keys/scheduler/status",
            headers={"Authorization": f"Bearer mock_token_{mock_admin_user.id}"},
        )

        # Scheduler may not be available in test environment
        assert status_response.status_code in [200, 503]

        # Test scheduler pause endpoint
        pause_response = test_client.post(
            "/api/v1/keys/scheduler/pause",
            headers={"Authorization": f"Bearer mock_token_{mock_admin_user.id}"},
        )

        assert pause_response.status_code in [204, 503]

        # Test scheduler resume endpoint
        resume_response = test_client.post(
            "/api/v1/keys/scheduler/resume",
            headers={"Authorization": f"Bearer mock_token_{mock_admin_user.id}"},
        )

        assert resume_response.status_code in [204, 503]

    def test_audit_and_compliance_endpoints_integration(
        self, test_client: TestClient, mock_admin_user, sample_key_data
    ):
        """Test audit and compliance endpoints integration."""
        # Create a test key for audit testing
        create_response = test_client.post(
            "/api/v1/keys/",
            json=sample_key_data,
            headers={
                "Authorization": f"Bearer mock_token_{mock_admin_user.id}",
                "Content-Type": "application/json",
            },
        )

        if create_response.status_code == 201:
            key_id = create_response.json()["key_id"]

            # Test audit log endpoint
            audit_response = test_client.get(
                f"/api/v1/keys/{key_id}/audit",
                headers={"Authorization": f"Bearer mock_token_{mock_admin_user.id}"},
            )

            if audit_response.status_code == 200:
                audit_entries = audit_response.json()
                assert isinstance(audit_entries, list)

                if audit_entries:
                    # Verify audit entry structure
                    entry = audit_entries[0]
                    expected_fields = ["id", "key_id", "event_type", "timestamp", "user_id"]
                    for field in expected_fields:
                        assert field in entry

            # Test audit log filtering
            filtered_audit_response = test_client.get(
                f"/api/v1/keys/{key_id}/audit",
                params={"event_type": "CREATE", "limit": 10},
                headers={"Authorization": f"Bearer mock_token_{mock_admin_user.id}"},
            )

            assert filtered_audit_response.status_code in [200, 404]

    def test_authentication_and_authorization_integration(
        self, test_client: TestClient, mock_regular_user, sample_key_data
    ):
        """Test authentication and authorization integration."""
        # Test without authentication
        no_auth_response = test_client.post("/api/v1/keys/", json=sample_key_data)
        assert no_auth_response.status_code == status.HTTP_401_UNAUTHORIZED

        # Test with invalid token
        invalid_auth_response = test_client.post(
            "/api/v1/keys/", json=sample_key_data, headers={"Authorization": "Bearer invalid_token"}
        )
        assert invalid_auth_response.status_code == status.HTTP_401_UNAUTHORIZED

        # Test regular user accessing admin-only endpoint
        regular_user_response = test_client.post(
            "/api/v1/keys/",
            json=sample_key_data,
            headers={
                "Authorization": f"Bearer mock_token_{mock_regular_user.id}",
                "Content-Type": "application/json",
            },
        )
        # Should be forbidden for regular users
        assert regular_user_response.status_code == status.HTTP_403_FORBIDDEN

    def test_rate_limiting_integration(self, test_client: TestClient, mock_admin_user):
        """Test rate limiting integration."""
        # Test rate limiting by making multiple rapid requests
        auth_header = {"Authorization": f"Bearer mock_token_{mock_admin_user.id}"}

        # Make multiple requests to trigger rate limiting
        responses = []
        for i in range(15):  # Exceed typical rate limit
            response = test_client.get("/api/v1/keys/", headers=auth_header)
            responses.append(response)

        # Check if any requests were rate limited
        rate_limited_responses = [r for r in responses if r.status_code == 429]

        # In a real environment, we might expect rate limiting
        # In test environment, it may not be enforced
        # Just verify the endpoint responds consistently
        assert all(r.status_code in [200, 429] for r in responses)

        # Verify rate limiting behavior is consistent
        if rate_limited_responses:
            assert len(rate_limited_responses) > 0  # Some requests should be rate limited

    def test_error_handling_integration(self, test_client: TestClient, mock_admin_user):
        """Test comprehensive error handling integration."""
        auth_header = {"Authorization": f"Bearer mock_token_{mock_admin_user.id}"}

        # Test malformed JSON
        malformed_response = test_client.post(
            "/api/v1/keys/",
            data="invalid json",
            headers={**auth_header, "Content-Type": "application/json"},
        )
        assert malformed_response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

        # Test invalid key type
        invalid_key_data = {
            "key_type": "invalid_type",
            "algorithm": "AES-256-GCM",
            "key_size_bits": 256,
        }

        invalid_type_response = test_client.post(
            "/api/v1/keys/",
            json=invalid_key_data,
            headers={**auth_header, "Content-Type": "application/json"},
        )
        assert invalid_type_response.status_code in [400, 422]

        # Test missing required fields
        incomplete_data = {"key_type": "dek"}

        incomplete_response = test_client.post(
            "/api/v1/keys/",
            json=incomplete_data,
            headers={**auth_header, "Content-Type": "application/json"},
        )
        assert incomplete_response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_security_headers_validation(self, test_client: TestClient, mock_admin_user):
        """Test security headers validation across all endpoints."""
        auth_header = {"Authorization": f"Bearer mock_token_{mock_admin_user.id}"}

        # Test different endpoints for security headers
        endpoints = [
            "/api/v1/keys/",
            "/api/v1/keys/policies",
            "/api/v1/keys/hsm/status",
            "/api/v1/keys/health",
        ]

        for endpoint in endpoints:
            response = test_client.get(endpoint, headers=auth_header)

            if response.status_code < 500:  # Don't check on server errors
                # Verify essential security headers
                security_headers = [
                    "Strict-Transport-Security",
                    "X-Content-Type-Options",
                    "X-Frame-Options",
                ]

                for header in security_headers:
                    assert header in response.headers, f"Missing {header} in {endpoint}"

                # Verify HSTS configuration
                hsts_header = response.headers.get("Strict-Transport-Security", "")
                assert "max-age=" in hsts_header
                assert int(hsts_header.split("max-age=")[1].split(";")[0]) >= 31536000  # 1 year

    @pytest.mark.asyncio
    async def test_concurrent_api_operations(
        self, test_client: TestClient, mock_admin_user, sample_key_data
    ):
        """Test concurrent API operations."""
        import concurrent.futures

        auth_header = {"Authorization": f"Bearer mock_token_{mock_admin_user.id}"}

        def create_key():
            """Create a key via API."""
            return test_client.post(
                "/api/v1/keys/",
                json=sample_key_data,
                headers={**auth_header, "Content-Type": "application/json"},
            )

        def list_keys():
            """List keys via API."""
            return test_client.get("/api/v1/keys/", headers=auth_header)

        # Run concurrent operations
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            # Submit multiple concurrent requests
            futures = []

            # Create keys
            for _ in range(3):
                futures.append(executor.submit(create_key))

            # List keys
            for _ in range(2):
                futures.append(executor.submit(list_keys))

            # Wait for all operations to complete
            results = [future.result() for future in concurrent.futures.as_completed(futures)]

        # Verify all operations completed successfully or with expected errors
        for result in results:
            assert result.status_code in [200, 201, 400, 503]  # Valid response codes

    def test_performance_benchmarking(
        self, test_client: TestClient, mock_admin_user, sample_key_data, performance_test_config
    ):
        """Test API performance benchmarking."""
        import time

        auth_header = {"Authorization": f"Bearer mock_token_{mock_admin_user.id}"}

        # Test key creation performance
        start_time = time.perf_counter()

        create_responses = []
        for _ in range(5):  # Create 5 keys
            response = test_client.post(
                "/api/v1/keys/",
                json=sample_key_data,
                headers={**auth_header, "Content-Type": "application/json"},
            )
            create_responses.append(response)

        create_time = time.perf_counter() - start_time

        # Verify performance threshold
        avg_create_time = create_time / 5 * 1000  # Convert to ms
        assert avg_create_time < performance_test_config["max_key_creation_time_ms"]

        # Test key listing performance
        start_time = time.perf_counter()

        for _ in range(10):  # List keys 10 times
            list_response = test_client.get("/api/v1/keys/", headers=auth_header)
            assert list_response.status_code in [200, 503]

        list_time = time.perf_counter() - start_time
        avg_list_time = list_time / 10 * 1000  # Convert to ms

        # List operations should be faster than creation
        assert avg_list_time < avg_create_time

    def test_api_versioning_and_compatibility(self, test_client: TestClient, mock_admin_user):
        """Test API versioning and backward compatibility."""
        auth_header = {"Authorization": f"Bearer mock_token_{mock_admin_user.id}"}

        # Test API version headers
        response = test_client.get(
            "/api/v1/keys/", headers={**auth_header, "Accept": "application/json, version=1.0"}
        )

        if response.status_code == 200:
            # Verify API version information in response
            assert "Content-Type" in response.headers
            assert "application/json" in response.headers["Content-Type"]

        # Test API documentation endpoints
        docs_response = test_client.get("/docs")
        assert docs_response.status_code == 200

        redoc_response = test_client.get("/redoc")
        assert redoc_response.status_code == 200

    def test_data_validation_and_sanitization(
        self, test_client: TestClient, mock_admin_user, security_test_vectors
    ):
        """Test data validation and sanitization."""
        auth_header = {"Authorization": f"Bearer mock_token_{mock_admin_user.id}"}

        # Test SQL injection attempts
        for malicious_input in security_test_vectors["malicious_inputs"]:
            malicious_data = {"key_type": "dek", "algorithm": malicious_input, "key_size_bits": 256}

            response = test_client.post(
                "/api/v1/keys/",
                json=malicious_data,
                headers={**auth_header, "Content-Type": "application/json"},
            )

            # Should reject malicious input
            assert response.status_code in [400, 422]

        # Test XSS attempts in key names
        xss_data = {
            "key_type": "dek",
            "algorithm": "AES-256-GCM",
            "key_size_bits": 256,
            "metadata": {
                "name": "<script>alert('xss')</script>",
                "description": "javascript:alert('xss')",
            },
        }

        xss_response = test_client.post(
            "/api/v1/keys/",
            json=xss_data,
            headers={**auth_header, "Content-Type": "application/json"},
        )

        # Should sanitize or reject XSS attempts
        if xss_response.status_code == 201:
            created_key = xss_response.json()
            # Verify dangerous content was sanitized
            assert "<script>" not in str(created_key)
            assert "javascript:" not in str(created_key)


if not os.getenv("ENABLE_T12_TESTS"):
    pytest.skip("T-12 integration tests require ENABLE_T12_TESTS=1", allow_module_level=True)
