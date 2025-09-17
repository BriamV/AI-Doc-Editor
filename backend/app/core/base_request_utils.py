"""
Base request utility classes for shared request processing patterns
Consolidates request context extraction and resource identification logic
"""

from typing import Dict, Any, Optional, Tuple, List, Union
from fastapi import Request
from starlette.requests import Request as StarletteRequest

from app.core.base_validators import BaseInputValidator


class BaseRequestContext:
    """
    Base class for managing request context data
    Provides structured access to request information
    """

    def __init__(
        self,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        session_id: Optional[str] = None,
        request_id: Optional[str] = None,
        user_id: Optional[str] = None,
        user_email: Optional[str] = None,
        user_role: Optional[str] = None,
    ):
        self.ip_address = ip_address
        self.user_agent = user_agent
        self.session_id = session_id
        self.request_id = request_id
        self.user_id = user_id
        self.user_email = user_email
        self.user_role = user_role

    def to_dict(self) -> Dict[str, Any]:
        """Convert context to dictionary"""
        return {
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
            "session_id": self.session_id,
            "request_id": self.request_id,
            "user_id": self.user_id,
            "user_email": self.user_email,
            "user_role": self.user_role,
        }

    def is_authenticated(self) -> bool:
        """Check if request context includes authenticated user"""
        return self.user_id is not None and self.user_email is not None

    def has_role(self, required_role: str) -> bool:
        """Check if user has specific role"""
        return self.user_role == required_role

    def has_any_role(self, required_roles: List[str]) -> bool:
        """Check if user has any of the specified roles"""
        return self.user_role in required_roles if self.user_role else False


class BaseRequestExtractor(BaseInputValidator):
    """
    Base class for extracting information from HTTP requests
    Provides shared patterns for request data extraction
    """

    def __init__(self):
        super().__init__()
        self.header_mappings = {
            "x-forwarded-for": "forwarded_for",
            "x-real-ip": "real_ip",
            "x-session-id": "session_id",
            "x-request-id": "request_id",
            "user-agent": "user_agent",
            "authorization": "authorization",
            "content-type": "content_type",
            "referer": "referer",
        }

    def extract_ip_address(self, request: Union[Request, StarletteRequest]) -> Optional[str]:
        """
        Extract client IP address with proxy support

        Args:
            request: HTTP request object

        Returns:
            str: Client IP address
        """
        # Check for forwarded headers (proxy/load balancer support)
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            # Take the first IP in the chain (original client)
            return forwarded_for.split(",")[0].strip()

        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip.strip()

        # Fall back to direct client IP
        if hasattr(request, "client") and request.client:
            return request.client.host

        return None

    def extract_user_agent(self, request: Union[Request, StarletteRequest]) -> Optional[str]:
        """
        Extract user agent from request headers

        Args:
            request: HTTP request object

        Returns:
            str: User agent string
        """
        user_agent = request.headers.get("user-agent")
        if user_agent:
            # Sanitize user agent for security
            return self.sanitize_input(user_agent)
        return None

    def extract_session_info(
        self, request: Union[Request, StarletteRequest]
    ) -> Dict[str, Optional[str]]:
        """
        Extract session-related information from request

        Args:
            request: HTTP request object

        Returns:
            dict: Session information
        """
        return {
            "session_id": request.headers.get("x-session-id"),
            "request_id": request.headers.get("x-request-id"),
            "csrf_token": request.headers.get("x-csrf-token"),
        }

    def extract_all_headers(self, request: Union[Request, StarletteRequest]) -> Dict[str, str]:
        """
        Extract all headers with sanitization

        Args:
            request: HTTP request object

        Returns:
            dict: Sanitized headers
        """
        headers = {}
        for key, value in request.headers.items():
            sanitized_key = self.sanitize_input(key.lower())
            sanitized_value = self.sanitize_input(value)

            # Map common headers to standard names
            mapped_key = self.header_mappings.get(sanitized_key, sanitized_key)
            headers[mapped_key] = sanitized_value

        return headers

    async def extract_request_body(
        self, request: Union[Request, StarletteRequest]
    ) -> Optional[Dict[str, Any]]:
        """
        Extract and parse request body

        Args:
            request: HTTP request object

        Returns:
            dict: Parsed request body or None
        """
        try:
            content_type = request.headers.get("content-type", "")

            if "application/json" in content_type:
                if hasattr(request, "json"):
                    return await request.json()
                else:
                    # Handle starlette request
                    import json

                    body = await request.body()
                    return json.loads(body) if body else None

            elif "application/x-www-form-urlencoded" in content_type:
                if hasattr(request, "form"):
                    form_data = await request.form()
                    return dict(form_data)

            return None

        except Exception as e:
            self.add_error(f"Failed to parse request body: {str(e)}")
            return None


