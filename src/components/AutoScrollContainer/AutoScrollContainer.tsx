import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AutoScrollContext, AutoScrollContextType } from './hooks';

type Props = {
  className?: string;
  children: React.ReactNode;
};

const AutoScrollContainer: React.FC<Props> = ({ className, children }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);

  const scrollToBottom = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, []);

  // Observe intersection with the end sentinel to determine if user is at bottom
  useEffect(() => {
    if (!scrollRef.current || !endRef.current) return;
    const root = scrollRef.current;
    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        setAtBottom(entry.isIntersecting);
      },
      { root, threshold: 1.0 }
    );
    observer.observe(endRef.current);
    return () => observer.disconnect();
  }, []);

  // Auto-scroll when content grows and user is already at bottom
  useEffect(() => {
    if (!scrollRef.current) return;
    const target = scrollRef.current;

    // ResizeObserver with error handling to prevent loop errors in tests
    const ro = new ResizeObserver((entries) => {
      try {
        // Batch DOM reads and writes to prevent loops
        requestAnimationFrame(() => {
          if (atBottom && scrollRef.current) {
            scrollToBottom();
          }
        });
      } catch (error) {
        // Ignore ResizeObserver errors in development/testing
        if (process.env.NODE_ENV !== 'production') {
          console.debug('ResizeObserver error (safe to ignore):', error);
        }
      }
    });

    const mo = new MutationObserver((mutations) => {
      try {
        // Only trigger on significant mutations to prevent excessive calls
        const hasSignificantChanges = mutations.some(
          mutation =>
            mutation.type === 'childList' &&
            (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)
        );

        if (hasSignificantChanges && atBottom) {
          requestAnimationFrame(() => scrollToBottom());
        }
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.debug('MutationObserver error (safe to ignore):', error);
        }
      }
    });

    // Wrap observer.observe in try-catch for additional safety
    try {
      ro.observe(target);
      mo.observe(target, { childList: true, subtree: true });
    } catch (error) {
      console.warn('Failed to initialize observers:', error);
    }

    return () => {
      try {
        ro.disconnect();
        mo.disconnect();
      } catch (error) {
        // Ignore cleanup errors
      }
    };
  }, [atBottom, scrollToBottom]);

  const value = useMemo<AutoScrollContextType>(
    () => ({ atBottom, scrollToBottom }),
    [atBottom, scrollToBottom]
  );

  return (
    <AutoScrollContext.Provider value={value}>
      <div ref={scrollRef} className={className} style={{ overflowY: 'auto', height: '100%' }}>
        {children}
        <div ref={endRef} />
      </div>
    </AutoScrollContext.Provider>
  );
};

export default AutoScrollContainer;
