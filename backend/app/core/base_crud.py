"""
Base CRUD operations for shared database patterns across services
Eliminates duplication in service layer and provides consistent error handling
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional, Type, TypeVar, Generic
from datetime import datetime
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import select, func, and_, desc, asc
from sqlalchemy.sql import Select

from app.core.base_validators import BaseQueryValidator, BaseValidator

# Type variables for generic CRUD operations
ModelType = TypeVar("ModelType", bound=DeclarativeBase)
CreateSchemaType = TypeVar("CreateSchemaType")
UpdateSchemaType = TypeVar("UpdateSchemaType")


class BaseCRUDError(Exception):
    """Base exception for CRUD operations"""

    pass


class RecordNotFoundError(BaseCRUDError):
    """Raised when a record is not found"""

    pass


class ValidationError(BaseCRUDError):
    """Raised when validation fails"""

    pass


class PermissionError(BaseCRUDError):
    """Raised when user lacks permissions"""

    pass


class BaseQueryBuilder(BaseValidator):
    """
    Base class for building database queries with filtering and pagination
    Provides shared query building patterns
    """

    def __init__(self, model: Type[ModelType]):
        super().__init__()
        self.model = model
        self.query_validator = BaseQueryValidator()

    def build_base_query(self) -> Select:
        """Build base query for the model"""
        return select(self.model)

    def apply_filters(self, query: Select, filters: Dict[str, Any]) -> Select:
        """
        Apply filters to query

        Args:
            query: Base query
            filters: Dictionary of filters to apply

        Returns:
            Select: Query with filters applied
        """
        for field, value in filters.items():
            if value is not None and hasattr(self.model, field):
                column = getattr(self.model, field)

                # Handle different filter types
                if isinstance(value, str) and value.startswith("%") and value.endswith("%"):
                    # LIKE filter
                    query = query.where(column.like(value))
                elif isinstance(value, list):
                    # IN filter
                    query = query.where(column.in_(value))
                else:
                    # Equality filter
                    query = query.where(column == value)

        return query

    def apply_date_range_filter(
        self,
        query: Select,
        date_field: str,
        date_from: Optional[datetime],
        date_to: Optional[datetime],
    ) -> Select:
        """
        Apply date range filter to query

        Args:
            query: Base query
            date_field: Name of the date field
            date_from: Start date (inclusive)
            date_to: End date (inclusive)

        Returns:
            Select: Query with date filter applied
        """
        if not hasattr(self.model, date_field):
            self.add_error(f"Invalid date field: {date_field}")
            return query

        column = getattr(self.model, date_field)
        conditions = []

        if date_from:
            conditions.append(column >= date_from)

        if date_to:
            conditions.append(column <= date_to)

        if conditions:
            query = query.where(and_(*conditions))

        return query

    def apply_sorting(
        self, query: Select, sort_by: str, sort_order: str, allowed_fields: List[str]
    ) -> Select:
        """
        Apply sorting to query

        Args:
            query: Base query
            sort_by: Field to sort by
            sort_order: Sort direction (asc/desc)
            allowed_fields: List of allowed sort fields

        Returns:
            Select: Query with sorting applied
        """
        # Validate sort parameters
        sort_validation = self.query_validator.validate_sort_parameters(
            sort_by, sort_order, allowed_fields
        )

        if not sort_validation["valid"]:
            self.errors.extend(sort_validation["errors"])
            # Use default sorting if validation fails
            sort_by = allowed_fields[0] if allowed_fields else "id"
            sort_order = "desc"

        if hasattr(self.model, sort_by):
            column = getattr(self.model, sort_by)
            if sort_order == "asc":
                query = query.order_by(asc(column))
            else:
                query = query.order_by(desc(column))

        return query

    def apply_pagination(self, query: Select, page: int, page_size: int) -> Select:
        """
        Apply pagination to query

        Args:
            query: Base query
            page: Page number (1-based)
            page_size: Items per page

        Returns:
            Select: Query with pagination applied
        """
        # Validate pagination parameters
        pagination_validation = self.query_validator.validate_pagination(page, page_size)

        if not pagination_validation["valid"]:
            self.errors.extend(pagination_validation["errors"])
            # Use validated values
            page = pagination_validation["page"]
            page_size = pagination_validation["page_size"]

        offset = (page - 1) * page_size
        return query.offset(offset).limit(page_size)

    def build_count_query(self, base_query: Select) -> Select:
        """
        Build count query from base query

        Args:
            base_query: Base query to count

        Returns:
            Select: Count query
        """
        # Remove ordering and pagination from count query
        count_query = select(func.count()).select_from(base_query.alias())
        return count_query


class BaseCRUDService(Generic[ModelType], ABC):
    """
    Base CRUD service providing common database operations
    Eliminates duplication across service classes
    """

    def __init__(self, model: Type[ModelType], session_factory):
        self.model = model
        self.session_factory = session_factory
        self.query_builder = BaseQueryBuilder(model)

    @asynccontextmanager
    async def get_session(self):
        """Get database session with proper cleanup"""
        async with self.session_factory() as session:
            try:
                yield session
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()

    async def create(self, create_data: CreateSchemaType, **kwargs) -> ModelType:
        """
        Create a new record

        Args:
            create_data: Data for creating the record
            **kwargs: Additional fields to set

        Returns:
            ModelType: Created record

        Raises:
            ValidationError: If validation fails
        """
        async with self.get_session() as session:
            # Convert schema to dict if needed
            if hasattr(create_data, "dict"):
                data = create_data.dict(exclude_unset=True)
            else:
                data = create_data

            # Add any additional fields
            data.update(kwargs)

            # Validate data before creation
            await self._validate_create_data(data, session)

            # Create model instance
            db_obj = self.model(**data)

            session.add(db_obj)
            await session.commit()
            await session.refresh(db_obj)

            return db_obj

    async def get_by_id(self, record_id: str, **kwargs) -> Optional[ModelType]:
        """
        Get record by ID

        Args:
            record_id: ID of the record
            **kwargs: Additional filter conditions

        Returns:
            ModelType: Found record or None
        """
        async with self.get_session() as session:
            query = select(self.model).where(self.model.id == record_id)

            # Apply additional filters
            for field, value in kwargs.items():
                if hasattr(self.model, field):
                    query = query.where(getattr(self.model, field) == value)

            result = await session.execute(query)
            return result.scalar_one_or_none()

    async def get_by_id_or_404(self, record_id: str, **kwargs) -> ModelType:
        """
        Get record by ID or raise 404 error

        Args:
            record_id: ID of the record
            **kwargs: Additional filter conditions

        Returns:
            ModelType: Found record

        Raises:
            RecordNotFoundError: If record not found
        """
        record = await self.get_by_id(record_id, **kwargs)
        if not record:
            raise RecordNotFoundError(f"{self.model.__name__} with id {record_id} not found")
        return record

    async def get_many(
        self,
        filters: Optional[Dict[str, Any]] = None,
        page: int = 1,
        page_size: int = 50,
        sort_by: str = "id",
        sort_order: str = "desc",
        allowed_sort_fields: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Get multiple records with filtering and pagination

        Args:
            filters: Filter conditions
            page: Page number
            page_size: Items per page
            sort_by: Field to sort by
            sort_order: Sort direction
            allowed_sort_fields: List of allowed sort fields

        Returns:
            dict: Paginated results with metadata
        """
        async with self.get_session() as session:
            # Build base query
            query = self.query_builder.build_base_query()

            # Apply filters
            if filters:
                query = self.query_builder.apply_filters(query, filters)

            # Apply sorting
            allowed_fields = allowed_sort_fields or ["id", "created_at"]
            query = self.query_builder.apply_sorting(query, sort_by, sort_order, allowed_fields)

            # Get total count before pagination
            count_query = self.query_builder.build_count_query(query)
            total_count = await session.scalar(count_query)

            # Apply pagination
            query = self.query_builder.apply_pagination(query, page, page_size)

            # Execute query
            result = await session.execute(query)
            records = result.scalars().all()

            # Calculate pagination metadata
            total_pages = (total_count + page_size - 1) // page_size
            has_next = page < total_pages
            has_previous = page > 1

            return {
                "records": records,
                "total_count": total_count,
                "page": page,
                "page_size": page_size,
                "total_pages": total_pages,
                "has_next": has_next,
                "has_previous": has_previous,
                "errors": self.query_builder.errors,
            }

    async def update(self, record_id: str, update_data: UpdateSchemaType, **kwargs) -> ModelType:
        """
        Update a record

        Args:
            record_id: ID of the record to update
            update_data: Data for updating the record
            **kwargs: Additional conditions for finding the record

        Returns:
            ModelType: Updated record

        Raises:
            RecordNotFoundError: If record not found
            ValidationError: If validation fails
        """
        async with self.get_session() as session:
            # Find the record
            record = await self.get_by_id_or_404(record_id, **kwargs)

            # Convert schema to dict if needed
            if hasattr(update_data, "dict"):
                data = update_data.dict(exclude_unset=True)
            else:
                data = update_data

            # Validate update data
            await self._validate_update_data(record, data, session)

            # Update fields
            for field, value in data.items():
                if hasattr(record, field):
                    setattr(record, field, value)

            # Update timestamp if model has updated_at field
            if hasattr(record, "updated_at"):
                record.updated_at = datetime.utcnow()

            await session.commit()
            await session.refresh(record)

            return record

    async def delete(self, record_id: str, **kwargs) -> bool:
        """
        Delete a record

        Args:
            record_id: ID of the record to delete
            **kwargs: Additional conditions for finding the record

        Returns:
            bool: True if deleted successfully

        Raises:
            RecordNotFoundError: If record not found
        """
        async with self.get_session() as session:
            record = await self.get_by_id_or_404(record_id, **kwargs)

            # Validate deletion is allowed
            await self._validate_delete(record, session)

            await session.delete(record)
            await session.commit()

            return True

    async def get_statistics(self, filters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Get basic statistics for the model

        Args:
            filters: Optional filters to apply

        Returns:
            dict: Statistics data
        """
        async with self.get_session() as session:
            query = self.query_builder.build_base_query()

            if filters:
                query = self.query_builder.apply_filters(query, filters)

            # Get total count
            count_query = self.query_builder.build_count_query(query)
            total_count = await session.scalar(count_query)

            # Get basic statistics
            stats = {"total_count": total_count or 0, "model_name": self.model.__name__}

            # Add timestamp-based stats if model has created_at
            if hasattr(self.model, "created_at"):
                stats.update(await self._get_time_based_stats(session, query))

            return stats

    async def _get_time_based_stats(
        self, session: AsyncSession, base_query: Select
    ) -> Dict[str, int]:
        """Get time-based statistics"""
        now = datetime.utcnow()
        today = now.replace(hour=0, minute=0, second=0, microsecond=0)

        stats = {}

        # Count records created today
        today_query = base_query.where(self.model.created_at >= today)
        today_count = await session.scalar(self.query_builder.build_count_query(today_query))
        stats["created_today"] = today_count or 0

        return stats

    @abstractmethod
    async def _validate_create_data(self, data: Dict[str, Any], session: AsyncSession) -> None:
        """
        Validate data before creating record
        Override in subclasses for specific validation logic
        """
        pass

    @abstractmethod
    async def _validate_update_data(
        self, record: ModelType, data: Dict[str, Any], session: AsyncSession
    ) -> None:
        """
        Validate data before updating record
        Override in subclasses for specific validation logic
        """
        pass

    @abstractmethod
    async def _validate_delete(self, record: ModelType, session: AsyncSession) -> None:
        """
        Validate that record can be deleted
        Override in subclasses for specific validation logic
        """
        pass


class BaseReadOnlyCRUDService(BaseCRUDService[ModelType]):
    """
    Read-only CRUD service for models that should not be modified
    Useful for audit logs and other immutable data
    """

    async def create(self, create_data: CreateSchemaType, **kwargs) -> ModelType:
        """Create operation - allowed for read-only services"""
        return await super().create(create_data, **kwargs)

    async def update(self, record_id: str, update_data: UpdateSchemaType, **kwargs) -> ModelType:
        """Update operation - forbidden for read-only services"""
        raise PermissionError("Update operation not allowed on read-only service")

    async def delete(self, record_id: str, **kwargs) -> bool:
        """Delete operation - forbidden for read-only services"""
        raise PermissionError("Delete operation not allowed on read-only service")

    async def _validate_update_data(
        self, record: ModelType, data: Dict[str, Any], session: AsyncSession
    ) -> None:
        """Not applicable for read-only service"""
        pass

    async def _validate_delete(self, record: ModelType, session: AsyncSession) -> None:
        """Not applicable for read-only service"""
        pass