class BaseResourceExtractor(BaseInputValidator):
    """
    Base class for extracting resource information from requests
    Provides shared patterns for resource identification
    """

    def __init__(self):
        super().__init__()
        self.resource_patterns = {
            "documents": r"^/documents/(?P<id>[^/]+)",
            "users": r"^/users/(?P<id>[^/]+)",
            "config": r"^/config/(?P<id>[^/]+)",
            "audit": r"^/audit/(?P<action>[^/]+)",
            "api": r"^/api/(?P<version>v\d+)/(?P<resource>[^/]+)",
        }

    def extract_resource_info(
        self, request: Union[Request, StarletteRequest]
    ) -> Tuple[Optional[str], Optional[str]]:
        """
        Extract resource type and ID from request path

        Args:
            request: HTTP request object

        Returns:
            tuple: (resource_type, resource_id)
        """
        path = request.url.path
        return self.parse_resource_from_path(path)

    def parse_resource_from_path(self, path: str) -> Tuple[Optional[str], Optional[str]]:
        """
        Parse resource information from URL path

        Args:
            path: URL path to parse

        Returns:
            tuple: (resource_type, resource_id)
        """
        import re

        # Clean and normalize path
        clean_path = path.strip("/")
        path_parts = clean_path.split("/") if clean_path else []

        if not path_parts:
            return (None, None)

        # Try specific patterns first
        for resource_type, pattern in self.resource_patterns.items():
            match = re.match(pattern, path)
            if match:
                groups = match.groupdict()
                resource_id = groups.get("id") or groups.get("action")
                return (resource_type, resource_id)

        # Fall back to basic path parsing
        resource_type = path_parts[0] if path_parts else None
        resource_id = path_parts[1] if len(path_parts) > 1 else None

        return (resource_type, resource_id)

    def extract_query_parameters(self, request: Union[Request, StarletteRequest]) -> Dict[str, Any]:
        """
        Extract and sanitize query parameters

        Args:
            request: HTTP request object

        Returns:
            dict: Sanitized query parameters
        """
        params = {}

        for key, value in request.query_params.items():
            # Sanitize parameter key and value
            clean_key = self.sanitize_input(key)
            clean_value = self.sanitize_input(str(value))

            # Validate parameter for security
            if self.validate_input_security(clean_value, f"query_param_{clean_key}"):
                params[clean_key] = clean_value
            else:
                self.add_warning(f"Suspicious query parameter filtered: {clean_key}")

        return params

    def extract_path_parameters(self, request: Union[Request, StarletteRequest]) -> Dict[str, str]:
        """
        Extract path parameters from request

        Args:
            request: HTTP request object

        Returns:
            dict: Path parameters
        """
        # For FastAPI requests, path params are available directly
        if hasattr(request, "path_params"):
            return dict(request.path_params)

        # For other request types, we need to parse manually
        # This would require route information which isn't available here
        return {}


