# Quick Start: Test Authentication

## ✅ Problema Resuelto

**Problema**: No aparecía el toggle "Test Mode" y OAuth fallaba con "Missing client_id"

**Causa**: No existía archivo `.env` con la configuración necesaria

**Solución**: Creado `.env` con configuración de desarrollo

---

## 🚀 Pasos para Usar Test Authentication

### 1. Reiniciar el Frontend

El frontend necesita reiniciarse para cargar las nuevas variables de entorno:

```bash
# Detener el servidor actual (Ctrl+C en la terminal donde corre)
# Luego reiniciar:
yarn fe:dev
```

### 2. Verificar que el Backend esté Corriendo

En otra terminal:

```bash
yarn be:dev
```

**Verificar**: `http://localhost:8000/api/auth/test/status` debe responder con:
```json
{
  "test_mode_enabled": true,
  "environment": "development",
  "test_users_count": 3
}
```

### 3. Usar Test Authentication

1. **Abrir** `http://localhost:5173` en tu navegador
2. **Verás** un toggle "OAuth 2.0" / "Test Mode" arriba de los botones de login
3. **Click** en "Test Mode"
4. **Seleccionar** usuario de prueba:
   - `admin@test.local` - Rol: admin
   - `editor@test.local` - Rol: editor
   - `viewer@test.local` - Rol: editor
5. **Click** "Sign in (No Password)"
6. **Verificar** que aparece un banner amarillo arriba indicando "TEST MODE"

---

## 🔧 Configuración Aplicada

El archivo `.env` creado incluye:

```env
ENVIRONMENT=development
VITE_ENABLE_TESTING=true
VITE_API_BASE_URL=http://localhost:8000/api
```

Esto habilita:
- ✅ Test Mode en el frontend
- ✅ Test authentication endpoints en el backend
- ✅ Auto-desactivado en producción

---

## 📋 Usuarios de Prueba Disponibles

| Email | Rol | Contraseña |
|-------|-----|------------|
| admin@test.local | admin | *(No requiere)* |
| editor@test.local | editor | *(No requiere)* |
| viewer@test.local | editor | *(No requiere)* |

---

## 🔒 Seguridad

- **Test Mode solo funciona en desarrollo** (`ENVIRONMENT=development`)
- **Auto-desactivado en producción** (403 Forbidden)
- **Tokens marcados** con `test_mode: true`
- **Expiración**: 8 horas (vs 30 minutos en producción)

---

## ❌ OAuth (Google/Microsoft) - NO Configurado

Para usar OAuth real necesitas:

1. **Crear credenciales OAuth** en Google Cloud Console / Azure Portal
2. **Configurar** en `.env`:
   ```env
   GOOGLE_CLIENT_ID=tu_google_client_id
   GOOGLE_CLIENT_SECRET=tu_google_client_secret

   MICROSOFT_CLIENT_ID=tu_microsoft_client_id
   MICROSOFT_CLIENT_SECRET=tu_microsoft_client_secret
   ```
3. **Ver guía completa**: `.env.example` líneas 23-99

**Por ahora, usa Test Mode para desarrollo** ✨

---

## 🐛 Troubleshooting

### El toggle no aparece

1. Verificar que `.env` existe y contiene `VITE_ENABLE_TESTING=true`
2. **Reiniciar el frontend** (Ctrl+C y `yarn fe:dev`)
3. Verificar en consola del navegador: `import.meta.env.VITE_ENABLE_TESTING`

### Backend no responde

```bash
# Verificar que está corriendo:
curl http://localhost:8000/api/auth/test/status

# Si falla, reiniciar:
yarn be:dev
```

### Error "Test mode unavailable"

1. Verificar `ENVIRONMENT=development` en `.env`
2. Reiniciar backend
3. Verificar endpoint: `http://localhost:8000/api/auth/test/users`

---

## 📚 Documentación Completa

- **Backend Architecture**: `docs/architecture/authentication/DUAL-MODE-AUTH-ARCHITECTURE.md`
- **Implementation Guide**: `docs/architecture/authentication/IMPLEMENTATION-GUIDE.md`
- **Quick Reference**: `docs/architecture/authentication/QUICK-REFERENCE.md`
- **OAuth Setup**: `.env.example` (líneas 23-140)

---

## ✅ Próximos Pasos

Después de probar test authentication:

1. **Explorar la aplicación** con diferentes roles (admin vs editor)
2. **Verificar el banner de Test Mode** (amarillo, arriba)
3. **Probar logout** desde el banner
4. **Cambiar entre usuarios** de prueba

**¡Listo para desarrollar sin configurar OAuth!** 🚀
