# Browser Console Error Debugging Guide

## 1. Open Developer Tools
1. Navigate to http://localhost:5173
2. Press F12 or Ctrl+Shift+I to open DevTools
3. Go to Console tab
4. Clear existing messages (Ctrl+L)
5. Refresh the page (F5)

## 2. Look for These Specific Error Patterns

### A. Health Check API Errors
- **CORS errors**: `Access to fetch at 'http://localhost:8000/api/health' from origin 'http://localhost:5173' has been blocked by CORS policy`
- **Network errors**: `Failed to fetch` or `TypeError: NetworkError when attempting to fetch resource`
- **Backend not running**: `net::ERR_CONNECTION_REFUSED`

### B. Store/State Management Errors
- **Zustand errors**: `Cannot read properties of undefined (reading 'pagination')`
- **IDB errors**: `Failed to execute 'transaction' on 'IDBDatabase'`
- **Storage quota errors**: `QuotaExceededError`

### C. Component Rendering Errors
- **Carbon Icons errors**: `Cannot resolve module '@carbon/icons-react'`
- **React errors**: `Cannot read properties of undefined (reading 'map')`
- **Event handler errors**: `TypeError: Cannot read property 'value' of undefined`

### D. Environment/Configuration Errors
- **Missing env vars**: `import.meta.env.VITE_API_BASE_URL is undefined`
- **TypeScript runtime errors**: `Object is possibly 'undefined'`

## 3. Record All Error Details
For each error, note:
- Exact error message
- Stack trace
- File and line number
- When it occurs (on load, on interaction, etc.)