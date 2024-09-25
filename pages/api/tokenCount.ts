// pages/api/tokenCount.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import openaiTokenCounter from 'openai-gpt-token-counter'; // Stelle sicher, dass diese Bibliothek installiert ist

type TokenCountResponse = {
  totalTokens: number;
  totalCost: number;
  fileTokenCounts: { fileName: string; tokenCount: number }[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TokenCountResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { files, model } = req.body;

  console.log('Files:', files);
  console.log('Model:', model);

  if (!files || !Array.isArray(files)) {
    res.status(400).json({ error: 'Invalid request body' });
    return;
  }

  if (!model) {
    res.status(400).json({ error: 'Model is required' });
    return;
  }

  // Aktualisierte Preisstruktur basierend auf OpenAI Preistabelle
  const pricing: { [key: string]: number } = {
    'gpt-3.5-turbo': 0.002,    // Beispielpreis: $0.002 pro 1k Tokens
    'gpt-4': 0.03,              // Beispielpreis: $0.03 pro 1k Tokens
    'gpt-4o-mini': 0.015,       // Beispielpreis: $0.015 pro 1k Tokens
    'o1-preview': 0.015,        // Beispielpreis: $0.015 pro 1k Tokens
    'o1-mini': 0.003            // Beispielpreis: $0.003 pro 1k Tokens
    // Füge weitere Modelle und deren Preise hier hinzu, falls erforderlich
  };

  const costPerThousandTokens = pricing[model];

  if (costPerThousandTokens === undefined) {
    res.status(400).json({ error: 'Unsupported model' });
    return;
  }

  let totalTokens = 0;
  const fileTokenCounts: { fileName: string; tokenCount: number }[] = [];

  try {
    files.forEach((file: { name: string; content: string }) => {
      // Verwende die text-Methode für reine Texte oder Code
      const tokens = openaiTokenCounter.text(file.content, model);
      totalTokens += tokens;
      fileTokenCounts.push({ fileName: file.name, tokenCount: tokens });
    });

    const totalCost = (totalTokens / 1000) * costPerThousandTokens;

    res.status(200).json({ totalTokens, totalCost, fileTokenCounts });
  } catch (error) {
    console.error('Error during token counting:', error);
    res.status(500).json({ error: 'Fehler bei der Token-Zählung' });
  }
}
