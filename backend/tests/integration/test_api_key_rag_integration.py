"""
Integration tests for T-28: User API Keys with RAG Pipeline
Tests the integration between user-specific API keys (T-41) and RAG processing (T-04)
"""

import pytest
from unittest.mock import patch
from app.services.embedding_service import EmbeddingService
from app.services.rag_processing_service import RAGProcessingService


class TestEmbeddingServiceAPIKeyPriority:
    """Test that EmbeddingService correctly prioritizes API keys"""

    def test_user_api_key_priority(self):
        """Test that user API key takes priority over global key"""
        user_key = "sk-user123456789"

        with patch("app.services.embedding_service.settings") as mock_settings:
            mock_settings.OPENAI_API_KEY = "sk-global123456789"

            service = EmbeddingService(api_key=user_key)

            # Should use user key
            assert service.api_key == user_key
            assert service.user_api_key == user_key

    def test_global_api_key_fallback(self):
        """Test that global API key is used when no user key provided"""
        global_key = "sk-global123456789"

        with patch("app.services.embedding_service.settings") as mock_settings:
            mock_settings.OPENAI_API_KEY = global_key

            service = EmbeddingService(api_key=None)

            # Should use global key
            assert service.api_key == global_key
            assert service.user_api_key is None

    def test_no_api_key_available(self):
        """Test behavior when neither user nor global key is available"""
        with patch("app.services.embedding_service.settings") as mock_settings:
            mock_settings.OPENAI_API_KEY = None

            service = EmbeddingService(api_key=None)

            # Should have no API key
            assert service.api_key is None
            assert service.user_api_key is None
            assert not service.is_available()


class TestRAGProcessingServiceAPIKeyPropagation:
    """Test that RAG processing service correctly propagates API keys"""

    def test_rag_service_uses_user_api_key(self):
        """Test that RAG service passes user API key to embedding service"""
        user_key = "sk-user123456789"

        with patch("app.services.embedding_service.settings") as mock_settings:
            mock_settings.OPENAI_API_KEY = "sk-global123456789"

            rag_service = RAGProcessingService(api_key=user_key)

            # Verify embedding service got the user key
            assert rag_service.embedding_service.api_key == user_key
            assert rag_service.embedding_service.user_api_key == user_key

    def test_rag_service_uses_global_fallback(self):
        """Test that RAG service falls back to global key"""
        global_key = "sk-global123456789"

        with patch("app.services.embedding_service.settings") as mock_settings:
            mock_settings.OPENAI_API_KEY = global_key

            rag_service = RAGProcessingService(api_key=None)

            # Verify embedding service got the global key
            assert rag_service.embedding_service.api_key == global_key
            assert rag_service.embedding_service.user_api_key is None


class TestBackgroundTaskAPIKeyHandling:
    """Test background task API key handling"""

    def test_rag_service_check_for_missing_api_key(self):
        """Test that RAG service can detect missing API key"""
        with patch("app.services.embedding_service.settings") as mock_settings:
            # Configure no API key available
            mock_settings.OPENAI_API_KEY = None

            # Create RAG service without API key
            from app.services.rag_processing_service import RAGProcessingService

            rag_service = RAGProcessingService(api_key=None)

            # Verify embedding service correctly reports unavailability
            assert not rag_service.embedding_service.is_available()

    def test_rag_service_available_with_api_key(self):
        """Test that RAG service is available with valid API key"""
        # Create RAG service with API key
        from app.services.rag_processing_service import RAGProcessingService

        rag_service = RAGProcessingService(api_key="sk-test123456789")

        # Verify embedding service is available
        assert rag_service.embedding_service.is_available()


class TestAPIKeyLogging:
    """Test that API key logging is secure and informative"""

    def test_user_key_logging(self, caplog):
        """Test that user API key usage is logged without exposing the key"""
        import logging

        with caplog.at_level(logging.INFO):
            with patch("app.services.embedding_service.settings") as mock_settings:
                mock_settings.OPENAI_API_KEY = "sk-global123456789"

                _ = EmbeddingService(api_key="sk-user123456789")

                # Check that log message exists and doesn't contain the actual key
                assert any("user-specific API key" in record.message for record in caplog.records)
                assert not any("sk-user123456789" in record.message for record in caplog.records)

    def test_global_key_logging(self, caplog):
        """Test that global API key usage is logged"""
        import logging

        with caplog.at_level(logging.INFO):
            with patch("app.services.embedding_service.settings") as mock_settings:
                mock_settings.OPENAI_API_KEY = "sk-global123456789"

                _ = EmbeddingService(api_key=None)

                # Check that log message exists
                assert any("global API key" in record.message for record in caplog.records)
                assert not any("sk-global123456789" in record.message for record in caplog.records)

    def test_missing_key_logging(self, caplog):
        """Test that missing API key is logged with warning"""
        import logging

        with caplog.at_level(logging.WARNING):
            with patch("app.services.embedding_service.settings") as mock_settings:
                mock_settings.OPENAI_API_KEY = None

                _ = EmbeddingService(api_key=None)

                # Check that warning message exists
                assert any("without API key" in record.message for record in caplog.records)


class TestEndToEndAPIKeyFlow:
    """End-to-end tests for API key flow through the system"""

    @pytest.mark.asyncio
    async def test_user_key_flow_from_upload_to_embeddings(self):
        """Test complete flow: user uploads document with their API key"""
        # This would be a full integration test when API endpoints are properly wired
        # For now, test the service layer integration

        user_key = "sk-user-test-123456789"

        with patch("app.services.embedding_service.settings") as mock_settings:
            mock_settings.OPENAI_API_KEY = "sk-global-fallback-123456789"

            # Simulate what happens in upload endpoint
            rag_service = RAGProcessingService(api_key=user_key)

            # Verify the chain
            assert rag_service.embedding_service.api_key == user_key
            assert rag_service.embedding_service.is_available()

    @pytest.mark.asyncio
    async def test_global_key_flow_from_upload_to_embeddings(self):
        """Test complete flow: user without API key uses global key"""
        global_key = "sk-global-fallback-123456789"

        with patch("app.services.embedding_service.settings") as mock_settings:
            mock_settings.OPENAI_API_KEY = global_key

            # Simulate upload without user key
            rag_service = RAGProcessingService(api_key=None)

            # Verify the chain
            assert rag_service.embedding_service.api_key == global_key
            assert rag_service.embedding_service.is_available()


if __name__ == "__main__":
    # Run basic tests
    print("Running API Key + RAG Integration Tests...")

    # Test 1: API Key Priority
    test_priority = TestEmbeddingServiceAPIKeyPriority()
    test_priority.test_user_api_key_priority()
    test_priority.test_global_api_key_fallback()
    test_priority.test_no_api_key_available()
    print("✅ API Key priority tests passed")

    # Test 2: RAG Service Integration
    test_rag = TestRAGProcessingServiceAPIKeyPropagation()
    test_rag.test_rag_service_uses_user_api_key()
    test_rag.test_rag_service_uses_global_fallback()
    print("✅ RAG service integration tests passed")

    print("\n🎉 All integration tests passed!")
