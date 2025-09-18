# OAuth 2.0 Production Deployment Security Guide

**Task**: T-02 OAuth Production Configuration
**Versión**: 1.0
**Fecha**: 2025-01-XX
**Estado**: Activo

## 📋 Resumen Ejecutivo

Esta guía proporciona las configuraciones de seguridad necesarias para el deployment seguro de OAuth 2.0 en producción, siguiendo las mejores prácticas de OWASP y RFC 6749/6750.

## 🔐 Configuración de Secrets en Producción

### 1. Variables de Entorno Obligatorias

```bash
# OAuth Provider Credentials (OBLIGATORIO)
GOOGLE_CLIENT_ID=your_production_google_client_id
GOOGLE_CLIENT_SECRET=your_production_google_client_secret
MICROSOFT_CLIENT_ID=your_production_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_production_microsoft_client_secret

# Environment Configuration (CRÍTICO)
ENVIRONMENT=production
PRODUCTION_DOMAIN=https://yourdomain.com

# JWT Security (CRÍTICO - Generar nuevos valores)
SECRET_KEY=your_cryptographically_secure_secret_key_64_chars_minimum
ACCESS_TOKEN_EXPIRE_MINUTES=15  # Reducido para producción
REFRESH_TOKEN_EXPIRE_DAYS=7

# Security Headers (OBLIGATORIO)
REQUIRE_HTTPS=true
SECURE_SSL_REDIRECT=true
SECURITY_HEADERS_ENABLED=true

# Logging & Monitoring (OBLIGATORIO)
SECURITY_LOG_ENABLED=true
LOG_SANITIZATION_ENABLED=true
AUDIT_INTEGRITY_CHECKS=true
LOG_LEVEL=INFO
```

### 2. Generación de Secrets Seguros

```bash
# Generar SECRET_KEY seguro (mínimo 64 caracteres)
python -c "import secrets; print(secrets.token_urlsafe(64))"

# Generar clave de cifrado para audit
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# Verificar entropía del secret
python -c "
import secrets
key = secrets.token_urlsafe(64)
unique_chars = len(set(key))
entropy = unique_chars / len(key)
print(f'Key: {key}')
print(f'Length: {len(key)}, Unique chars: {unique_chars}, Entropy: {entropy:.2f}')
assert len(key) >= 64, 'Key too short'
assert entropy >= 0.3, 'Key has low entropy'
print('✅ Key meets security requirements')
"
```

## 🛡️ Configuración OAuth por Proveedor

### Google Cloud Console

1. **Crear Proyecto OAuth 2.0**:
   ```
   URL: https://console.cloud.google.com/
   Navegar: APIs & Services > Credentials
   Crear: OAuth 2.0 Client ID > Web Application
   ```

2. **Configurar Authorized Redirect URIs**:
   ```
   Production: https://yourdomain.com/auth/google/callback
   Testing: https://staging.yourdomain.com/auth/google/callback

   ❌ NO incluir: http://localhost (en producción)
   ❌ NO incluir: dominios de desarrollo
   ```

3. **Configurar OAuth Consent Screen**:
   ```
   User Type: External (para acceso público)
   Scopes: email, profile, openid (mínimo necesario)
   Test users: Solo para desarrollo, remover en producción
   ```

### Microsoft Azure Portal

1. **Registrar Aplicación**:
   ```
   URL: https://portal.azure.com/
   Navegar: Azure Active Directory > App registrations
   Crear: New registration
   ```

2. **Configurar Authentication**:
   ```
   Platform: Web
   Redirect URI: https://yourdomain.com/auth/microsoft/callback

   Advanced settings:
   - Allow public client flows: No
   - Supported account types: Accounts in any organizational directory
   ```

3. **Crear Client Secret**:
   ```
   Certificates & secrets > New client secret
   Description: Production OAuth Secret
   Expires: 24 months (configurar alertas de renovación)
   ```

## 🔧 Configuración de Infraestructura

### 1. HTTPS y TLS

