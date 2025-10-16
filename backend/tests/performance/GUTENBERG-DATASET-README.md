# Project Gutenberg Dataset for RAG Performance Testing

**Purpose**: Diverse, realistic public domain content for PERF-004 semantic search benchmarking

**Status**: Production-ready dataset downloader and chunking pipeline

---

## Overview

This dataset provides 10-15 classic books from Project Gutenberg for realistic RAG (Retrieval Augmented Generation) pipeline testing. Unlike synthetic test fixtures, these books provide real-world content complexity with semantic diversity across genres and authors.

## Key Features

- **Zero Cost**: Public domain content, no API charges
- **Diverse Content**: 10 books across 8 genres (Romance, Fantasy, Mystery, Historical, Adventure, Satire, etc.)
- **Realistic Size**: ~828,000 words total, books range from 5K to 215K words
- **Automated Cleaning**: Gutenberg headers/footers automatically removed
- **Intelligent Chunking**: Configurable word-based chunking with chapter detection
- **Metadata Rich**: JSON file with book info, word counts, genres

## Files Created

### Download Script
- **File**: `download_gutenberg_dataset.py`
- **Purpose**: Download and clean Project Gutenberg books
- **Output**: Text files in `fixtures/gutenberg/` directory

### Setup Script (Updated)
- **File**: `setup_perf_test.py` (modified)
- **Purpose**: Chunk books and upload to database
- **New Mode**: `--gutenberg` flag for Gutenberg dataset mode

### Documentation
- **File**: `README.md` (updated)
- **Content**: Complete instructions for both simple fixtures and Gutenberg modes

## Book Catalog

| ID | Title | Author | Genre | Words | Size |
|----|-------|--------|-------|-------|------|
| 1342 | Pride and Prejudice | Jane Austen | Romance | ~125,000 | ~700KB |
| 11 | Alice's Adventures in Wonderland | Lewis Carroll | Fantasy | ~27,000 | ~170KB |
| 1661 | The Adventures of Sherlock Holmes | Arthur Conan Doyle | Mystery | ~105,000 | ~580KB |
| 84 | Frankenstein | Mary Shelley | Gothic/Sci-Fi | ~78,000 | ~440KB |
| 98 | A Tale of Two Cities | Charles Dickens | Historical | ~138,000 | ~780KB |
| 2701 | Moby Dick | Herman Melville | Adventure | ~215,000 | ~1200KB |
| 16 | Peter Pan | J.M. Barrie | Children's | ~57,000 | ~320KB |
| 74 | The Adventures of Tom Sawyer | Mark Twain | Adventure | ~72,000 | ~410KB |
| 1952 | The Yellow Wallpaper | Charlotte Perkins Gilman | Short Story | ~6,000 | ~30KB |
| 1080 | A Modest Proposal | Jonathan Swift | Satire | ~5,000 | ~30KB |

**Total**: ~828,000 words across 10 books

## Quick Start

### 1. Download Books (One-Time Setup)

```bash
# Download all 10 books (~45 seconds)
python backend/tests/performance/download_gutenberg_dataset.py

# Download specific books only
python backend/tests/performance/download_gutenberg_dataset.py --book-ids 1342 11 1661

# Skip already downloaded books
python backend/tests/performance/download_gutenberg_dataset.py --skip-existing
```

**Expected Output**:
```
================================================================================
Project Gutenberg Dataset Downloader
================================================================================
Output directory: backend/tests/performance/fixtures/gutenberg
Books to download: 10
Skip existing: False
================================================================================

[1/10]
  [DOWN] Downloading: Pride and Prejudice (ID: 1342)...
  [OK] Downloaded: 01342_Pride_and_Prejudice.txt (700.2 KB) [Romance]

[2/10]
  [DOWN] Downloading: Alice's Adventures in Wonderland (ID: 11)...
  [OK] Downloaded: 00011_Alice's_Adventures_in_Wonderland.txt (167.8 KB) [Fantasy]

...

================================================================================
Download Summary
================================================================================
  Total books: 10
  Downloaded: 10
  Failed: 0
  Total size: 4530.5 KB
  Total words: 756,234
  Duration: 45.23 seconds

  Metadata: backend/tests/performance/fixtures/gutenberg/gutenberg_metadata.json
================================================================================

[SUCCESS] All books downloaded successfully!
```

### 2. Chunk and Upload to Database

