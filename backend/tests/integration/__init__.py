"""
Integration Tests for T-12 Key Management System

This package contains comprehensive integration tests for the T-12 Credential Store
Security implementation, testing the interaction between different components
across Week 1 (AES-GCM), Week 2 (TLS 1.3), and Week 3 (Key Management).

Test Categories:
- Week 1 + Week 3: AES-GCM encryption integration with Key Management
- Week 2 + Week 3: TLS 1.3 transport security with Key Management
- Complete Integration: End-to-end testing across all three weeks
- API Integration: Router endpoints with full security stack
- Performance: Cross-component performance and stress testing

Test Structure:
- test_week1_week3_integration.py: AES-GCM + KeyManager
- test_week2_week3_integration.py: TLS + KeyManager
- test_complete_t12_integration.py: Full Week 1-2-3 integration
- test_key_management_api_integration.py: API endpoints with security
- test_performance_integration.py: Performance testing
- test_stress_integration.py: Load and stress testing
"""
