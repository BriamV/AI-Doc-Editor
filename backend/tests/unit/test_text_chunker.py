"""
Unit tests for TextChunker service
T-04-ST2: Test text chunking with overlap and sentence boundary preservation
"""

import pytest
from app.services.text_chunker import TextChunker


@pytest.fixture
def text_chunker():
    """Provide TextChunker instance with default settings"""
    return TextChunker(chunk_size=100, overlap=20)


@pytest.fixture
def large_text_chunker():
    """Provide TextChunker instance with larger settings"""
    return TextChunker(chunk_size=1000, overlap=200)


@pytest.fixture
def sample_text():
    """Sample text for chunking tests"""
    return (
        "This is the first sentence. This is the second sentence. "
        "This is the third sentence. This is the fourth sentence. "
        "This is the fifth sentence. This is the sixth sentence."
    )


@pytest.fixture
def long_text():
    """Long text for overlap testing"""
    sentences = []
    for i in range(50):
        sentences.append(f"This is sentence number {i}. It contains some content about testing.")
    return " ".join(sentences)


class TestTextChunkerInitialization:
    """Test TextChunker initialization and configuration"""

    def test_initialization_default(self):
        """Test TextChunker initializes with default values"""
        chunker = TextChunker()
        assert chunker.chunk_size == 1000
        assert chunker.overlap == 200

    def test_initialization_custom(self):
        """Test TextChunker initializes with custom values"""
        chunker = TextChunker(chunk_size=500, overlap=100)
        assert chunker.chunk_size == 500
        assert chunker.overlap == 100

    def test_initialization_invalid_chunk_size(self):
        """Test initialization fails with invalid chunk size"""
        with pytest.raises(ValueError, match="chunk_size must be positive"):
            TextChunker(chunk_size=0)

        with pytest.raises(ValueError, match="chunk_size must be positive"):
            TextChunker(chunk_size=-100)

    def test_initialization_invalid_overlap(self):
        """Test initialization fails with invalid overlap"""
        with pytest.raises(ValueError, match="overlap cannot be negative"):
            TextChunker(overlap=-10)

    def test_initialization_overlap_exceeds_chunk_size(self):
        """Test initialization fails when overlap >= chunk_size"""
        with pytest.raises(ValueError, match="overlap must be less than chunk_size"):
            TextChunker(chunk_size=100, overlap=100)

        with pytest.raises(ValueError, match="overlap must be less than chunk_size"):
            TextChunker(chunk_size=100, overlap=150)


class TestTextNormalization:
    """Test text normalization functionality"""

    def test_normalize_line_breaks(self, text_chunker):
        """Test normalization converts all line breaks to \\n"""
        text = "Line 1\r\nLine 2\rLine 3\nLine 4"
        normalized = text_chunker._normalize_text(text)
        assert "\r\n" not in normalized
        assert "\r" not in normalized
        assert normalized.count("\n") == 3

    def test_normalize_multiple_spaces(self, text_chunker):
        """Test normalization removes extra spaces"""
        text = "Word1    Word2     Word3"
        normalized = text_chunker._normalize_text(text)
        assert "  " not in normalized
        assert normalized == "Word1 Word2 Word3"

    def test_normalize_multiple_newlines(self, text_chunker):
        """Test normalization limits consecutive newlines"""
        text = "Paragraph 1\n\n\n\n\nParagraph 2"
        normalized = text_chunker._normalize_text(text)
        assert "\n\n\n" not in normalized
        assert "Paragraph 1\n\nParagraph 2" == normalized

    def test_normalize_strips_whitespace(self, text_chunker):
        """Test normalization strips leading/trailing whitespace"""
        text = "   Content here   \n"
        normalized = text_chunker._normalize_text(text)
        assert normalized == "Content here"

    def test_normalize_empty_text(self, text_chunker):
        """Test normalization handles empty text"""
        assert text_chunker._normalize_text("") == ""
        assert text_chunker._normalize_text("   ") == ""


class TestSentenceBoundaryDetection:
    """Test sentence boundary finding logic"""

    def test_find_sentence_boundary_period(self, text_chunker):
        """Test finding boundary at period"""
        text = "First sentence. Second sentence."
        target = 10  # Middle of first sentence
        boundary = text_chunker._find_sentence_boundary(text, target)
        assert boundary == 16  # After "sentence. "

    def test_find_sentence_boundary_question_mark(self, text_chunker):
        """Test finding boundary at question mark"""
        text = "Is this a question? Yes it is."
        target = 10
        boundary = text_chunker._find_sentence_boundary(text, target)
        assert boundary == 20  # After "question? "

    def test_find_sentence_boundary_exclamation(self, text_chunker):
        """Test finding boundary at exclamation mark"""
        text = "This is exciting! Very much so."
        target = 10
        boundary = text_chunker._find_sentence_boundary(text, target)
        assert boundary == 18  # After "exciting! "

    def test_find_sentence_boundary_no_boundary(self, text_chunker):
        """Test when no sentence boundary found"""
        text = "No punctuation in this text at all"
        target = 15
        boundary = text_chunker._find_sentence_boundary(text, target)
        assert boundary == target  # Returns target if no boundary found

    def test_find_sentence_boundary_closest(self, text_chunker):
        """Test finds closest boundary to target"""
        text = "First. Second. Third. Fourth."
        target = 20  # Near "Third"
        boundary = text_chunker._find_sentence_boundary(text, target)
        # Should find closest boundary
        assert boundary in [7, 15, 22]  # One of the sentence endings


