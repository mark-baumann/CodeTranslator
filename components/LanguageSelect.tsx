import type { FC } from 'react';
import config from '../config.json';

interface Props {
  language: string;
  onChange: (language: string) => void;
}

export const LanguageSelect: FC<Props> = ({ language, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  const { languages } = config;

  return (
    <select
      className="w-full rounded-md bg-[#1F2937] px-4 py-2 text-white"
      value={language}
      onChange={handleChange}
    >
      {languages
        .sort((a, b) => a.label.localeCompare(b.label))
        .map((language) => (
          <option key={language.value} value={language.value} className="text-white">
            {language.label}
          </option>
        ))}
    </select>
  );
};