```nginx
# Nginx Configuration
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL Configuration
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # CSP Header (ajustar según necesidades)
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';" always;

    # OAuth Endpoints
    location /auth/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Rate limiting for OAuth endpoints
        limit_req zone=oauth burst=5 nodelay;
    }
}

# Rate limiting configuration
http {
    limit_req_zone $binary_remote_addr zone=oauth:10m rate=10r/m;
}
```

### 2. Docker Production Configuration

```dockerfile
# Production Dockerfile
FROM python:3.11-slim

# Security: Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY --chown=appuser:appuser ./app /app
WORKDIR /app

# Security: Remove sensitive files
RUN rm -rf /app/.env* /app/test* /app/*test* /app/docs/

# Switch to non-root user
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Run application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

### 3. Environment Variables Management

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  backend:
    build: .
    environment:
      - ENVIRONMENT=production
      - REQUIRE_HTTPS=true
    env_file:
      - .env.production  # Archivo separado para producción
    secrets:
      - oauth_secrets
    networks:
      - app_network

secrets:
  oauth_secrets:
    external: true  # Gestionar externamente con Docker Secrets o Kubernetes Secrets
```

## 📊 Monitoreo y Alertas

### 1. Métricas de Seguridad

```python
# Métricas importantes para monitorear
SECURITY_METRICS = {
    "oauth_failed_attempts_per_hour": 100,      # Umbral de alerta
    "jwt_token_validation_failures": 50,        # Umbral de alerta
    "suspicious_redirect_uri_attempts": 10,     # Umbral crítico
    "rate_limit_violations": 20,                # Umbral de alerta
    "invalid_oauth_state_attempts": 5,          # Umbral crítico
    "pkce_validation_failures": 10,             # Umbral de alerta
}
```

### 2. Alertas de Seguridad

```bash
# Configurar alertas para:
1. Múltiples fallos de autenticación OAuth desde la misma IP
2. Intentos de callback OAuth con URIs no autorizadas
3. Tokens JWT expirados o inválidos en volumen alto
4. Patrones de uso anómalos en OAuth flows
5. Errores de validación PKCE repetidos
6. Violaciones de rate limiting
```

### 3. Logging de Audit

```json
{
  "timestamp": "2025-01-XX T10:30:00Z",
  "event_type": "oauth_callback",
  "provider": "google",
  "status": "success",
  "user_email": "u***@example.com",
  "client_ip": "203.0.113.1",
  "flow_stage": "authorization_callback",
  "integrity_hash": "a1b2c3d4e5f6...",
  "security_context": {
    "https_used": true,
    "valid_redirect_uri": true,
    "state_validated": true,
    "pkce_validated": true
  }
}
```

## 🔄 Rotación de Secrets

### 1. Cronograma de Rotación

```yaml
# Programar rotación de secrets cada 90 días
OAuth Secrets:
  Google Client Secret: Cada 90 días
  Microsoft Client Secret: Cada 90 días
  JWT Secret Key: Cada 30 días (producción crítica)

Certificados TLS:
  Certificados SSL: Renovación automática (Let's Encrypt)
  Revisión manual: Cada 6 meses
```

### 2. Proceso de Rotación

```bash
#!/bin/bash
# Script de rotación de secrets (ejecutar en ventana de mantenimiento)

# 1. Generar nuevos secrets
NEW_GOOGLE_SECRET=$(generate_secure_secret)
NEW_MICROSOFT_SECRET=$(generate_secure_secret)
NEW_JWT_SECRET=$(python -c "import secrets; print(secrets.token_urlsafe(64))")

# 2. Actualizar en proveedores OAuth
echo "Actualizar secrets en Google Cloud Console y Azure Portal"

# 3. Actualizar variables de entorno
echo "Actualizar secrets en sistema de gestión de configuración"

# 4. Restart aplicación con rolling deployment
kubectl rollout restart deployment/backend

# 5. Verificar funcionamiento
curl -f https://yourdomain.com/health

# 6. Monitorear logs por errores
tail -f /var/log/oauth-security.log | grep -i error
```

