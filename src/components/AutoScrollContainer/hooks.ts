import React from 'react';

export type AutoScrollContextType = {
  atBottom: boolean;
  scrollToBottom: () => void;
};

export const AutoScrollContext = React.createContext<AutoScrollContextType | null>(null);

export const useAtBottom = (): [boolean] => {
  const ctx = React.useContext(AutoScrollContext);
  if (!ctx) throw new Error('useAtBottom must be used within AutoScrollContainer');
  return [ctx.atBottom];
};

export const useScrollToBottom = () => {
  const ctx = React.useContext(AutoScrollContext);
  if (!ctx) throw new Error('useScrollToBottom must be used within AutoScrollContainer');
  return ctx.scrollToBottom;
};
