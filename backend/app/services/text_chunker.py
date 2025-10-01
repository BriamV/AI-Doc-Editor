"""
Text chunking service for RAG pipeline
T-04-ST2: Split extracted text into overlapping chunks for embeddings
"""

import logging
import re
from typing import List

logger = logging.getLogger(__name__)


class TextChunker:
    """
    Service for splitting text into overlapping chunks
    Optimized for RAG embeddings with sentence boundary preservation
    """

    def __init__(self, chunk_size: int = 1000, overlap: int = 200):
        """
        Initialize text chunker with configuration

        Args:
            chunk_size: Target size for each chunk in characters (default: 1000)
            overlap: Number of overlapping characters between chunks (default: 200)
        """
        if chunk_size <= 0:
            raise ValueError("chunk_size must be positive")
        if overlap < 0:
            raise ValueError("overlap cannot be negative")
        if overlap >= chunk_size:
            raise ValueError("overlap must be less than chunk_size")

        self.chunk_size = chunk_size
        self.overlap = overlap

        logger.info(f"TextChunker initialized: chunk_size={chunk_size}, overlap={overlap}")

    def _normalize_text(self, text: str) -> str:
        """
        Clean and normalize text before chunking

        Args:
            text: Raw text to normalize

        Returns:
            Normalized text
        """
        # Normalize line breaks (convert \r\n and \r to \n)
        text = text.replace("\r\n", "\n").replace("\r", "\n")

        # Remove excessive whitespace (but preserve single spaces and newlines)
        text = re.sub(r" +", " ", text)  # Multiple spaces to single space
        text = re.sub(r"\n{3,}", "\n\n", text)  # Max 2 consecutive newlines

        # Strip leading/trailing whitespace
        text = text.strip()

        return text

    def _find_sentence_boundary(self, text: str, target_pos: int) -> int:
        """
        Find the nearest sentence boundary near target position

        Args:
            text: Text to search
            target_pos: Target position to find boundary near

        Returns:
            Position of sentence boundary (or target_pos if no boundary found)
        """
        # Look for sentence endings: . ! ? followed by space or newline
        sentence_endings = r"[.!?][\s\n]"

        # Search window: ±50 characters from target
        search_start = max(0, target_pos - 50)
        search_end = min(len(text), target_pos + 50)
        search_window = text[search_start:search_end]

        # Find all sentence endings in window
        matches = list(re.finditer(sentence_endings, search_window))

        if not matches:
            # No sentence boundary found, return target position
            return target_pos

        # Find closest match to target position
        target_offset = target_pos - search_start
        closest_match = min(matches, key=lambda m: abs(m.start() - target_offset))

        # Return absolute position (after the sentence ending)
        return search_start + closest_match.end()

    def chunk_text(
        self,
        text: str,
        chunk_size: int | None = None,
        overlap: int | None = None,
    ) -> List[str]:
        """
        Split text into overlapping chunks with sentence boundary preservation

        Args:
            text: Text to chunk
            chunk_size: Override default chunk size (optional)
            overlap: Override default overlap (optional)

        Returns:
            List of text chunks
        """
        # Use provided values or fall back to instance defaults
        chunk_size = chunk_size or self.chunk_size
        overlap = overlap or self.overlap

        logger.info(
            f"Starting text chunking: {len(text)} chars, chunk_size={chunk_size}, overlap={overlap}"
        )

        # Normalize text first
        text = self._normalize_text(text)

        if not text:
            logger.warning("Empty text provided for chunking")
            return []

        # If text is shorter than chunk size, return as single chunk
        if len(text) <= chunk_size:
            logger.info("Text fits in single chunk")
            return [text]

        chunks = []
        start = 0

        while start < len(text):
            # Calculate end position
            end = start + chunk_size

            # If this is not the last chunk, try to find sentence boundary
            if end < len(text):
                end = self._find_sentence_boundary(text, end)

            # Extract chunk
            chunk = text[start:end].strip()

            if chunk:  # Only add non-empty chunks
                chunks.append(chunk)
                logger.debug(
                    f"Created chunk {len(chunks)}: {len(chunk)} chars (start={start}, end={end})"
                )

            # Move to next chunk start (with overlap)
            next_start = end - overlap

            # Avoid infinite loop if overlap causes no progress
            if next_start <= start:
                next_start = end

            start = next_start

            # Break if we're at the end
            if start >= len(text):
                break

        logger.info(f"Text chunking complete: {len(chunks)} chunks created")

        return chunks

    def get_chunk_metadata(self, text: str) -> dict:
        """
        Get metadata about how text would be chunked

        Args:
            text: Text to analyze

        Returns:
            Dictionary with chunk metadata
        """
        normalized_text = self._normalize_text(text)
        chunks = self.chunk_text(normalized_text)

        return {
            "original_length": len(text),
            "normalized_length": len(normalized_text),
            "chunk_count": len(chunks),
            "chunk_size": self.chunk_size,
            "overlap": self.overlap,
            "avg_chunk_length": sum(len(c) for c in chunks) / len(chunks) if chunks else 0,
            "min_chunk_length": min(len(c) for c in chunks) if chunks else 0,
            "max_chunk_length": max(len(c) for c in chunks) if chunks else 0,
        }

    def validate_chunks(self, chunks: List[str]) -> bool:
        """
        Validate that chunks meet quality requirements

        Args:
            chunks: List of text chunks to validate

        Returns:
            True if all chunks are valid
        """
        if not chunks:
            logger.warning("No chunks to validate")
            return False

        for i, chunk in enumerate(chunks):
            if not chunk.strip():
                logger.warning(f"Chunk {i} is empty")
                return False

            if len(chunk) > self.chunk_size * 1.5:
                logger.warning(f"Chunk {i} exceeds 1.5x chunk_size: {len(chunk)} chars")
                return False

        return True
