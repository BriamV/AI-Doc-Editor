import { useTranslation } from 'react-i18next';
import useStore from '@store/store';
import { ChevronDown } from '@carbon/icons-react';

import { DocumentInterface, Role, roles } from '@type/document';

import useHideOnOutsideClick from '@hooks/useHideOnOutsideClick';
import React from 'react';

const RoleSelector = React.memo(
  ({ role, messageIndex, sticky }: { role: Role; messageIndex: number; sticky?: boolean }) => {
    const { t } = useTranslation();
    const chats = useStore(state => state.chats);
    const setInputRole = useStore(state => state.setInputRole);
    const setChats = useStore(state => state.setChats);
    const currentChatIndex = useStore(state => state.currentChatIndex);

    const [dropDown, setDropDown, dropDownRef] = useHideOnOutsideClick();

    return (
      <div className="prose dark:prose-invert relative">
        <button
          className="btn btn-neutral btn-small flex gap-1"
          type="button"
          onClick={() => setDropDown(prev => !prev)}
        >
          {t(role)}
          <ChevronDown />
        </button>
        <div
          ref={dropDownRef}
          id="dropdown"
          className={`${
            dropDown ? '' : 'hidden'
          } absolute top-100 bottom-100 z-10 bg-white rounded-lg shadow-xl border-b border-black/10 dark:border-gray-900/50 text-gray-800 dark:text-gray-100 group dark:bg-gray-800 opacity-90`}
        >
          <ul
            className="text-sm text-gray-700 dark:text-gray-200 p-0 m-0"
            aria-labelledby="dropdownDefaultButton"
          >
            {roles.map(r => (
              <li
                className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white cursor-pointer"
                onClick={() => {
                  if (!sticky) {
                    const updatedChats: DocumentInterface[] = JSON.parse(JSON.stringify(chats));
                    updatedChats[currentChatIndex].messageCurrent.messages[messageIndex].role = r;
                    setChats(updatedChats);
                  } else {
                    setInputRole(r);
                  }
                  setDropDown(false);
                }}
                key={r}
              >
                {t(r)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }
);
RoleSelector.displayName = 'RoleSelector';
export default RoleSelector;
