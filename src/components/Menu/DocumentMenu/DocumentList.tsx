import React, { useEffect, useRef, useState } from 'react';
import useStore from '@store/store';
import { shallow } from 'zustand/shallow';

import DocumentFolder from './DocumentFolder';
import DocumentButton from './DocumentButton';

import {
  DocumentHistoryInterface,
  DocumentHistoryFolderInterface,
  DocumentInterface,
  FolderCollection,
} from '@type/document';

const DocumentList = () => {
  const currentDocumentIndex = useStore(state => state.currentChatIndex);
  const setChats = useStore(state => state.setChats);
  const setFolders = useStore(state => state.setFolders);
  const documentTitles = useStore(state => state.chats?.map(document => document.title), shallow);

  const [isHover, setIsHover] = useState<boolean>(false);
  const [documentFolders, setDocumentFolders] = useState<DocumentHistoryFolderInterface>({});
  const [noDocumentFolders, setNoDocumentFolders] = useState<DocumentHistoryInterface[]>([]);

  const chatsRef = useRef<DocumentInterface[]>(useStore.getState().chats || []);
  const foldersRef = useRef<FolderCollection>(useStore.getState().folders);
  const filterRef = useRef<string>('');

  const updateFolders = useRef(() => {
    const _folders: DocumentHistoryFolderInterface = {};
    const _noFolders: DocumentHistoryInterface[] = [];
    const documents = useStore.getState().chats;
    const folders = useStore.getState().folders;

    Object.values(folders)
      .sort((a, b) => a.order - b.order)
      .forEach(f => (_folders[f.id] = []));

    if (documents) {
      documents.forEach((document, index) => {
        const _filterLowerCase = filterRef.current.toLowerCase();
        const _documentTitle = document.title.toLowerCase();
        const _documentFolderName = document.folder
          ? folders[document.folder].name.toLowerCase()
          : '';

        if (
          !_documentTitle.includes(_filterLowerCase) &&
          !_documentFolderName.includes(_filterLowerCase) &&
          index !== useStore.getState().currentChatIndex
        )
          return;

        if (!document.folder) {
          _noFolders.push({ title: document.title, index: index, id: document.id });
        } else {
          if (!_folders[document.folder]) _folders[_documentFolderName] = [];
          _folders[document.folder].push({
            title: document.title,
            index: index,
            id: document.id,
          });
        }
      });
    }

    setDocumentFolders(_folders);
    setNoDocumentFolders(_noFolders);
  }).current;

  useEffect(() => {
    updateFolders();

    const unsubscribe = useStore.subscribe(state => {
      if (!state.generating && state.chats && state.chats !== chatsRef.current) {
        updateFolders();
        chatsRef.current = state.chats;
      } else if (state.folders !== foldersRef.current) {
        updateFolders();
        foldersRef.current = state.folders;
      }
    });

    return () => {
      unsubscribe();
    };
  }, [updateFolders]);

  useEffect(() => {
    if (
      documentTitles &&
      currentDocumentIndex >= 0 &&
      currentDocumentIndex < documentTitles.length
    ) {
      // set title
      document.title = documentTitles[currentDocumentIndex];

      // expand folder of current chat
      const documents = useStore.getState().chats;
      if (documents) {
        const folderId = documents[currentDocumentIndex].folder;

        if (folderId) {
          const updatedFolders: FolderCollection = JSON.parse(
            JSON.stringify(useStore.getState().folders)
          );

          if (updatedFolders[folderId]) {
            updatedFolders[folderId].expanded = true;
            setFolders(updatedFolders);
          }
        }
      }
    }
  }, [currentDocumentIndex, documentTitles, setFolders]);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.dataTransfer) {
      e.stopPropagation();
      setIsHover(false);

      const documentIndex = Number(e.dataTransfer.getData('chatIndex'));
      const updatedDocuments: DocumentInterface[] = JSON.parse(
        JSON.stringify(useStore.getState().chats)
      );
      delete updatedDocuments[documentIndex].folder;
      setChats(updatedDocuments);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsHover(true);
  };

  const handleDragLeave = () => {
    setIsHover(false);
  };

  const handleDragEnd = () => {
    setIsHover(false);
  };

  return (
    <div
      className={`flex-col flex-1 overflow-y-auto hide-scroll-bar border-b border-white/10 ${
        isHover ? 'bg-gray-800/40' : ''
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDragEnd={handleDragEnd}
    >
      {/* <div className="pt-2 px-2">
      <ChatSearch filter={filter} setFilter={setFilter} />
      </div> */}
      <div className="flex flex-col gap-2 text-gray-100 text-sm overflow-scroll h-full p-1 pt-2">
        {Object.keys(documentFolders).map(folderId => (
          <DocumentFolder
            folderDocuments={documentFolders[folderId]}
            folderId={folderId}
            key={folderId}
          />
        ))}
        {noDocumentFolders.map(({ title, index, id }) => (
          <DocumentButton title={title} key={`${title}-${id}`} chatIndex={index} />
        ))}
      </div>
      <div className="w-full h-10" />
    </div>
  );
};

export default DocumentList;