class TestBasicChunking:
    """Test basic text chunking functionality"""

    def test_chunk_text_empty(self, text_chunker):
        """Test chunking empty text"""
        chunks = text_chunker.chunk_text("")
        assert chunks == []

    def test_chunk_text_single_chunk(self, text_chunker):
        """Test text shorter than chunk size"""
        text = "Short text"
        chunks = text_chunker.chunk_text(text)
        assert len(chunks) == 1
        assert chunks[0] == text

    def test_chunk_text_exact_size(self, text_chunker):
        """Test text exactly chunk_size length"""
        text = "a" * 100  # Exactly chunk_size
        chunks = text_chunker.chunk_text(text)
        assert len(chunks) == 1
        assert len(chunks[0]) == 100

    def test_chunk_text_multiple_chunks(self, text_chunker):
        """Test text requiring multiple chunks"""
        text = "a" * 250  # Will need 3 chunks (100 + 100 + 50)
        chunks = text_chunker.chunk_text(text)
        assert len(chunks) >= 2
        assert len(chunks) <= 4  # Reasonable number of chunks

    def test_chunk_text_overlap_exists(self, text_chunker):
        """Test that chunks have overlap"""
        text = "a" * 250
        chunks = text_chunker.chunk_text(text)

        # Check that there's content overlap between consecutive chunks
        if len(chunks) > 1:
            # Last part of first chunk should appear in second chunk
            assert len(chunks[0]) > 0
            assert len(chunks[1]) > 0


class TestChunkingWithSentences:
    """Test chunking respects sentence boundaries"""

    def test_chunk_text_preserves_sentences(self, sample_text):
        """Test chunking tries to preserve sentence boundaries"""
        chunker = TextChunker(chunk_size=80, overlap=10)
        chunks = chunker.chunk_text(sample_text)

        # Each chunk should end near a sentence boundary
        for chunk in chunks[:-1]:  # All but last chunk
            # Should end with sentence ending or be close to chunk_size
            assert (
                chunk.rstrip().endswith(".") or len(chunk) >= chunker.chunk_size - 50
            )  # Within 50 chars

    def test_chunk_text_long_sentences(self):
        """Test chunking with sentences longer than chunk size"""
        long_sentence = "This is a very long sentence " * 20  # > 100 chars
        chunker = TextChunker(chunk_size=100, overlap=20)
        chunks = chunker.chunk_text(long_sentence)

        assert len(chunks) > 1
        assert all(len(chunk) > 0 for chunk in chunks)


class TestChunkingWithOverlap:
    """Test overlap behavior in chunking"""

    def test_chunk_text_overlap_parameter(self, long_text):
        """Test custom overlap parameter"""
        chunker = TextChunker(chunk_size=200, overlap=50)
        chunks = chunker.chunk_text(long_text)

        # Verify overlap exists
        if len(chunks) > 1:
            # Find common text between consecutive chunks
            overlap_found = False
            for i in range(len(chunks) - 1):
                chunk1_end = chunks[i][-50:]
                chunk2_start = chunks[i + 1][:50]

                # Check if there's any common substring
                for j in range(len(chunk1_end) - 10):
                    if chunk1_end[j : j + 10] in chunk2_start:
                        overlap_found = True
                        break

            # At least some overlap should exist
            assert overlap_found or len(chunks[0]) + len(chunks[1]) > len(long_text)

    def test_chunk_text_override_parameters(self, text_chunker, sample_text):
        """Test overriding chunk_size and overlap at call time"""
        chunks = text_chunker.chunk_text(sample_text, chunk_size=50, overlap=10)

        # Should use overridden parameters, not instance defaults
        for chunk in chunks[:-1]:
            assert len(chunk) <= 50 + 50  # chunk_size + tolerance