## 📋 Checklist de Deployment

### Pre-Deployment

- [ ] **Secrets generados** con entropía suficiente (>64 caracteres)
- [ ] **OAuth providers configurados** con URIs de producción únicamente
- [ ] **Certificados TLS válidos** e instalados
- [ ] **Variables de entorno** configuradas correctamente
- [ ] **Rate limiting** configurado en proxy/load balancer
- [ ] **Logging seguro** habilitado y probado
- [ ] **Monitoreo** configurado con umbrales apropiados

### Post-Deployment

- [ ] **OAuth flows probados** con cada proveedor
- [ ] **Token validation** funcionando correctamente
- [ ] **HTTPS enforcement** activo y funcionando
- [ ] **Security headers** presentes en respuestas
- [ ] **Logs de audit** generándose correctamente
- [ ] **Alertas de monitoreo** funcionando
- [ ] **Rate limiting** activo y efectivo
- [ ] **Error handling** no expone información sensible

### Verificación Continua

- [ ] **Scan de vulnerabilidades** mensual
- [ ] **Revisión de logs** de seguridad semanal
- [ ] **Testing de penetración** trimestral
- [ ] **Actualización de dependencias** mensual
- [ ] **Rotación de secrets** según cronograma
- [ ] **Backup de configuración** seguro

## 🚨 Troubleshooting de Seguridad

### Problemas Comunes

1. **OAuth Callback Fails**:
   ```bash
   # Verificar redirect URI
   echo "Redirect URI must match exactly in OAuth provider configuration"

   # Check logs
   grep "redirect_uri_mismatch" /var/log/oauth-security.log
   ```

2. **JWT Token Validation Errors**:
   ```bash
   # Verificar SECRET_KEY
   echo "SECRET_KEY must be the same across all instances"

   # Check token expiration
   python -c "
   from jose import jwt
   token = 'your_token_here'
   payload = jwt.decode(token, verify=False)
   print(f'Expires: {payload.get('exp')}')
   "
   ```

3. **Rate Limiting Issues**:
   ```bash
   # Check rate limit logs
   grep "rate_limit_exceeded" /var/log/oauth-security.log

   # Adjust limits if needed
   OAUTH_RATE_LIMIT_PER_HOUR=200  # Increase if legitimate traffic
   ```

### Incident Response

```yaml
OAuth Security Incident Response:
  1. Immediate Actions:
     - Disable affected OAuth provider if compromised
     - Invalidate all active tokens if SECRET_KEY compromised
     - Block suspicious IP addresses
     - Enable emergency rate limiting

  2. Investigation:
     - Analyze security logs for breach timeline
     - Identify affected users and sessions
     - Check for data exfiltration attempts
     - Document attack vectors used

  3. Recovery:
     - Rotate all OAuth secrets immediately
     - Force re-authentication for all users
     - Update security configurations
     - Notify users if data potentially compromised

  4. Prevention:
     - Update security measures based on learnings
     - Enhance monitoring for detected attack patterns
     - Review and update incident response procedures
```

## 📚 Referencias y Compliance

### Estándares Seguidos

- **RFC 6749**: OAuth 2.0 Authorization Framework
- **RFC 6750**: Bearer Token Usage
- **RFC 7636**: Proof Key for Code Exchange (PKCE)
- **OWASP OAuth 2.0 Security Cheat Sheet**
- **OWASP Top 10 2021**: Security considerations
- **ISO 27001**: Information security management

### Documentación Adicional

- [Google OAuth 2.0 Security Best Practices](https://developers.google.com/identity/protocols/oauth2/web-server#security-considerations)
- [Microsoft OAuth 2.0 Security](https://docs.microsoft.com/en-us/azure/active-directory/develop/security-best-practices-for-app-registration)
- [OWASP OAuth Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/OAuth2_Cheat_Sheet.html)

---

**Nota**: Esta documentación debe revisarse y actualizarse cada 3 meses o cuando se identifiquen nuevas vulnerabilidades en OAuth 2.0.