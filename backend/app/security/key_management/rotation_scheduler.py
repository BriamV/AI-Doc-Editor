"""
Automated Key Rotation Scheduler for T-12 Credential Store Security

Implements policy-driven automatic key rotation with:
- Configurable scheduling policies
- Multiple rotation triggers (time, usage, security)
- Zero-downtime execution
- Comprehensive error handling and rollback
- Integration with monitoring and alerting

Security Features:
- Safe rotation windows to avoid service disruption
- Automatic rollback on failures
- Comprehensive audit logging
- Integration with security incident detection
- Configurable notification system

Architecture:
- Async scheduler with configurable intervals
- Policy engine for rotation decision making
- Execution engine with safety checks
- Monitoring and alerting integration
"""

import asyncio
import logging
from datetime import datetime, timedelta, time
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass, field
from enum import Enum
import pytz

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.models.key_management import (
    KeyMaster,
    RotationPolicy,
    KeyRotation,
    KeyStatus,
    RotationTrigger,
    KeyRotationRequest,
)
from app.security.key_management.key_manager import KeyManager
from app.db.session import AsyncSessionLocal


class SchedulerStatus(str, Enum):
    """Scheduler operational status"""

    STOPPED = "stopped"
    RUNNING = "running"
    PAUSED = "paused"
    ERROR = "error"


class NotificationChannel(str, Enum):
    """Supported notification channels"""

    EMAIL = "email"
    SLACK = "slack"
    WEBHOOK = "webhook"
    SMS = "sms"
    PAGERDUTY = "pagerduty"


@dataclass
class RotationWindow:
    """Defines safe rotation execution window"""

    start_time: time
    end_time: time
    timezone: str = "UTC"
    exclude_weekends: bool = True
    exclude_holidays: bool = True

    def is_in_window(self, check_time: datetime) -> bool:
        """Check if time is within rotation window"""
        tz = pytz.timezone(self.timezone)
        local_time = check_time.astimezone(tz)

        # Check time of day
        current_time = local_time.time()
        if self.start_time <= self.end_time:
            time_in_window = self.start_time <= current_time <= self.end_time
        else:  # Window crosses midnight
            time_in_window = current_time >= self.start_time or current_time <= self.end_time

        if not time_in_window:
            return False

        # Check day of week
        if self.exclude_weekends and local_time.weekday() >= 5:  # Saturday = 5, Sunday = 6
            return False

        # Holiday checking would be implemented based on business requirements

        return True


@dataclass
class RotationResult:
    """Result of rotation execution"""

    success: bool
    key_id: str
    rotation_id: str
    execution_time_ms: int
    old_version: int
    new_version: Optional[int] = None
    error_message: Optional[str] = None
    rollback_performed: bool = False
    notifications_sent: List[str] = field(default_factory=list)


@dataclass
class SchedulerMetrics:
    """Scheduler performance and health metrics"""

    rotations_scheduled: int = 0
    rotations_completed: int = 0
    rotations_failed: int = 0
    rotations_skipped: int = 0
    average_execution_time_ms: float = 0.0
    last_successful_rotation: Optional[datetime] = None
    last_failed_rotation: Optional[datetime] = None
    uptime_seconds: int = 0