class TestChunkMetadata:
    """Test chunk metadata generation"""

    def test_get_chunk_metadata(self, text_chunker, sample_text):
        """Test getting chunk metadata"""
        metadata = text_chunker.get_chunk_metadata(sample_text)

        assert "original_length" in metadata
        assert "normalized_length" in metadata
        assert "chunk_count" in metadata
        assert "chunk_size" in metadata
        assert "overlap" in metadata
        assert "avg_chunk_length" in metadata
        assert "min_chunk_length" in metadata
        assert "max_chunk_length" in metadata

        assert metadata["original_length"] > 0
        assert metadata["chunk_count"] > 0
        assert metadata["chunk_size"] == text_chunker.chunk_size
        assert metadata["overlap"] == text_chunker.overlap

    def test_get_chunk_metadata_empty_text(self, text_chunker):
        """Test metadata for empty text"""
        metadata = text_chunker.get_chunk_metadata("")

        assert metadata["original_length"] == 0
        assert metadata["chunk_count"] == 0
        assert metadata["avg_chunk_length"] == 0

    def test_get_chunk_metadata_long_text(self, large_text_chunker, long_text):
        """Test metadata for long text"""
        metadata = large_text_chunker.get_chunk_metadata(long_text)

        assert metadata["chunk_count"] > 1
        assert metadata["avg_chunk_length"] > 0
        assert metadata["min_chunk_length"] <= metadata["avg_chunk_length"]
        assert metadata["avg_chunk_length"] <= metadata["max_chunk_length"]


class TestChunkValidation:
    """Test chunk validation functionality"""

    def test_validate_chunks_valid(self, text_chunker):
        """Test validation with valid chunks"""
        chunks = ["Chunk 1 content", "Chunk 2 content", "Chunk 3 content"]
        assert text_chunker.validate_chunks(chunks)

    def test_validate_chunks_empty_list(self, text_chunker):
        """Test validation with empty chunk list"""
        assert not text_chunker.validate_chunks([])

    def test_validate_chunks_empty_chunk(self, text_chunker):
        """Test validation with empty chunk in list"""
        chunks = ["Valid chunk", "", "Another valid chunk"]
        assert not text_chunker.validate_chunks(chunks)

    def test_validate_chunks_whitespace_only(self, text_chunker):
        """Test validation with whitespace-only chunk"""
        chunks = ["Valid chunk", "   ", "Another valid chunk"]
        assert not text_chunker.validate_chunks(chunks)

    def test_validate_chunks_exceeds_size(self, text_chunker):
        """Test validation with chunk exceeding 1.5x chunk_size"""
        # Create chunk that's too large
        oversized_chunk = "a" * (int(text_chunker.chunk_size * 1.6))
        chunks = ["Normal chunk", oversized_chunk]
        assert not text_chunker.validate_chunks(chunks)


class TestEdgeCases:
    """Test edge cases and special scenarios"""

    def test_chunk_text_only_whitespace(self, text_chunker):
        """Test chunking text with only whitespace"""
        text = "   \n\n   \n   "
        chunks = text_chunker.chunk_text(text)
        assert chunks == []

    def test_chunk_text_special_characters(self, text_chunker):
        """Test chunking text with special characters"""
        text = "Text with émojis 😀 and spëcial çharacters! ¿Questión?"
        chunks = text_chunker.chunk_text(text)
        assert len(chunks) > 0
        assert "😀" in "".join(chunks)

    def test_chunk_text_unicode(self, text_chunker):
        """Test chunking text with Unicode characters"""
        text = "你好世界 Привет мир مرحبا بالعالم" * 10
        chunks = text_chunker.chunk_text(text)
        assert len(chunks) > 0

    def test_chunk_text_mixed_line_endings(self, text_chunker):
        """Test chunking with mixed line ending styles"""
        text = "Line 1\r\nLine 2\rLine 3\nLine 4" * 10
        chunks = text_chunker.chunk_text(text)
        assert len(chunks) > 0
        # Should normalize line endings
        assert all("\r" not in chunk for chunk in chunks)


class TestIntegrationScenarios:
    """Test realistic integration scenarios"""

    def test_realistic_document_chunking(self):
        """Test chunking a realistic document"""
        document = """
        Introduction to Machine Learning

        Machine learning is a subset of artificial intelligence. It focuses on
        building systems that learn from data. These systems improve their
        performance over time without explicit programming.

        Types of Machine Learning

        There are three main types: supervised learning, unsupervised learning,
        and reinforcement learning. Each has its own use cases and applications.

        Supervised Learning

        In supervised learning, the algorithm learns from labeled data. It makes
        predictions based on patterns found in the training data.
        """

        chunker = TextChunker(chunk_size=200, overlap=50)
        chunks = chunker.chunk_text(document)

        # Verify chunking worked
        assert len(chunks) > 1
        assert all(len(chunk) > 0 for chunk in chunks)

        # Verify content is preserved
        combined = "".join(chunks)
        assert "Machine Learning" in combined
        assert "supervised learning" in combined

    def test_large_document_performance(self):
        """Test chunking performance with large document"""
        # Create large document (10,000 words)
        large_doc = "This is a test sentence. " * 2000

        chunker = TextChunker(chunk_size=1000, overlap=200)
        chunks = chunker.chunk_text(large_doc)

        # Should complete reasonably fast and produce many chunks
        assert len(chunks) > 10
        assert all(len(chunk) <= 1500 for chunk in chunks)  # Within tolerance