```bash
# Default: 100 chunks at 1500 words each
python backend/tests/performance/setup_perf_test.py --gutenberg --target-chunks 100

# Custom chunk size (smaller chunks = more documents)
python backend/tests/performance/setup_perf_test.py --gutenberg --chunk-size 1000 --target-chunks 150

# Larger chunks (fewer documents, faster testing)
python backend/tests/performance/setup_perf_test.py --gutenberg --chunk-size 2500 --target-chunks 80
```

**Expected Output**:
```
================================================================================
T-04 Performance Testing Setup
================================================================================
Mode: Gutenberg Dataset (Chunked Books)
Target: 100 documents
Chunk size: 1500 words
Backend: http://localhost:8000
================================================================================
[Authentication and server checks...]

Found 10 Gutenberg books:
  - Pride and Prejudice by Jane Austen (125,234 words, 700.2 KB)
  - Alice's Adventures in Wonderland by Lewis Carroll (26,987 words, 167.8 KB)
  ...

Chunking books into ~1500 word documents...
Target: 100 chunks
================================================================================
  Pride and Prejudice: 83 chunks (125,234 words → ~1508 words/chunk)
  Alice's Adventures in Wonderland: 18 chunks (26,987 words → ~1499 words/chunk)
  ...

Created 120 chunks from 10 books
  Limiting to first 100 chunks (you can adjust --chunk-size to create more)

Uploading 100 document chunks...
================================================================================
  Progress: 10/100 (10.0%) - Rate: 2.34 docs/sec
  Progress: 20/100 (20.0%) - Rate: 2.45 docs/sec
  ...
================================================================================

Gutenberg chunk upload complete!
  - Total uploaded: 100
  - Failed: 0
  - Duration: 39.68 seconds
  - Rate: 2.52 docs/sec

Final document count: 100
```

## Chunking Strategy

### Word-Based Chunking
- **Default Size**: 1500 words per chunk
- **Overlap**: 150 words between chunks (10%)
- **Rationale**: Maintains context continuity for semantic search

### Chapter Detection
Automatically detects and preserves chapter information:
- Patterns: "CHAPTER I", "Chapter 1", "Chapter One"
- Roman numerals: I, II, III, IV, V, etc.
- Metadata included in chunk header

### Chunk Format (Markdown)

Each chunk is formatted as:

```markdown
# Pride and Prejudice

**Author**: Jane Austen
**Part**: 1 of 83
**Section**: Chapter I

---

It is a truth universally acknowledged, that a single man in possession
of a good fortune, must be in want of a wife...
[~1500 words of content]
```

## Output Files

### After Download

```
backend/tests/performance/fixtures/gutenberg/
├── 00011_Alice's_Adventures_in_Wonderland.txt
├── 00016_Peter_Pan.txt
├── 00074_The_Adventures_of_Tom_Sawyer.txt
├── 00084_Frankenstein.txt
├── 00098_A_Tale_of_Two_Cities.txt
├── 01080_A_Modest_Proposal.txt
├── 01342_Pride_and_Prejudice.txt
├── 01661_The_Adventures_of_Sherlock_Holmes.txt
├── 01952_The_Yellow_Wallpaper.txt
├── 02701_Moby_Dick.txt
└── gutenberg_metadata.json
```

### Metadata JSON Structure

```json
{
  "dataset": "Project Gutenberg Classic Books",
  "purpose": "RAG pipeline performance testing (PERF-004)",
  "download_date": "2025-10-16 17:06:36",
  "total_books": 10,
  "total_size_kb": 4530.5,
  "total_words": 756234,
  "books": [
    {
      "book_id": 1342,
      "title": "Pride and Prejudice",
      "author": "Jane Austen",
      "genre": "Romance",
      "year": 1813,
      "file_path": "...",
      "size_kb": 700.2,
      "word_count": 125234,
      "status": "downloaded"
    }
    // ... more books
  ]
}
```

## Use Cases

### 1. PERF-004 Search Benchmark
Test semantic search with diverse content:
- **Query Examples**: "detective mystery", "romantic comedy", "sea adventure"
- **Expected**: Sherlock Holmes, Pride and Prejudice, Moby Dick respectively
- **Validation**: p95 latency < 500ms

### 2. Content Diversity Testing
Verify RAG handles different writing styles:
- **19th Century**: Austen, Dickens, Melville
- **Children's Literature**: Carroll, Barrie
- **Gothic/Horror**: Shelley
- **Satire**: Swift