class BaseAuthenticationExtractor(BaseRequestExtractor):
    """
    Base class for extracting authentication information from requests
    Provides shared authentication context extraction
    """

    def __init__(self):
        super().__init__()
        self.token_patterns = {
            "bearer": r"^Bearer\s+(.+)$",
            "basic": r"^Basic\s+(.+)$",
            "api_key": r"^ApiKey\s+(.+)$",
        }

    def extract_auth_token(
        self, request: Union[Request, StarletteRequest]
    ) -> Optional[Dict[str, str]]:
        """
        Extract authentication token from request

        Args:
            request: HTTP request object

        Returns:
            dict: Authentication token information or None
        """
        import re

        auth_header = request.headers.get("authorization")
        if not auth_header:
            return None

        # Try to match known token patterns
        for token_type, pattern in self.token_patterns.items():
            match = re.match(pattern, auth_header, re.IGNORECASE)
            if match:
                token = match.group(1)
                return {"type": token_type, "token": token, "raw_header": auth_header}

        # Unknown token format
        return {"type": "unknown", "token": auth_header, "raw_header": auth_header}

    async def extract_user_context(
        self, request: Union[Request, StarletteRequest]
    ) -> BaseRequestContext:
        """
        Extract complete user context from request
        This method should be overridden to integrate with specific auth systems

        Args:
            request: HTTP request object

        Returns:
            BaseRequestContext: Request context with user information
        """
        # Extract basic request information
        context = BaseRequestContext(
            ip_address=self.extract_ip_address(request),
            user_agent=self.extract_user_agent(request),
            session_id=request.headers.get("x-session-id"),
            request_id=request.headers.get("x-request-id"),
        )

        # Try to extract authentication information
        auth_info = self.extract_auth_token(request)
        if auth_info and auth_info["type"] == "bearer":
            # This would integrate with your auth service
            user_data = await self._verify_token(auth_info["token"])
            if user_data:
                context.user_id = user_data.get("user_id")
                context.user_email = user_data.get("email")
                context.user_role = user_data.get("role")

        return context

    async def _verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Verify authentication token
        Override this method to integrate with your authentication system

        Args:
            token: Authentication token

        Returns:
            dict: User data or None if token is invalid
        """
        # This is a placeholder - implement actual token verification
        # Example integration with AuthService:
        try:
            from app.services.auth import AuthService

            auth_service = AuthService()
            return auth_service.verify_token(token)
        except Exception:
            return None


class BaseRequestAnalyzer:
    """
    Base class for analyzing requests for security and compliance
    Provides shared request analysis patterns
    """

    def __init__(self):
        self.request_extractor = BaseRequestExtractor()
        self.resource_extractor = BaseResourceExtractor()
        self.auth_extractor = BaseAuthenticationExtractor()

    async def analyze_request(self, request: Union[Request, StarletteRequest]) -> Dict[str, Any]:
        """
        Perform comprehensive request analysis

        Args:
            request: HTTP request object

        Returns:
            dict: Complete request analysis
        """
        analysis = {
            "timestamp": self._get_current_timestamp(),
            "method": request.method,
            "path": request.url.path,
            "context": {},
            "resource": {},
            "security": {},
            "errors": [],
            "warnings": [],
        }

        # Extract context information
        context = await self.auth_extractor.extract_user_context(request)
        analysis["context"] = context.to_dict()

        # Extract resource information
        resource_type, resource_id = self.resource_extractor.extract_resource_info(request)
        analysis["resource"] = {
            "type": resource_type,
            "id": resource_id,
            "query_params": self.resource_extractor.extract_query_parameters(request),
        }

        # Security analysis
        analysis["security"] = {
            "ip_analysis": self._analyze_ip_address(context.ip_address),
            "user_agent_analysis": self._analyze_user_agent(context.user_agent),
            "request_size": self._calculate_request_size(request),
            "headers_count": len(request.headers),
        }

        # Collect any errors or warnings
        analysis["errors"].extend(self.resource_extractor.errors)
        analysis["warnings"].extend(self.resource_extractor.warnings)

        return analysis

    def _get_current_timestamp(self) -> str:
        """Get current timestamp in ISO format"""
        from datetime import datetime

        return datetime.utcnow().isoformat()

    def _analyze_ip_address(self, ip_address: Optional[str]) -> Dict[str, Any]:
        """Analyze IP address for security flags"""
        if not ip_address:
            return {"valid": False, "reason": "missing"}

        try:
            import ipaddress

            ip_obj = ipaddress.ip_address(ip_address)

            return {
                "valid": True,
                "type": "ipv6" if isinstance(ip_obj, ipaddress.IPv6Address) else "ipv4",
                "is_private": ip_obj.is_private,
                "is_loopback": ip_obj.is_loopback,
                "is_reserved": ip_obj.is_reserved,
            }
        except ValueError:
            return {"valid": False, "reason": "invalid_format"}

    def _analyze_user_agent(self, user_agent: Optional[str]) -> Dict[str, Any]:
        """Analyze user agent for suspicious patterns"""
        if not user_agent:
            return {"present": False}

        suspicious_patterns = ["bot", "crawler", "scraper", "python", "curl", "wget"]
        is_suspicious = any(pattern in user_agent.lower() for pattern in suspicious_patterns)

        return {
            "present": True,
            "length": len(user_agent),
            "is_suspicious": is_suspicious,
            "patterns_found": [p for p in suspicious_patterns if p in user_agent.lower()],
        }

    def _calculate_request_size(self, request: Union[Request, StarletteRequest]) -> int:
        """Calculate approximate request size"""
        size = 0

        # Headers size
        for key, value in request.headers.items():
            size += len(key) + len(value) + 4  # ": " and "\r\n"

        # URL size
        size += len(str(request.url))

        # Method size
        size += len(request.method)

        return size
