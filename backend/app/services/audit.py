"""
Audit service for WORM logging system
T-13: Centralized audit logging with tamper-proof guarantees
"""

from datetime import datetime
from typing import Optional, Dict, Any
from fastapi import Request
import asyncio

from app.models.audit import AuditLog, AuditActionType
from app.models.audit_schemas import (
    AuditLogQueryFilters,
    AuditLogListResponse,
    AuditLogStatsResponse,
)
from app.db.session import AsyncSessionLocal
from app.services.audit_queries import AuditQueryBuilder, AuditStatsQueryBuilder
from app.services.audit_service_utils import AuditServiceUtils
from app.core.base_crud import BaseReadOnlyCRUDService
from app.core.base_validators import BaseInputValidator


class AuditService(BaseReadOnlyCRUDService[AuditLog]):
    """
    Service for handling audit log operations with WORM compliance
    Inherits from BaseReadOnlyCRUDService to eliminate code duplication
    """

    def __init__(self):
        super().__init__(AuditLog, AsyncSessionLocal)
        self.utils = AuditServiceUtils()
        self.query_builder = AuditQueryBuilder()
        self.stats_builder = AuditStatsQueryBuilder()
        self.input_validator = BaseInputValidator()

    # Remove duplicate get_session method - inherited from base class

    async def log_event(
        self,
        action_type: AuditActionType,
        description: str,
        user_id: Optional[str] = None,
        user_email: Optional[str] = None,
        user_role: Optional[str] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        session_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        status: str = "success",
        request: Optional[Request] = None,
    ) -> str:
        """
        Log an audit event with WORM guarantees

        Args:
            action_type: Type of action being audited
            description: Human-readable description of the event
            user_id: ID of the user performing the action
            user_email: Email of the user performing the action
            user_role: Role of the user performing the action
            resource_type: Type of resource affected (document, user, config)
            resource_id: ID of the affected resource
            ip_address: IP address of the client
            user_agent: User agent string
            session_id: Session identifier
            details: Additional event details as JSON
            status: Event status (success, failure, error)
            request: FastAPI Request object (for auto-extracting context)

        Returns:
            str: ID of the created audit log entry
        """

        # Extract context from request if provided
        if request:
            request_context = self.utils.extract_request_context(request)
            ip_address = ip_address or request_context["ip_address"]
            user_agent = user_agent or request_context["user_agent"]
            session_id = session_id or request_context["session_id"]

        # Validate and sanitize input data using inherited validation
        if description:
            description = self.input_validator.sanitize_input(description)
        if user_email:
            user_email = self.input_validator.sanitize_input(user_email)
        if resource_type:
            resource_type = self.input_validator.sanitize_input(resource_type)

        # Generate unique ID
        audit_id = self.utils.generate_audit_id()

        # Serialize details to JSON if provided
        details_json = self.utils.serialize_details(details)

        # Create audit log entry
        audit_log = AuditLog(
            id=audit_id,
            action_type=action_type.value,
            resource_type=resource_type,
            resource_id=resource_id,
            user_id=user_id,
            user_email=user_email,
            user_role=user_role,
            ip_address=ip_address,
            user_agent=user_agent,
            session_id=session_id,
            description=description,
            details=details_json,
            status=status,
            timestamp=datetime.utcnow(),
        )

        # Calculate integrity hash
        audit_log.record_hash = self.utils.calculate_record_hash(audit_log)

        try:
            async with self.get_session() as session:
                session.add(audit_log)
                await session.commit()

                # Update summary statistics (fire and forget)
                asyncio.create_task(
                    self._update_summary_stats(audit_log.timestamp, action_type, user_id)
                )

                return audit_id

        except Exception as e:
            # Log critical audit failure to system logs
            self.utils.log_critical_failure(e, "audit event logging")
            raise

    async def get_audit_logs(
        self, filters: AuditLogQueryFilters, admin_user_role: str
    ) -> AuditLogListResponse:
        """
        Retrieve audit logs with filtering and pagination (admin only)

        Args:
            filters: Query filters and pagination parameters
            admin_user_role: Role of requesting user (must be admin)

        Returns:
            AuditLogListResponse: Paginated list of audit logs
        """

        self.utils.validate_admin_access(admin_user_role)

        async with self.get_session() as session:
            # Build queries using query builder
            query = self.query_builder.build_logs_query(filters)
            count_query = self.query_builder.build_count_query(filters)

            # Get total count
            total_count = await session.scalar(count_query)

            # Apply pagination
            query = self.query_builder.apply_pagination(query, filters.page, filters.page_size)

            # Execute query
            result = await session.execute(query)
            audit_logs = result.scalars().all()

            # Convert to response objects
            log_responses = self.utils.convert_logs_to_response(audit_logs)

            # Calculate pagination metadata
            pagination_metadata = self.stats_builder.calculate_pagination_metadata(
                total_count, filters.page, filters.page_size
            )

            return AuditLogListResponse(
                logs=log_responses,
                total_count=total_count,
                page=filters.page,
                page_size=filters.page_size,
                total_pages=pagination_metadata["total_pages"],
                has_next=pagination_metadata["has_next"],
                has_previous=pagination_metadata["has_previous"],
            )

    async def get_audit_stats(self, admin_user_role: str) -> AuditLogStatsResponse:
        """
        Get audit log statistics and metrics (admin only) - OPTIMIZED VERSION

        This method now uses optimized queries to eliminate N+1 patterns:
        - Reduced from 8 separate queries to 3 optimized queries
        - Uses CTEs and conditional aggregation for better performance
        - Maintains same functionality with significantly improved efficiency

        Args:
            admin_user_role: Role of requesting user (must be admin)

        Returns:
            AuditLogStatsResponse: Audit statistics
        """

        self.utils.validate_admin_access(admin_user_role)

        async with self.get_session() as session:
            # Get time periods and security actions
            time_periods = self.utils.get_time_periods()
            security_actions = self.utils.get_security_action_types()

            # OPTIMIZATION: Single comprehensive query replaces 6 individual queries
            # This eliminates the N+1 pattern for basic statistics
            dashboard_metrics_query = self.stats_builder.build_dashboard_metrics_query(
                time_periods, security_actions
            )
            dashboard_result = await session.execute(dashboard_metrics_query)
            metrics = dashboard_result.fetchone()

            # OPTIMIZATION: Parallel execution of remaining queries
            # Execute top actions and top users queries in parallel for better performance
            import asyncio

            top_actions_task = session.execute(
                self.stats_builder.build_optimized_top_actions_query()
            )
            top_users_task = session.execute(self.stats_builder.build_optimized_top_users_query())

            # Await both queries concurrently
            top_actions_result, top_users_result = await asyncio.gather(
                top_actions_task, top_users_task
            )

            # Format results
            top_actions = self.utils.format_stats_results(
                top_actions_result.fetchall(), "action_type"
            )
            top_users = self.utils.format_stats_results(top_users_result.fetchall(), "user_email")

            # Extract metrics with safe defaults
            return AuditLogStatsResponse(
                total_events=self.utils.safe_default_value(metrics.total_events, 0),
                events_today=self.utils.safe_default_value(metrics.events_today, 0),
                events_this_week=self.utils.safe_default_value(metrics.events_this_week, 0),
                events_this_month=self.utils.safe_default_value(metrics.events_this_month, 0),
                top_actions=top_actions,
                top_users=top_users,
                security_events=self.utils.safe_default_value(metrics.security_events, 0),
                failed_logins=self.utils.safe_default_value(metrics.failed_logins, 0),
            )

    async def verify_log_integrity(self, log_id: str) -> bool:
        """
        Verify the integrity of a specific audit log entry

        Args:
            log_id: ID of the audit log to verify

        Returns:
            bool: True if log integrity is valid, False otherwise
        """

        async with self.get_session() as session:
            audit_log = await session.get(AuditLog, log_id)

            if not audit_log:
                return False

            # Recalculate hash and compare
            expected_hash = self.utils.calculate_record_hash(audit_log)
            return audit_log.record_hash == expected_hash

    async def _update_summary_stats(
        self, timestamp: datetime, action_type: AuditActionType, user_id: Optional[str]
    ):
        """
        Update summary statistics for dashboard (async background task)

        Args:
            timestamp: Event timestamp
            action_type: Type of action
            user_id: User ID
        """

        try:
            # Round timestamp to day for aggregation
            date = self.utils.round_timestamp_to_day(timestamp)

            async with self.get_session() as session:
                # Check if summary entry exists
                existing = await session.scalar(
                    self.stats_builder.build_summary_lookup_query(date, action_type.value, user_id)
                )

                if existing:
                    existing.count += 1
                else:
                    summary = self.utils.create_summary_entry(date, action_type, user_id)
                    session.add(summary)

                await session.commit()

        except Exception as e:
            # Summary failures should not affect main audit logging
            self.utils.log_warning(f"Summary stats update failed - {e}")

    async def get_audit_stats_legacy(self, admin_user_role: str) -> AuditLogStatsResponse:
        """
        LEGACY: Original get_audit_stats method with N+1 pattern (kept for comparison)

        This method demonstrates the original N+1 anti-pattern:
        - 8 separate database queries for each statistics request
        - Inefficient for large datasets
        - Poor scalability characteristics

        Use get_audit_stats() instead for optimized performance.
        """

        self.utils.validate_admin_access(admin_user_role)

        async with self.get_session() as session:
            # Get time periods
            time_periods = self.utils.get_time_periods()
            security_actions = self.utils.get_security_action_types()

            # ANTI-PATTERN: Multiple separate queries (N+1 problem)
            total_events = await session.scalar(self.stats_builder.build_total_events_query())
            events_today = await session.scalar(
                self.stats_builder.build_events_today_query(time_periods["today"])
            )
            events_this_week = await session.scalar(
                self.stats_builder.build_events_period_query(time_periods["week_ago"])
            )
            events_this_month = await session.scalar(
                self.stats_builder.build_events_period_query(time_periods["month_ago"])
            )

            # Top actions
            top_actions_result = await session.execute(self.stats_builder.build_top_actions_query())
            top_actions = self.utils.format_stats_results(
                top_actions_result.fetchall(), "action_type"
            )

            # Top users
            top_users_result = await session.execute(self.stats_builder.build_top_users_query())
            top_users = self.utils.format_stats_results(top_users_result.fetchall(), "user_email")

            # Security events
            security_events = await session.scalar(
                self.stats_builder.build_security_events_query(security_actions)
            )

            # Failed logins
            failed_logins = await session.scalar(
                self.stats_builder.build_failed_logins_query(time_periods["month_ago"])
            )

            return AuditLogStatsResponse(
                total_events=self.utils.safe_default_value(total_events, 0),
                events_today=self.utils.safe_default_value(events_today, 0),
                events_this_week=self.utils.safe_default_value(events_this_week, 0),
                events_this_month=self.utils.safe_default_value(events_this_month, 0),
                top_actions=top_actions,
                top_users=top_users,
                security_events=self.utils.safe_default_value(security_events, 0),
                failed_logins=self.utils.safe_default_value(failed_logins, 0),
            )

    # Override base CRUD validation methods for read-only audit logs
    async def _validate_create_data(self, data: Dict[str, Any], session) -> None:
        """
        Validate audit log creation data
        Ensures data integrity for WORM compliance
        """
        required_fields = ["action_type", "description", "timestamp"]

        for field in required_fields:
            if field not in data or data[field] is None:
                raise ValueError(f"Required field missing: {field}")

        # Validate action type
        if data["action_type"] not in [action.value for action in AuditActionType]:
            raise ValueError(f"Invalid action type: {data['action_type']}")

        # Validate description length and content
        if not self.input_validator.validate_length(str(data["description"]), "description"):
            raise ValueError("Description validation failed")

        if not self.input_validator.validate_input_security(
            str(data["description"]), "description"
        ):
            raise ValueError("Description contains suspicious content")