### 3. Realistic Document Sizes
Test performance with production-like documents:
- **Short Stories**: ~6K words (Yellow Wallpaper)
- **Medium Novels**: ~70-130K words (Frankenstein, Pride and Prejudice)
- **Long Novels**: ~215K words (Moby Dick)

## Advantages Over Simple Fixtures

| Feature | Simple Fixtures | Gutenberg Dataset |
|---------|----------------|-------------------|
| Content Diversity | Low (5 similar docs) | High (10 books, 8 genres) |
| Realism | Synthetic | Real-world literature |
| Semantic Richness | Limited | Extensive vocabulary |
| Cost | Free | Free (public domain) |
| Reproducibility | High | High |
| Setup Time | 5 seconds | 45 seconds (one-time) |
| Best For | Quick validation | Production testing |

## Troubleshooting

### Download Fails

**Issue**: Network errors or 404 responses

**Solution**:
```bash
# Retry with exponential backoff (automatic)
python backend/tests/performance/download_gutenberg_dataset.py

# Skip already downloaded books
python backend/tests/performance/download_gutenberg_dataset.py --skip-existing
```

### Unicode Errors on Windows

**Issue**: Console encoding issues

**Status**: Fixed in v1.0 (ASCII markers instead of Unicode symbols)

### Too Many/Too Few Chunks

**Issue**: Chunking produces wrong number of documents

**Solution**:
```bash
# More chunks (smaller size)
python backend/tests/performance/setup_perf_test.py --gutenberg --chunk-size 1000 --target-chunks 150

# Fewer chunks (larger size)
python backend/tests/performance/setup_perf_test.py --gutenberg --chunk-size 2500 --target-chunks 80
```

### Metadata Not Found

**Issue**: `gutenberg_metadata.json` missing

**Solution**:
```bash
# Re-download books (regenerates metadata)
python backend/tests/performance/download_gutenberg_dataset.py
```

## Technical Details

### Text Cleaning

Automatically removes:
- Project Gutenberg license headers
- "START OF THE PROJECT GUTENBERG EBOOK" markers
- End-of-book license footers
- Excessive newlines (3+ → 2)

### Chunking Algorithm

```python
# Simplified pseudocode
def chunk_text(text, chunk_size=1500, overlap=150):
    words = text.split()
    for i in range(0, len(words), chunk_size - overlap):
        yield words[i:i+chunk_size]
```

### URL Pattern

Primary: `https://www.gutenberg.org/files/{id}/{id}-0.txt`
Fallback: `https://www.gutenberg.org/files/{id}/{id}.txt`

### Character Encoding

- Input: UTF-8 (preferred) or Latin-1 (fallback)
- Output: UTF-8
- Handles: Accented characters, em dashes, smart quotes

## Performance Characteristics

### Download Phase
- **Duration**: ~45 seconds for 10 books
- **Bandwidth**: ~4.5 MB total
- **Rate**: ~100 KB/second (Project Gutenberg rate limit)

### Chunking Phase
- **Duration**: ~40 seconds for 100 chunks
- **Upload Rate**: ~2.5 docs/second
- **Memory**: Minimal (streaming upload)

### Storage
- **Raw Books**: ~4.5 MB
- **Chunked Markdown**: ~5-6 MB (with metadata headers)
- **Database**: Depends on RAG embeddings size

## Future Enhancements

Potential improvements:
1. **More Books**: Add books 11-20 from catalog
2. **Language Support**: Multi-language books (French, Spanish, German)
3. **Genre Filtering**: Download by genre preference
4. **Parallel Downloads**: Async concurrent downloads
5. **Progress Bar**: Rich terminal UI with tqdm
6. **Validation**: Checksum verification for downloads

## License & Attribution

### Project Gutenberg
- **License**: Public Domain (US)
- **URL**: https://www.gutenberg.org
- **Terms**: Free for any use, attribution appreciated

### This Code
- **License**: Same as parent project (AI-Doc-Editor)
- **Author**: AI Document Editor Performance Team
- **Date**: 2025-10-16

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review main README: `backend/tests/performance/README.md`
3. File GitHub issue with logs

---

**Last Updated**: 2025-10-16
**Version**: 1.0.0
**Maintainer**: Performance Engineering Team
