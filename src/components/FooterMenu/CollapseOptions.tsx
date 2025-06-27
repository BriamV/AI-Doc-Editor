import React from 'react';
import { ArrowDown as ArrowBottom } from '@carbon/icons-react';
import useStore from '@store/store';

const CollapseOptions = () => {
  const setHideMenuOptions = useStore(state => state.setHideMenuOptions);
  const hideMenuOptions = useStore(state => state.hideMenuOptions);

  const handleToggle = () => {
    setHideMenuOptions(!hideMenuOptions);
  };

  return (
    <div
      className={`fill-white p-2 hover:bg-gray-500/10 transition-colors duration-200 px-3 rounded-md cursor-pointer flex justify-center`}
      onClick={handleToggle}
    >
      <ArrowBottom
        className={`h-3 w-3 transition-all duration-100 ${hideMenuOptions ? 'rotate-180' : ''}`}
      />
    </div>
  );
};

export default CollapseOptions;
