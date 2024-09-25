// components/ModelSelect.tsx
import React from 'react';
import { OpenAIModel } from '@/types/types';

interface ModelSelectProps {
  model: OpenAIModel;
  onChange: (value: OpenAIModel) => void;
}

export const ModelSelect: React.FC<ModelSelectProps> = ({ model, onChange }) => {
  return (
    <select
      value={model}
      onChange={(e) => onChange(e.target.value as OpenAIModel)}
      className="border border-gray-300 rounded-md p-2"
    >
      <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
      <option value="gpt-4">GPT-4</option>
      <option value="gpt-4o-mini">GPT-4o Mini</option>
      <option value="o1-preview">O1 Preview</option>
      <option value="o1-mini">O1 Mini</option>
    </select>
  );
};