import { useState } from 'react';

import ContentView from './View/ContentView';
import EditView from './View/EditView';
import { Role } from '@type/document';

const MessageContent = ({
  role,
  content,
  messageIndex,
  sticky = false,
}: {
  role: Role;
  content: string;
  messageIndex: number;
  sticky?: boolean;
}) => {
  const [isEdit, setIsEdit] = useState<boolean>(sticky);

  return (
    <div className={`relative flex flex-col`}>
      {isEdit ? (
        <EditView
          content={content}
          setIsEdit={setIsEdit}
          messageIndex={messageIndex}
          sticky={sticky}
        />
      ) : (
        <ContentView
          role={role}
          content={content}
          setIsEdit={setIsEdit}
          messageIndex={messageIndex}
        />
      )}
    </div>
  );
};

export default MessageContent;
