"""
Query building utilities for audit service
T-13: SQL query construction and filtering for audit log retrieval
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy import select, func, and_, desc, asc, case
from sqlalchemy.sql import Select

from app.models.audit import AuditLog, AuditLogSummary
from app.models.audit_schemas import AuditLogQueryFilters


class AuditQueryBuilder:
    """
    Utility class for building SQL queries for audit log operations

    Handles complex query construction with filtering, pagination, and statistics.
    """

    @staticmethod
    def build_logs_query(filters: AuditLogQueryFilters) -> Select[tuple]:
        """
        Build query for retrieving audit logs with filters

        Args:
            filters: Query filters and pagination parameters

        Returns:
            Select: SQLAlchemy select query
        """
        # Build base query
        query = select(AuditLog)

        # Apply filters
        conditions = AuditQueryBuilder._build_filter_conditions(filters)
        if conditions:
            query = query.where(and_(*conditions))

        # Apply sorting
        sort_column = getattr(AuditLog, filters.sort_by, AuditLog.timestamp)
        if filters.sort_order == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))

        return query

    @staticmethod
    def build_count_query(filters: AuditLogQueryFilters) -> Select[tuple]:
        """
        Build count query for audit logs with filters

        Args:
            filters: Query filters

        Returns:
            Select: SQLAlchemy count query
        """
        # Build base query with same filters
        base_query = select(AuditLog)

        conditions = AuditQueryBuilder._build_filter_conditions(filters)
        if conditions:
            base_query = base_query.where(and_(*conditions))

        # Convert to count query
        return select(func.count()).select_from(base_query.subquery())

    @staticmethod
    def apply_pagination(query: Select, page: int, page_size: int) -> Select[tuple]:
        """
        Apply pagination to query

        Args:
            query: Base query
            page: Page number (1-based)
            page_size: Number of items per page

        Returns:
            Select: Paginated query
        """
        offset = (page - 1) * page_size
        return query.offset(offset).limit(page_size)

    @staticmethod
    def _build_filter_conditions(filters: AuditLogQueryFilters) -> List:
        """
        Build filter conditions for audit log queries

        Args:
            filters: Query filters

        Returns:
            List: SQLAlchemy filter conditions
        """
        conditions = []

        if filters.user_id:
            conditions.append(AuditLog.user_id == filters.user_id)

        if filters.user_email:
            conditions.append(AuditLog.user_email.ilike(f"%{filters.user_email}%"))

        if filters.action_type:
            conditions.append(AuditLog.action_type == filters.action_type.value)

        if filters.resource_type:
            conditions.append(AuditLog.resource_type == filters.resource_type)

        if filters.resource_id:
            conditions.append(AuditLog.resource_id == filters.resource_id)

        if filters.ip_address:
            conditions.append(AuditLog.ip_address == filters.ip_address)

        if filters.status:
            conditions.append(AuditLog.status == filters.status)

        if filters.date_from:
            conditions.append(AuditLog.timestamp >= filters.date_from)

        if filters.date_to:
            conditions.append(AuditLog.timestamp <= filters.date_to)

        return conditions


class AuditStatsQueryBuilder:
    """
    Query builder for audit statistics and metrics
    """

    @staticmethod
    def build_total_events_query() -> Select[tuple]:
        """Build query for total events count"""
        return select(func.count(AuditLog.id))

    @staticmethod
    def build_events_today_query(today: datetime) -> Select[tuple]:
        """Build query for events today"""
        return select(func.count(AuditLog.id)).where(AuditLog.timestamp >= today)

    @staticmethod
    def build_events_period_query(start_date: datetime) -> Select[tuple]:
        """Build query for events in a time period"""
        return select(func.count(AuditLog.id)).where(AuditLog.timestamp >= start_date)

    @staticmethod
    def build_top_actions_query(limit: int = 10) -> Select[tuple]:
        """Build query for top actions by count"""
        return (
            select(AuditLog.action_type, func.count(AuditLog.id).label("count"))
            .group_by(AuditLog.action_type)
            .order_by(desc("count"))
            .limit(limit)
        )

    @staticmethod
    def build_top_users_query(limit: int = 10) -> Select[tuple]:
        """Build query for top users by activity"""
        return (
            select(AuditLog.user_email, func.count(AuditLog.id).label("count"))
            .where(AuditLog.user_email.isnot(None))
            .group_by(AuditLog.user_email)
            .order_by(desc("count"))
            .limit(limit)
        )

    @staticmethod
    def build_security_events_query(security_actions: List[str]) -> Select[tuple]:
        """Build query for security events count"""
        return select(func.count(AuditLog.id)).where(AuditLog.action_type.in_(security_actions))

    @staticmethod
    def build_failed_logins_query(start_date: datetime) -> Select[tuple]:
        """Build query for failed logins in period"""
        return select(func.count(AuditLog.id)).where(
            and_(AuditLog.action_type == "login_failure", AuditLog.timestamp >= start_date)
        )

    @staticmethod
    def build_summary_lookup_query(
        date: datetime, action_type: str, user_id: Optional[str]
    ) -> Select[tuple]:
        """Build query for summary lookup"""
        return select(AuditLogSummary).where(
            and_(
                AuditLogSummary.date == date,
                AuditLogSummary.action_type == action_type,
                AuditLogSummary.user_id == user_id,
            )
        )

    @staticmethod
    def build_comprehensive_stats_query(
        time_periods: Dict[str, datetime], security_actions: List[str]
    ) -> Select[tuple]:
        """
        Build optimized comprehensive statistics query using CTEs to eliminate N+1 patterns

        This single query replaces 8 separate queries:
        - Total events, events today, events this week, events this month
        - Security events count, failed logins count
        - Basic aggregation data for top actions and users

        Args:
            time_periods: Time period boundaries
            security_actions: List of security action types

        Returns:
            Select: Comprehensive statistics query
        """

        # Main CTE for all time-based aggregations
        base_stats = select(
            func.count().label("total_events"),
            func.sum(case((AuditLog.timestamp >= time_periods["today"], 1), else_=0)).label(
                "events_today"
            ),
            func.sum(case((AuditLog.timestamp >= time_periods["week_ago"], 1), else_=0)).label(
                "events_this_week"
            ),
            func.sum(case((AuditLog.timestamp >= time_periods["month_ago"], 1), else_=0)).label(
                "events_this_month"
            ),
            func.sum(case((AuditLog.action_type.in_(security_actions), 1), else_=0)).label(
                "security_events"
            ),
            func.sum(
                case(
                    (
                        and_(
                            AuditLog.action_type == "login_failure",
                            AuditLog.timestamp >= time_periods["month_ago"],
                        ),
                        1,
                    ),
                    else_=0,
                )
            ).label("failed_logins"),
        ).select_from(AuditLog)

        return base_stats

    @staticmethod
    def build_optimized_top_actions_query(limit: int = 10) -> Select[tuple]:
        """
        Build optimized top actions query

        Args:
            limit: Number of top actions to return

        Returns:
            Select: Top actions query
        """
        return (
            select(AuditLog.action_type, func.count(AuditLog.id).label("count"))
            .group_by(AuditLog.action_type)
            .order_by(desc("count"))
            .limit(limit)
        )

    @staticmethod
    def build_optimized_top_users_query(limit: int = 10) -> Select[tuple]:
        """
        Build optimized top users query

        Args:
            limit: Number of top users to return

        Returns:
            Select: Top users query
        """
        return (
            select(AuditLog.user_email, func.count(AuditLog.id).label("count"))
            .where(AuditLog.user_email.isnot(None))
            .group_by(AuditLog.user_email)
            .order_by(desc("count"))
            .limit(limit)
        )

    @staticmethod
    def build_dashboard_metrics_query(
        time_periods: Dict[str, datetime], security_actions: List[str]
    ) -> Select[tuple]:
        """
        Build single optimized query for all dashboard metrics using advanced CTEs

        This replaces all 8 individual queries with a single comprehensive query
        using Common Table Expressions for maximum efficiency.

        Args:
            time_periods: Time period boundaries
            security_actions: List of security action types

        Returns:
            Select: Complete dashboard metrics query
        """

        # Create comprehensive statistics in a single query
        return select(
            # Basic counts with conditional aggregation
            func.count(AuditLog.id).label("total_events"),
            func.sum(case((AuditLog.timestamp >= time_periods["today"], 1), else_=0)).label(
                "events_today"
            ),
            func.sum(case((AuditLog.timestamp >= time_periods["week_ago"], 1), else_=0)).label(
                "events_this_week"
            ),
            func.sum(case((AuditLog.timestamp >= time_periods["month_ago"], 1), else_=0)).label(
                "events_this_month"
            ),
            # Security metrics
            func.sum(case((AuditLog.action_type.in_(security_actions), 1), else_=0)).label(
                "security_events"
            ),
            func.sum(
                case(
                    (
                        and_(
                            AuditLog.action_type == "login_failure",
                            AuditLog.timestamp >= time_periods["month_ago"],
                        ),
                        1,
                    ),
                    else_=0,
                )
            ).label("failed_logins"),
            # Additional useful metrics for caching
            func.max(AuditLog.timestamp).label("last_event_timestamp"),
            func.count(func.distinct(AuditLog.user_id)).label("unique_users"),
            func.count(func.distinct(AuditLog.action_type)).label("unique_actions"),
        ).select_from(AuditLog)

    @staticmethod
    def calculate_pagination_metadata(
        total_count: int, page: int, page_size: int
    ) -> Dict[str, Any]:
        """
        Calculate pagination metadata

        Args:
            total_count: Total number of records
            page: Current page
            page_size: Items per page

        Returns:
            dict: Pagination metadata
        """
        total_pages = (total_count + page_size - 1) // page_size
        has_next = page < total_pages
        has_previous = page > 1

        return {
            "total_pages": total_pages,
            "has_next": has_next,
            "has_previous": has_previous,
        }
