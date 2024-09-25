import { StreamLanguage } from '@codemirror/language';
import { go } from '@codemirror/legacy-modes/mode/go';
import CodeMirror from '@uiw/react-codemirror';
import { FC, useEffect, useState } from 'react';
import {smoothy} from 'thememirror';
interface Props {
  code: string;
  editable?: boolean;
  onChange?: (value: string) => void;
  fileName?: string;
}

export const CodeBlock: FC<Props> = ({
  code,
  editable = false,
  onChange = () => {},
  fileName,
}) => {
  const [copyText, setCopyText] = useState<string>('Copy');

  useEffect(() => {
    const timeout = setTimeout(() => {
      setCopyText('Copy');
    }, 2000);

    return () => clearTimeout(timeout);
  }, [copyText]);

  return (
    <div className="relative">
      <button
        className="absolute right-0 top-0 z-10 rounded bg-[#1A1B26] p-1 text-xs text-white hover:bg-[#2D2E3A] active:bg-[#2D2E3A]"
        onClick={() => {
          navigator.clipboard.writeText(code!);
          setCopyText('Copied!');
        }}
      >
        {copyText}
      </button>

      {fileName && (
        <div className="text-sm font-medium text-gray-400">{fileName}</div>
      )}

      <CodeMirror
        editable={editable}
        value={code}
        minHeight="500px"
        extensions={[StreamLanguage.define(go)]}
        theme={smoothy}
        onChange={(value) => onChange(value)}
      />
    </div>
  );
};