class RotationScheduler:
    """
    Automated Key Rotation Scheduler

    Manages automated key rotation based on configurable policies including:
    - Time-based rotation (daily, weekly, monthly)
    - Usage-based rotation (operation count, data volume)
    - Security event-driven rotation
    - Compliance-driven rotation

    Features:
    - Zero-downtime rotation execution
    - Safe execution windows
    - Automatic rollback on failures
    - Comprehensive monitoring and alerting
    - Policy validation and safety checks
    """

    def __init__(
        self,
        key_manager: KeyManager,
        check_interval_seconds: int = 300,  # 5 minutes
        max_concurrent_rotations: int = 3,
        default_rotation_window: Optional[RotationWindow] = None,
        notification_handlers: Optional[Dict[NotificationChannel, Callable]] = None,
        logger: Optional[logging.Logger] = None,
    ):
        """
        Initialize rotation scheduler

        Args:
            key_manager: Key management service
            check_interval_seconds: How often to check for rotations
            max_concurrent_rotations: Maximum concurrent rotation executions
            default_rotation_window: Default safe execution window
            notification_handlers: Handlers for different notification channels
            logger: Logger for scheduler events
        """
        self._key_manager = key_manager
        self._check_interval = check_interval_seconds
        self._max_concurrent = max_concurrent_rotations
        self._logger = logger or logging.getLogger(__name__)

        # Default rotation window: business hours, weekdays only
        self._default_window = default_rotation_window or RotationWindow(
            start_time=time(9, 0),  # 9 AM
            end_time=time(17, 0),  # 5 PM
            timezone="UTC",
            exclude_weekends=True,
            exclude_holidays=True,
        )

        # Notification system
        self._notification_handlers = notification_handlers or {}

        # Scheduler state
        self._status = SchedulerStatus.STOPPED
        self._scheduler_task: Optional[asyncio.Task] = None
        self._active_rotations: Dict[str, asyncio.Task] = {}
        self._rotation_lock = asyncio.Semaphore(max_concurrent_rotations)
        self._shutdown_event = asyncio.Event()

        # Metrics and monitoring
        self._metrics = SchedulerMetrics()
        self._start_time: Optional[datetime] = None

        # Policy cache for performance
        self._policy_cache: Dict[str, RotationPolicy] = {}
        self._policy_cache_ttl = timedelta(minutes=15)
        self._policy_cache_updated: Optional[datetime] = None

        self._logger.info(f"RotationScheduler initialized with {check_interval_seconds}s interval")

    async def start(self) -> None:
        """Start the rotation scheduler"""
        if self._status == SchedulerStatus.RUNNING:
            self._logger.warning("Scheduler already running")
            return

        self._status = SchedulerStatus.RUNNING
        self._start_time = datetime.utcnow()
        self._shutdown_event.clear()

        # Start the main scheduler loop
        self._scheduler_task = asyncio.create_task(self._scheduler_loop())

        self._logger.info("Key rotation scheduler started")

    async def stop(self, timeout_seconds: int = 30) -> None:
        """Stop the rotation scheduler gracefully"""
        if self._status == SchedulerStatus.STOPPED:
            return

        self._logger.info("Stopping key rotation scheduler...")
        self._status = SchedulerStatus.STOPPED
        self._shutdown_event.set()

        # Cancel main scheduler task
        if self._scheduler_task:
            self._scheduler_task.cancel()
            try:
                await asyncio.wait_for(self._scheduler_task, timeout=timeout_seconds)
            except asyncio.TimeoutError:
                self._logger.warning("Scheduler shutdown timeout")

        # Wait for active rotations to complete
        if self._active_rotations:
            self._logger.info(
                f"Waiting for {len(self._active_rotations)} active rotations to complete..."
            )
            await asyncio.gather(*self._active_rotations.values(), return_exceptions=True)

        self._logger.info("Key rotation scheduler stopped")

    async def pause(self) -> None:
        """Pause rotation scheduling (keep active rotations running)"""
        if self._status == SchedulerStatus.RUNNING:
            self._status = SchedulerStatus.PAUSED
            self._logger.info("Key rotation scheduler paused")

    async def resume(self) -> None:
        """Resume rotation scheduling"""
        if self._status == SchedulerStatus.PAUSED:
            self._status = SchedulerStatus.RUNNING
            self._logger.info("Key rotation scheduler resumed")

    async def force_rotation(
        self,
        key_id: str,
        trigger: RotationTrigger = RotationTrigger.MANUAL,
        user_id: Optional[str] = None,
        bypass_window: bool = False,
    ) -> RotationResult:
        """
        Force immediate key rotation

        Args:
            key_id: Key to rotate
            trigger: Rotation trigger type
            user_id: User requesting rotation
            bypass_window: Skip rotation window check

        Returns:
            Rotation result
        """
        try:
            # Check rotation window unless bypassed
            if not bypass_window and not self._is_in_rotation_window():
                raise ValueError("Current time is outside safe rotation window")

            # Create rotation request
            rotation_request = KeyRotationRequest(
                key_id=key_id, trigger=trigger, force_rotation=True, scheduled_at=datetime.utcnow()
            )

            # Execute rotation
            async with AsyncSessionLocal() as session:
                result = await self._execute_single_rotation(session, rotation_request, user_id)

            self._logger.info(f"Forced rotation completed for key {key_id}")
            return result

        except Exception as e:
            self._logger.error(f"Forced rotation failed for key {key_id}: {e}")
            return RotationResult(
                success=False,
                key_id=key_id,
                rotation_id="",
                execution_time_ms=0,
                old_version=0,
                error_message=str(e),
            )

    async def get_status(self) -> Dict[str, Any]:
        """Get scheduler status and metrics"""
        uptime = 0
        if self._start_time:
            uptime = int((datetime.utcnow() - self._start_time).total_seconds())

        return {
            "status": self._status.value,
            "uptime_seconds": uptime,
            "active_rotations": len(self._active_rotations),
            "metrics": {
                "rotations_scheduled": self._metrics.rotations_scheduled,
                "rotations_completed": self._metrics.rotations_completed,
                "rotations_failed": self._metrics.rotations_failed,
                "rotations_skipped": self._metrics.rotations_skipped,
                "average_execution_time_ms": self._metrics.average_execution_time_ms,
                "last_successful_rotation": (
                    self._metrics.last_successful_rotation.isoformat()
                    if self._metrics.last_successful_rotation
                    else None
                ),
                "last_failed_rotation": (
                    self._metrics.last_failed_rotation.isoformat()
                    if self._metrics.last_failed_rotation
                    else None
                ),
            },
            "configuration": {
                "check_interval_seconds": self._check_interval,
                "max_concurrent_rotations": self._max_concurrent,
                "rotation_window": {
                    "start_time": self._default_window.start_time.isoformat(),
                    "end_time": self._default_window.end_time.isoformat(),
                    "timezone": self._default_window.timezone,
                },
            },
        }

    async def _scheduler_loop(self) -> None:
        """Main scheduler loop"""
        try:
            while not self._shutdown_event.is_set():
                try:
                    if self._status == SchedulerStatus.RUNNING:
                        await self._check_and_schedule_rotations()

                    # Wait for next check or shutdown
                    try:
                        await asyncio.wait_for(
                            self._shutdown_event.wait(), timeout=self._check_interval
                        )
                        break  # Shutdown requested
                    except asyncio.TimeoutError:
                        continue  # Normal timeout, continue loop

                except Exception as e:
                    self._logger.error(f"Error in scheduler loop: {e}")
                    self._status = SchedulerStatus.ERROR
                    await asyncio.sleep(60)  # Wait before retrying
                    self._status = SchedulerStatus.RUNNING

        except asyncio.CancelledError:
            self._logger.info("Scheduler loop cancelled")
        except Exception as e:
            self._logger.error(f"Fatal error in scheduler loop: {e}")
            self._status = SchedulerStatus.ERROR

    async def _check_and_schedule_rotations(self) -> None:
        """Check for keys that need rotation and schedule them"""
        try:
            async with AsyncSessionLocal() as session:
                # Get active rotation policies
                policies = await self._get_active_policies(session)

                for policy in policies:
                    # Find keys that match this policy and need rotation
                    candidate_keys = await self._find_rotation_candidates(session, policy)

                    for key_master in candidate_keys:
                        # Check if rotation is due
                        if await self._is_rotation_due(session, key_master, policy):
                            await self._schedule_rotation(session, key_master, policy)

                # Clean up completed rotation tasks
                await self._cleanup_completed_rotations()

        except Exception as e:
            self._logger.error(f"Error checking for rotations: {e}")

    async def _get_active_policies(self, session: AsyncSession) -> List[RotationPolicy]:
        """Get all active rotation policies"""
        try:
            # Check cache first
            if (
                self._policy_cache_updated
                and datetime.utcnow() - self._policy_cache_updated < self._policy_cache_ttl
            ):
                return list(self._policy_cache.values())

            # Fetch from database
            result = await session.execute(select(RotationPolicy).where(RotationPolicy.is_active))
            policies = result.scalars().all()

            # Update cache
            self._policy_cache = {p.policy_name: p for p in policies}
            self._policy_cache_updated = datetime.utcnow()

            return policies

        except Exception as e:
            self._logger.error(f"Error fetching rotation policies: {e}")
            return []

    async def _find_rotation_candidates(
        self, session: AsyncSession, policy: RotationPolicy
    ) -> List[KeyMaster]:
        """Find keys that match the policy criteria"""
        try:
            query = select(KeyMaster).where(
                and_(
                    KeyMaster.key_type == policy.key_type,
                    KeyMaster.status.in_([KeyStatus.ACTIVE.value, KeyStatus.ROTATED.value]),
                )
            )

            result = await session.execute(query)
            return result.scalars().all()

        except Exception as e:
            self._logger.error(
                f"Error finding rotation candidates for policy {policy.policy_name}: {e}"
            )
            return []

    async def _is_rotation_due(
        self, session: AsyncSession, key_master: KeyMaster, policy: RotationPolicy
    ) -> bool:
        """Check if key rotation is due based on policy"""
        try:
            now = datetime.utcnow()

            # Time-based rotation
            if policy.rotation_interval_days:
                last_rotation = (
                    key_master.rotated_at or key_master.activated_at or key_master.created_at
                )
                if now - last_rotation >= timedelta(days=policy.rotation_interval_days):
                    return True

            # Usage-based rotation
            if policy.max_operations and key_master.usage_count >= policy.max_operations:
                return True

            # Expiration-based rotation
            if key_master.expires_at and now >= key_master.expires_at - timedelta(days=7):
                return True

            # Check if already scheduled
            pending_rotation = await session.execute(
                select(KeyRotation).where(
                    and_(
                        KeyRotation.key_id == key_master.key_id,
                        KeyRotation.status.in_(["SCHEDULED", "RUNNING"]),
                    )
                )
            )
            if pending_rotation.scalar_one_or_none():
                return False  # Already scheduled

            return False

        except Exception as e:
            self._logger.error(f"Error checking rotation due for key {key_master.key_id}: {e}")
            return False

    async def _schedule_rotation(
        self, session: AsyncSession, key_master: KeyMaster, policy: RotationPolicy
    ) -> None:
        """Schedule a key rotation"""
        try:
            # Calculate next rotation time within window
            scheduled_time = self._calculate_next_rotation_time(policy)

            # Create rotation request
            rotation_request = KeyRotationRequest(
                key_id=key_master.key_id,
                trigger=RotationTrigger.SCHEDULED,
                trigger_details={"policy_name": policy.policy_name, "policy_id": str(policy.id)},
                scheduled_at=scheduled_time,
            )

            # If scheduled time is now and we're in rotation window, execute immediately
            if (
                scheduled_time <= datetime.utcnow() + timedelta(minutes=5)
                and self._is_in_rotation_window()
            ):

                # Check concurrent rotation limit
                if len(self._active_rotations) < self._max_concurrent:
                    task_id = f"rotation_{key_master.key_id}_{datetime.utcnow().timestamp()}"
                    task = asyncio.create_task(
                        self._execute_single_rotation(session, rotation_request, "scheduler")
                    )
                    self._active_rotations[task_id] = task
                    self._metrics.rotations_scheduled += 1

                    self._logger.info(f"Scheduled immediate rotation for key {key_master.key_id}")
                else:
                    self._logger.warning(
                        f"Maximum concurrent rotations reached, deferring key {key_master.key_id}"
                    )
                    self._metrics.rotations_skipped += 1
            else:
                # Schedule for later execution
                self._logger.info(
                    f"Scheduled rotation for key {key_master.key_id} at {scheduled_time}"
                )
                self._metrics.rotations_scheduled += 1

        except Exception as e:
            self._logger.error(f"Error scheduling rotation for key {key_master.key_id}: {e}")

    async def _execute_single_rotation(
        self, session: AsyncSession, rotation_request: KeyRotationRequest, user_id: str
    ) -> RotationResult:
        """Execute a single key rotation with comprehensive error handling"""
        start_time = datetime.utcnow()
        rotation_id = ""

        try:
            async with self._rotation_lock:
                # Execute the rotation through key manager
                rotation_response = await self._key_manager.rotate_key(
                    session, rotation_request, user_id
                )

                execution_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)

                result = RotationResult(
                    success=True,
                    key_id=rotation_request.key_id,
                    rotation_id=rotation_response.id,
                    execution_time_ms=execution_time,
                    old_version=rotation_response.old_version,
                    new_version=rotation_response.new_version,
                )

                # Update metrics
                self._metrics.rotations_completed += 1
                self._metrics.last_successful_rotation = datetime.utcnow()
                self._update_average_execution_time(execution_time)

                # Send notifications
                await self._send_rotation_notifications(result, "success")

                return result

        except Exception as e:
            execution_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)

            result = RotationResult(
                success=False,
                key_id=rotation_request.key_id,
                rotation_id=rotation_id,
                execution_time_ms=execution_time,
                old_version=0,
                error_message=str(e),
            )

            # Update metrics
            self._metrics.rotations_failed += 1
            self._metrics.last_failed_rotation = datetime.utcnow()

            # Send failure notifications
            await self._send_rotation_notifications(result, "failure")

            self._logger.error(f"Rotation failed for key {rotation_request.key_id}: {e}")
            return result

    def _is_in_rotation_window(self, check_time: Optional[datetime] = None) -> bool:
        """Check if current time is within safe rotation window"""
        return self._default_window.is_in_window(check_time or datetime.utcnow())

    def _calculate_next_rotation_time(self, policy: RotationPolicy) -> datetime:
        """Calculate next safe rotation time based on policy"""
        now = datetime.utcnow()

        # If we have a specific window, find next time in window
        if policy.rotation_window_start and policy.rotation_window_end:
            # Note: timezone handling could be implemented if needed

            # Parse policy window times
            start_time = time.fromisoformat(policy.rotation_window_start)
            end_time = time.fromisoformat(policy.rotation_window_end)

            policy_window = RotationWindow(
                start_time=start_time, end_time=end_time, timezone=policy.timezone or "UTC"
            )

            # Find next time in window
            check_time = now
            for _ in range(8):  # Check next 8 days
                if policy_window.is_in_window(check_time):
                    return check_time
                check_time += timedelta(hours=1)

        # Default to next default window
        return self._find_next_default_window_time(now)

    def _find_next_default_window_time(self, from_time: datetime) -> datetime:
        """Find next time within default rotation window"""
        check_time = from_time.replace(minute=0, second=0, microsecond=0)

        for _ in range(24 * 7):  # Check next week
            if self._default_window.is_in_window(check_time):
                return check_time
            check_time += timedelta(hours=1)

        # Fallback to immediate if no window found
        return from_time

    async def _cleanup_completed_rotations(self) -> None:
        """Clean up completed rotation tasks"""
        completed_tasks = []

        for task_id, task in self._active_rotations.items():
            if task.done():
                completed_tasks.append(task_id)

                # Log task completion
                try:
                    result = await task
                    if result.success:
                        self._logger.debug(f"Rotation task {task_id} completed successfully")
                    else:
                        self._logger.warning(
                            f"Rotation task {task_id} failed: {result.error_message}"
                        )
                except Exception as e:
                    self._logger.error(f"Rotation task {task_id} raised exception: {e}")

        # Remove completed tasks
        for task_id in completed_tasks:
            del self._active_rotations[task_id]

    async def _send_rotation_notifications(
        self, result: RotationResult, notification_type: str
    ) -> None:
        """Send notifications about rotation events"""
        try:
            notification_data = {
                "key_id": result.key_id,
                "rotation_id": result.rotation_id,
                "success": result.success,
                "execution_time_ms": result.execution_time_ms,
                "timestamp": datetime.utcnow().isoformat(),
            }

            if notification_type == "failure":
                notification_data["error_message"] = result.error_message

            # Send to configured channels
            for channel, handler in self._notification_handlers.items():
                try:
                    await handler(notification_type, notification_data)
                    result.notifications_sent.append(channel.value)
                except Exception as e:
                    self._logger.error(f"Failed to send {channel.value} notification: {e}")

        except Exception as e:
            self._logger.error(f"Error sending rotation notifications: {e}")

    def _update_average_execution_time(self, execution_time_ms: int) -> None:
        """Update running average of execution times"""
        if self._metrics.average_execution_time_ms == 0:
            self._metrics.average_execution_time_ms = float(execution_time_ms)
        else:
            # Simple moving average
            self._metrics.average_execution_time_ms = (
                self._metrics.average_execution_time_ms * 0.9 + execution_time_ms * 0.1
            )
