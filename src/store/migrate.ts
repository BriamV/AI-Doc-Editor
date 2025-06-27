// export const migrateV0 = (persistedState: any) => {
//   persistedState.chats.forEach((chat) => {
//     chat.titleSet = false;
//     if (!chat.config) chat.config = { ..._defaultChatConfig };
//   });
// };

// export const migrateV1 = (persistedState: any) => {
//   if (persistedState.apiFree) {
//     persistedState.apiEndpoint = persistedState.apiFreeEndpoint;
//   } else {
//     persistedState.apiEndpoint = officialAPIEndpoint;
//   }
// };

// export const migrateV2 = (persistedState: any) => {
//   persistedState.chats.forEach((chat) => {
//     chat.config = {
//       ...chat.config,
//       max_tokens: defaultUserMaxToken,
//     };
//   });
//   persistedState.autoTitle = false;
// };

// export const migrateV3 = (persistedState: any) => {
//   persistedState.prompts = defaultPrompts;
// };

// export const migrateV4 = (persistedState: any) => {
//   persistedState.chats.forEach((chat) => {
//     chat.config = {
//       ...chat.config,
//       model: defaultModel,
//     };
//   });
// };

// export const migrateV5 = (persistedState: any) => {
//   persistedState.chats.forEach((chat) => {
//     chat.config = {
//       ...chat.config,
//       top_p: 1,
//     };
//   });
// };

// export const migrateV6 = (persistedState: any) => {
//   if (
//     persistedState.apiEndpoint ===
//     'https://sharegpt.churchless.tech/share/v1/chat'
//   ) {
//     persistedState.apiEndpoint = officialAPIEndpoint;
//     persistedState.apiKey = '';
//   }
// };

// export const migrateV7 = (persistedState: any) => {
//   let folders: any = {};
//   const folderNameToIdMap: Record<string, string> = {};

//   // convert foldersExpanded and foldersName to folders
//   persistedState.foldersName.forEach((name: string, index: number) => {
//     const id = uuidv4();
//     const folder: any = {
//       id,
//       name,
//       expanded: persistedState.foldersExpanded[index],
//       order: index,
//     };
//     folders[id] = folder;
//     folderNameToIdMap[name] = id;
//   });

//   persistedState.folders = folders;

//   // update chat folder
//   persistedState.chats.forEach((chat: any) => {
//     if (chat.folder) {
//       chat.folder = folderNameToIdMap[chat.folder];
//     }
//   });
// };
