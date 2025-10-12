# Document Search Component

Frontend search UI for T-04 RAG Pipeline semantic document search.

## Features

- **Semantic Search**: Search documents using natural language queries
- **Real-time Results**: Debounced search with 300ms delay
- **Relevance Scores**: Color-coded badges (High ≥80%, Medium 60-79%, Low <60%)
- **Error Handling**: Graceful handling of 402 (API key), 500 (server errors)
- **Loading States**: Spinner during search execution
- **Empty States**: User-friendly messages when no results
- **Enter Key Support**: Press Enter to trigger immediate search
- **Min Length Validation**: Requires minimum 3 characters

## Usage

### Basic Integration

```tsx
import { DocumentSearch } from '@components/DocumentSearch';

const MyPage = () => {
  return (
    <div>
      <h1>Search Knowledge Base</h1>
      <DocumentSearch />
    </div>
  );
};
```

### Standalone Page Example

```tsx
import React from 'react';
import { DocumentSearch } from '@components/DocumentSearch';

const SearchPage = () => {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Document Search
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Search your knowledge base using semantic similarity
        </p>
      </div>
      <DocumentSearch />
    </div>
  );
};

export default SearchPage;
```

## Components

### DocumentSearch

Main search component with input, loading states, and results display.

**Props**: None (uses Zustand store for auth state)

**State Dependencies**:
- `accessToken` - JWT token for API authentication
- `setToastShow`, `setToastMessage`, `setToastStatus` - Toast notifications

### SearchResultCard

Individual result card component.

**Props**:
- `chunk: SearchResultChunk` - Search result data

**Features**:
- Document excerpt (truncated to 300 chars)
- Relevance percentage badge
- Source filename
- Chunk position
- View document button
- Debug distance display (development only)

## API Integration

### Endpoint

```
POST /api/documents/search
```

### Request

```typescript
{
  query: string;          // 3-1000 characters
  limit?: number;         // 1-20, default 5
  collection_name?: string; // default "documents"
}
```

### Response

```typescript
{
  query: string;
  results_count: number;
  chunks: Array<{
    id: string;
    text: string;
    distance: number;        // 0 (exact) to 2 (different)
    metadata: {
      document_id: string;
      chunk_index: number;
      source: string;
    };
    document_id: string;
    chunk_index: number;
  }>;
  collection: string;
}
```

## Error Handling

| Error | Status | Handling |
|-------|--------|----------|
| API key not configured | 402 | Warning toast + user-friendly message |
| Search service unavailable | 500 | Error toast + retry suggestion |
| Network error | N/A | Generic error toast |
| Min length violation | N/A | Clear results, no error shown |

## Relevance Scoring

Distance values from ChromaDB are converted to percentages:

```typescript
relevance = (1 - distance) * 100
```

Color coding:
- **Green** (High): ≥80% relevance
- **Yellow** (Medium): 60-79% relevance
- **Red** (Low): <60% relevance

## Styling

Uses Tailwind CSS with dark mode support:
- Responsive design (mobile-first)
- Consistent with existing app theme
- Focus states for accessibility
- Smooth transitions

## Dependencies

- `lodash` - Debounce functionality
- `zustand` - Global state management
- `@api/documents-api` - API client
- `@type/documents` - TypeScript types

## Testing

To test the component:

1. Ensure backend is running (`yarn be:dev`)
2. User must be authenticated (JWT token in store)
3. User must have API key configured (or global fallback)
4. Upload documents to knowledge base first
5. Search with minimum 3 characters

## Future Enhancements

- [ ] Pagination for large result sets
- [ ] Filter by document type
- [ ] Filter by date range
- [ ] Export search results
- [ ] Search history
- [ ] Highlighted query terms in results
- [ ] Click to navigate to document detail page

## Related Files

- `src/types/documents.ts` - TypeScript type definitions
- `src/api/documents-api.ts` - API client implementation
- `backend/app/routers/documents.py` - Backend endpoint
- `backend/app/models/document_schemas.py` - Backend schemas

## Author

T-04: RAG Pipeline Implementation (Issue #32)
