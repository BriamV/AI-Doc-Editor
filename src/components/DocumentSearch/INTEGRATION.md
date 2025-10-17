# Integration Guide: Document Search Component

Quick guide to integrate the DocumentSearch component into the application.

## Option 1: Standalone Page (Recommended)

### Create Search Page

Create `src/pages/SearchPage.tsx`:

```tsx
import React from 'react';
import { DocumentSearch } from '@components/DocumentSearch';

const SearchPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Knowledge Base Search
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Search your uploaded documents using semantic similarity
          </p>
        </div>

        {/* Search Component */}
        <DocumentSearch />
      </div>
    </div>
  );
};

export default SearchPage;
```

### Add Route (React Router Example)

In your router configuration:

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SearchPage from '@pages/SearchPage';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* ... existing routes ... */}
        <Route path="/search" element={<SearchPage />} />
      </Routes>
    </BrowserRouter>
  );
};
```

### Add Navigation Link

Add to your navigation menu:

```tsx
<nav>
  {/* ... other nav items ... */}
  <a href="/search" className="nav-link">
    <SearchIcon />
    Search Documents
  </a>
</nav>
```

## Option 2: Modal/Drawer Integration

### Search Modal Component

```tsx
import React, { useState } from 'react';
import { DocumentSearch } from '@components/DocumentSearch';

const SearchModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <CloseIcon />
          </button>

          {/* Search Component */}
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              Search Documents
            </h2>
            <DocumentSearch />
          </div>
        </div>
      </div>
    </div>
  );
};

// Usage
const MyComponent = () => {
  const [showSearch, setShowSearch] = useState(false);

  return (
    <>
      <button onClick={() => setShowSearch(true)}>Search Documents</button>
      <SearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </>
  );
};
```

## Option 3: Sidebar Panel Integration

### Search Sidebar

```tsx
import React from 'react';
import { DocumentSearch } from '@components/DocumentSearch';

const SearchSidebar = ({ isOpen }: { isOpen: boolean }) => {
  return (
    <div
      className={`
        fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-800 shadow-xl
        transform transition-transform duration-300
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}
    >
      <div className="p-4 h-full overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Search</h2>
        <DocumentSearch />
      </div>
    </div>
  );
};
```

## Option 4: Embedded in Dashboard

### Dashboard with Search

```tsx
import React from 'react';
import { DocumentSearch } from '@components/DocumentSearch';

const Dashboard = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Stats */}
      <div className="lg:col-span-1">
        <StatsWidget />
      </div>

      {/* Right Column: Search */}
      <div className="lg:col-span-2">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Quick Search</h2>
          <DocumentSearch />
        </div>
      </div>
    </div>
  );
};
```

## Authentication Check

Wrap in authentication guard if needed:

```tsx
import { DocumentSearch } from '@components/DocumentSearch';
import useStore from '@store/store';

const ProtectedSearchPage = () => {
  const isAuthenticated = useStore(state => state.isAuthenticated);

  if (!isAuthenticated) {
    return <LoginPrompt />;
  }

  return (
    <div>
      <h1>Search Documents</h1>
      <DocumentSearch />
    </div>
  );
};
```

## API Key Check

Display warning if API key not configured:

```tsx
import { DocumentSearch } from '@components/DocumentSearch';
import useStore from '@store/store';

const SearchWithAPIKeyCheck = () => {
  const apiKey = useStore(state => state.apiKey);
  const accessToken = useStore(state => state.accessToken);

  if (!accessToken) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600">Please log in to search documents</p>
      </div>
    );
  }

  return (
    <div>
      {!apiKey && (
        <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 rounded">
          <p className="text-yellow-800">
            API key not configured. Search may not work unless a global fallback is set.
          </p>
        </div>
      )}
      <DocumentSearch />
    </div>
  );
};
```

## Keyboard Shortcut (Optional)

Add global keyboard shortcut to open search:

```tsx
import { useEffect } from 'react';

const useSearchShortcut = (callback: () => void) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [callback]);
};

// Usage
const App = () => {
  const [showSearch, setShowSearch] = useState(false);
  useSearchShortcut(() => setShowSearch(true));

  return (
    <>
      <SearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </>
  );
};
```

## Testing Checklist

Before deploying:

- [ ] Backend running on correct port
- [ ] User authenticated (JWT token present)
- [ ] API key configured (user or global)
- [ ] Documents uploaded to knowledge base
- [ ] Search returns results
- [ ] Error handling works (try without API key)
- [ ] Loading states display correctly
- [ ] Mobile responsive design verified
- [ ] Dark mode tested
- [ ] Keyboard navigation works

## Troubleshooting

### "API key not configured" error

- Check user has API key in credentials table
- Or verify global fallback API key exists
- See `backend/app/routers/credentials.py` for key resolution logic

### No results found

- Verify documents are uploaded and processed (`status = 'completed'`)
- Check ChromaDB collection name matches ('documents')
- Ensure user_id filter is working correctly

### Network errors

- Verify backend is running (`http://localhost:8000`)
- Check CORS configuration
- Verify JWT token is valid and not expired

### Type errors

- Run `yarn fe:typecheck` to check TypeScript
- Ensure `@type/documents` import path is correct
- Verify tsconfig.json paths are configured
