import { useRef, useState, ReactNode, RefObject } from 'react';

import { Copy, Checkmark } from '@carbon/icons-react';
import React from 'react';

const CodeBlock = ({
  lang,
  codeChildren,
}: {
  lang: string;
  codeChildren: ReactNode & ReactNode[];
}) => {
  const codeRef = useRef<HTMLElement>(null);

  return (
    <div className="bg-black rounded-md">
      <CodeBar lang={lang} codeRef={codeRef} />
      <div className="p-4 overflow-y-auto">
        <code ref={codeRef} className={`hljs language-${lang}`}>
          {codeChildren}
        </code>
      </div>
    </div>
  );
};

const CodeBar = React.memo(
  ({ lang, codeRef }: { lang: string; codeRef: RefObject<HTMLElement> }) => {
    const [isCopied, setIsCopied] = useState<boolean>(false);
    return (
      <div className="flex items-center relative text-gray-200 bg-gray-800 px-4 py-2 text-xs font-sans">
        <span className="">{lang}</span>
        <button
          className="flex ml-auto gap-2"
          onClick={async () => {
            const codeString = codeRef.current?.textContent;
            if (codeString)
              navigator.clipboard.writeText(codeString).then(() => {
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 3000);
              });
          }}
        >
          {isCopied ? (
            <>
              <Checkmark />
              Copied!
            </>
          ) : (
            <>
              <Copy />
              Copy code
            </>
          )}
        </button>
      </div>
    );
  }
);
CodeBar.displayName = 'CodeBar';
export default CodeBlock;
