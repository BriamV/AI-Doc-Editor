import { useRef, useState, useEffect } from 'react';
import useStore from '@store/store';
import MobileBar from '../MobileBar';
import { InitialEditorStateType } from '@lexical/react/LexicalComposer';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import EditorRefresh from './EditorComponents/EditorRefresh';
import EditorSelection from './EditorComponents/EditorSelection';
import EditorToolbar from './EditorComponents/EditorToolbar';
import lexicalTheme from './LexicalTheme';

import { EditorState } from 'lexical';

const Document = () => {
  const hideSideMenu = useStore(state => state.hideSideMenu);
  const hideSideAIMenu = useStore(state => state.hideSideAIMenu);
  const currentChatIndex = useStore(state => state.currentChatIndex);
  const chats = useStore(state => state.chats);
  const setChats = useStore(state => state.setChats);

  let editorState: InitialEditorStateType | undefined | null = null;

  if (chats && chats[currentChatIndex]) {
    editorState = chats[currentChatIndex].editorState;
  }

  const editorRef = useRef(null);

  const loadEditorState = () => {
    // check if the editor state of the current chat index is empty, if not, use a placeholder
    const value =
      '{"root":{"children":[{"children":[],"direction":null,"format":"","indent":0,"type":"paragraph","version":1}],"direction":null,"format":"","indent":0,"type":"root","version":1}}';

    if (editorState === undefined || editorState === null || editorState === '') {
      const temp = chats;
      if (temp) {
        temp[currentChatIndex].editorState = value;
        setChats(temp);
      }
      return value;
    } else {
      return editorState as InitialEditorStateType;
    }
  };

  const editorConfig = {
    // The editor theme
    namespace: 'MyEditor',
    theme: lexicalTheme,
    editorState: loadEditorState(),
    //  editorState: editorState,
    // Handling of errors during update
    onError(error: Error) {
      throw error;
    },
    // Any custom nodes go here
    nodes: [
      HeadingNode,
      ListNode,
      ListItemNode,
      QuoteNode,
      CodeNode,
      CodeHighlightNode,
      TableNode,
      TableCellNode,
      TableRowNode,
      AutoLinkNode,
      LinkNode,
    ],
  };

  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    // Force a refresh only when currentChatIndex changes to avoid infinite update loop
    setRefresh(prev => !prev);
  }, [currentChatIndex]);

  function onChange(change: EditorState) {
    if (!chats) return;
    const temp = chats;
    const serialized = JSON.stringify(change);
    if (temp[currentChatIndex].editorState !== serialized) {
      temp[currentChatIndex].edited = true;
      temp[currentChatIndex].editorState = serialized;
      setChats(temp);
    }
  }

  return (
    <>
      <LexicalComposer initialConfig={editorConfig}>
        <div
          className={`flex flex-col h-full flex-1 ${hideSideMenu ? 'md:pl-0' : 'md:pl-[260px]'} ${
            hideSideAIMenu ? 'md:pr-0' : 'md:pr-[365px]'
          }
   transition-all ease-in-out 
        `}
        >
          <MobileBar />
          <main className="relative h-full w-full transition-width flex flex-col overflow-hidden items-stretch flex-1">
            <div className="flex w-full">
              <div className="flex-grow w-full">
                <div className="relative h-full flex flex-grow flex-col gap-2 md:gap-3">
                  <div
                    ref={editorRef}
                    className="editor-inner line-height-1.5 flex flex-col flex-grow w-full h-screen border-b border-black/10 dark:border-gray-900/50 text-gray-800 dark:text-gray-100 group dark:bg-gray-900"
                  >
                    <EditorToolbar />
                    <RichTextPlugin
                      placeholder={<div />}
                      contentEditable={
                        <ContentEditable className="editor-input bg-white border border-gray-900/10 overflow-scroll w-full text-white text-base p-6 gap-4 md:gap-6 md:m-auto transition-all ease-in-out md:max-w-3xl dark:bg-gray-850" />
                      }
                      ErrorBoundary={LexicalErrorBoundary}
                    />
                    <EditorRefresh />
                    <OnChangePlugin onChange={onChange} />
                    <HistoryPlugin />
                    <EditorSelection />
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </LexicalComposer>
    </>
  );
};

export default Document;
