"""
Unit tests for quota validation (T-03 ST2).

Tests the document/storage quota enforcement in DocumentService.
"""

import pytest
from unittest.mock import AsyncMock, Mock, patch
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.document_service import DocumentService
from app.services.config import ConfigService


@pytest.mark.asyncio
async def test_quota_validation_within_limits():
    """Test that quota check passes when user is within limits."""
    # Arrange
    mock_db = AsyncMock(spec=AsyncSession)
    mock_config_service = AsyncMock(spec=ConfigService)

    # Mock config values
    mock_config_service.get_config = AsyncMock(side_effect=lambda db, key: {
        "max_documents_per_user": "100",
        "max_mb_per_user": "1000.0"
    }.get(key))

    # Mock database queries
    mock_result_count = Mock()
    mock_result_count.scalar = Mock(return_value=50)  # 50 documents (under 100)

    mock_result_size = Mock()
    mock_result_size.scalar = Mock(return_value=500 * 1024 * 1024)  # 500 MB (under 1000)

    mock_db.execute = AsyncMock(side_effect=[mock_result_count, mock_result_size])

    document_service = DocumentService(config_service=mock_config_service)

    # Act
    is_within_quota, error_msg = await document_service.check_user_quota(
        db=mock_db,
        user_id="test-user-uuid",
        additional_file_size=10 * 1024 * 1024  # 10 MB upload
    )

    # Assert
    assert is_within_quota is True
    assert error_msg == ""


@pytest.mark.asyncio
async def test_quota_validation_documents_exceeded():
    """Test that quota check fails when document count exceeds limit."""
    # Arrange
    mock_db = AsyncMock(spec=AsyncSession)
    mock_config_service = AsyncMock(spec=ConfigService)

    # Mock config values
    mock_config_service.get_config = AsyncMock(side_effect=lambda db, key: {
        "max_documents_per_user": "100",
        "max_mb_per_user": "1000.0"
    }.get(key))

    # Mock database queries
    mock_result_count = Mock()
    mock_result_count.scalar = Mock(return_value=101)  # 101 documents (OVER 100)

    mock_result_size = Mock()
    mock_result_size.scalar = Mock(return_value=500 * 1024 * 1024)  # 500 MB

    mock_db.execute = AsyncMock(side_effect=[mock_result_count, mock_result_size])

    document_service = DocumentService(config_service=mock_config_service)

    # Act
    is_within_quota, error_msg = await document_service.check_user_quota(
        db=mock_db,
        user_id="test-user-uuid",
        additional_file_size=1024  # 1 KB upload
    )

    # Assert
    assert is_within_quota is False
    assert "Document quota exceeded" in error_msg
    assert "101/100" in error_msg


@pytest.mark.asyncio
async def test_quota_validation_storage_exceeded():
    """Test that quota check fails when storage size exceeds limit."""
    # Arrange
    mock_db = AsyncMock(spec=AsyncSession)
    mock_config_service = AsyncMock(spec=ConfigService)

    # Mock config values
    mock_config_service.get_config = AsyncMock(side_effect=lambda db, key: {
        "max_documents_per_user": "100",
        "max_mb_per_user": "1000.0"
    }.get(key))

    # Mock database queries
    mock_result_count = Mock()
    mock_result_count.scalar = Mock(return_value=50)  # 50 documents (under limit)

    mock_result_size = Mock()
    mock_result_size.scalar = Mock(return_value=990 * 1024 * 1024)  # 990 MB

    mock_db.execute = AsyncMock(side_effect=[mock_result_count, mock_result_size])

    document_service = DocumentService(config_service=mock_config_service)

    # Act
    is_within_quota, error_msg = await document_service.check_user_quota(
        db=mock_db,
        user_id="test-user-uuid",
        additional_file_size=20 * 1024 * 1024  # 20 MB upload (would exceed 1000 MB)
    )

    # Assert
    assert is_within_quota is False
    assert "Storage quota exceeded" in error_msg
    assert "MB" in error_msg


@pytest.mark.asyncio
async def test_quota_validation_no_config_service():
    """Test that quota check passes gracefully when no config service available."""
    # Arrange
    mock_db = AsyncMock(spec=AsyncSession)
    document_service = DocumentService(config_service=None)  # No config service

    # Act
    is_within_quota, error_msg = await document_service.check_user_quota(
        db=mock_db,
        user_id="test-user-uuid",
        additional_file_size=10 * 1024 * 1024
    )

    # Assert
    assert is_within_quota is True  # Graceful degradation
    assert error_msg == ""


@pytest.mark.asyncio
async def test_quota_validation_edge_case_exact_limit():
    """Test quota check at exact limit boundary."""
    # Arrange
    mock_db = AsyncMock(spec=AsyncSession)
    mock_config_service = AsyncMock(spec=ConfigService)

    # Mock config values
    mock_config_service.get_config = AsyncMock(side_effect=lambda db, key: {
        "max_documents_per_user": "100",
        "max_mb_per_user": "1000.0"
    }.get(key))

    # Mock database queries
    mock_result_count = Mock()
    mock_result_count.scalar = Mock(return_value=100)  # Exactly 100 documents

    mock_result_size = Mock()
    mock_result_size.scalar = Mock(return_value=1000 * 1024 * 1024)  # Exactly 1000 MB

    mock_db.execute = AsyncMock(side_effect=[mock_result_count, mock_result_size])

    document_service = DocumentService(config_service=mock_config_service)

    # Act
    is_within_quota, error_msg = await document_service.check_user_quota(
        db=mock_db,
        user_id="test-user-uuid",
        additional_file_size=1024  # Try to add 1 KB
    )

    # Assert
    assert is_within_quota is False  # At limit, cannot add more
    assert "Document quota exceeded" in error_msg
