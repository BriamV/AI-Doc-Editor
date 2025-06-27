import React from 'react';
import { Role } from '@type/document';
import RoleSelector from './RoleSelector';
import { User, Chat } from '@carbon/icons-react';

const Avatar = React.memo(
  ({
    role,
    messageIndex,
    sticky = false,
  }: {
    role: Role;
    messageIndex: number;
    sticky?: boolean;
  }) => {
    return (
      <div className="w-full flex flex-col relative items-center">
        {role === 'user' && <UserAvatar role={role} messageIndex={messageIndex} sticky={sticky} />}
        {(role === 'assistant' || role === 'system') && (
          <AssistantAvatar role={role} messageIndex={messageIndex} sticky={sticky} />
        )}
      </div>
    );
  }
);
Avatar.displayName = 'Avatar';

const UserAvatar = ({
  role,
  messageIndex,
  sticky = false,
}: {
  role: Role;
  messageIndex: number;
  sticky?: boolean;
}) => {
  return (
    <div className="flex w-full items-center">
      <div
        className="relative h-[28px] w-[28px] p-1 rounded-full text-white flex items-center justify-center"
        style={{ backgroundColor: 'rgb(200, 70, 70)' }}
      >
        <User />
      </div>
      <span className="flex items-center mx-3 text-sm">
        <RoleSelector role={role} messageIndex={messageIndex} sticky={sticky} />
      </span>
    </div>
  );
};

const AssistantAvatar = ({
  role,
  messageIndex,
  sticky = false,
}: {
  role: Role;
  messageIndex: number;
  sticky?: boolean;
}) => {
  return (
    <div className="flex w-full items-center">
      <div
        className="relative h-[28px] w-[28px] p-1 rounded-full text-white flex items-center justify-center"
        style={{ backgroundColor: 'rgb(126, 163, 227)' }}
      >
        <Chat />
      </div>
      <span className="flex items-center mx-3 text-sm">
        <RoleSelector role={role} messageIndex={messageIndex} sticky={sticky} />
      </span>
    </div>
  );
};

export default Avatar;
