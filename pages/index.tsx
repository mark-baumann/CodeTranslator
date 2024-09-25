import { APIKeyInput } from '@/components/APIKeyInput';
import { CodeBlock } from '@/components/CodeBlock';
import { LanguageSelect } from '@/components/LanguageSelect';
import { ModelSelect } from '@/components/ModelSelect';
import { TextBlock } from '@/components/TextBlock';
import { FileTree } from '@/components/filetree';
import { OpenAIModel, TranslateBody } from '@/types/types';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import JSZip from 'jszip';
import toast, { Toaster } from 'react-hot-toast';

export default function Home() {
  const [inputLanguage, setInputLanguage] = useState<string>('Angular JS');
  const [outputLanguage, setOutputLanguage] = useState<string>('Vue');
  const [inputCode, setInputCode] = useState<string>('');
  const [outputCode, setOutputCode] = useState<string>('');
  const [model, setModel] = useState<OpenAIModel>('gpt-3.5-turbo');
  const [loading, setLoading] = useState<boolean>(false);
  const [hasTranslated, setHasTranslated] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [toastText, setToastText] = useState('');
  const [textboxValue, setTextboxValue] = useState<string>("");

  // Initialisierung der Token- und Kostenanzeige mit Standardwerten
  const [tokenCounts, setTokenCounts] = useState<{
    totalTokens: number;
    totalCost: number;
    fileTokenCounts: { fileName: string; tokenCount: number }[];
  }>({
    totalTokens: 0,
    totalCost: 0.00,
    fileTokenCounts: []
  });

  useEffect(() => {
    const savedTextboxValue = localStorage.getItem("textboxValue");
    if (savedTextboxValue !== null) {
      setTextboxValue(savedTextboxValue);
    }
  }, []);

  useEffect(() => {
    const savedApiKey = localStorage.getItem('apiKey');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  useEffect(() => {
    if (hasTranslated) {
      handleTranslate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outputLanguage]);

  const updateCount = (totalLength: number, index: number) => {
    toast(`Dokument Nummer ${index} von ${totalLength} wird übersetzt`);
  };

  const handleTranslateZIP = async (obj: any) => {
    const maxCodeLength = model === 'gpt-3.5-turbo' ? 6000 : 12000;

    setLoading(true);
    setOutputCode('');

    const controller = new AbortController();

    const body: TranslateBody = {
      inputLanguage,
      outputLanguage,
      inputCode: obj.content,
      model,
      apiKey,
      textboxValue
    };

    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      setLoading(false);
      alert('Etwas ist schief gelaufen.');
      return;
    }

    const data = response.body;

    if (!data) {
      setLoading(false);
      alert('Etwas ist schief gelaufen.');
      return;
    }

    const reader = data.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let code = '';

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);
      code += chunkValue;
    }
    setLoading(false);
    setHasTranslated(true);
    copyToClipboard(code);

    return { name: obj.name, content: code };
  };

  const downloadZipFiles = async (promises: Promise<any>[]) => {
    const zip = new JSZip();

    const files = await Promise.all(promises);

    for (const file of files) {
      zip.file(file.name, file.content);
    }

    zip.generateAsync({ type: 'blob' })
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'translated_files.zip';
        link.click();
      });
  };

  const handleTranslate = async () => {
    const maxCodeLength = model === 'gpt-3.5-turbo' ? 6000 : 12000;

    setLoading(true);
    setOutputCode('');

    const controller = new AbortController();

    const body: TranslateBody = {
      inputLanguage,
      outputLanguage,
      inputCode,
      model,
      apiKey,
      textboxValue
    };

    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      setLoading(false);
      alert('Etwas ist schief gelaufen.');
      return;
    }

    const data = response.body;

    if (!data) {
      setLoading(false);
      alert('Etwas ist schief gelaufen.');
      return;
    }

    const reader = data.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let code = '';

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);
      code += chunkValue;
      setOutputCode((prevCode) => prevCode + chunkValue);
    }

    setLoading(false);
    setHasTranslated(true);
    copyToClipboard(code);
  };

  const copyToClipboard = (text: string) => {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  };

  const filechange = async (event: any) => {
    const file = event.target.files?.[0];
    setSelectedFile(file);

    if (file) {
      setLoading(true);
      setTokenCounts({
        totalTokens: 0,
        totalCost: 0.00,
        fileTokenCounts: []
      }); // Zurücksetzen der Token-Anzahlen

      const filesWithContent = await readZipFiles(file);

      if (filesWithContent.length === 0) {
        setLoading(false);
        alert('Keine Dateien zum Analysieren gefunden.');
        return;
      }

      // Schritt 1: Token- und Kostenberechnung
      try {
        const tokenResponse = await fetch('/api/tokenCount', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ files: filesWithContent, model }),
        });

        if (!tokenResponse.ok) {
          throw new Error('Fehler beim Abrufen der Token-Anzahl');
        }

        const tokenData = await tokenResponse.json();
        setTokenCounts(tokenData);
      } catch (error) {
        console.error(error);
        alert('Fehler bei der Berechnung der Token-Anzahl');
      }

      setLoading(false);
    }
  };

  const inputStyle = {
    border: '1px solid black',
    borderRadius: '5px',
    padding: '10px',
    fontSize: '16px',
    width: '100%',
    height: '300px',
    color: 'black',
  };

  const mobileStyle = `
    @media only screen and (max-width: 600px) {
      textarea {
        max-width: 100%;
      }
    }
  `;

  const readZipFiles = async (file: any) => {
    try {
      const zip = await JSZip.loadAsync(file);
      const files: { name: string; content: string }[] = [];

      for (const relativePath in zip.files) {
        const file = zip.files[relativePath];
        if (file.dir) continue; // Ignoriere Verzeichnisse
        const content = await file.async("text");

        if (content == null || content.trim() === "") {
          continue;
        }
        files.push({ name: relativePath, content: content });
      }

      return files;
    } catch (error) {
      console.error('Fehler beim Lesen der ZIP-Datei:', error);
      alert('Fehler beim Lesen der ZIP-Datei.');
      return [];
    }
  };

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    localStorage.setItem('apiKey', value);
  };

  const handleTextboxChange = (event: any) => {
    const value = event.target.value;
    localStorage.setItem('textboxValue', value);
    setTextboxValue(value);
  };

  const send = async (event: any) => {
    const file = selectedFile;

    if (!file) {
      alert('Bitte wähle eine ZIP-Datei aus.');
      return;
    }

    setLoading(true);
    const filesWithContent = await readZipFiles(file);

    if (filesWithContent.length === 0) {
      setLoading(false);
      alert('Keine Dateien zum Übersetzen gefunden.');
      return;
    }

    const totalLength = filesWithContent.length;

    let array: any[] = [];
    let index = 0;

    // Schritt 2: Übersetzung der Dateien
    for (let i = 0; i < filesWithContent.length; i++) {
      const file = filesWithContent[i];
      const translatedObj = await handleTranslateZIP(file);

      // Sicherstellen, dass obj nicht undefined ist
      if (translatedObj) {
        console.log(translatedObj);
        array.push(translatedObj);
      } else {
        console.error("Übersetzung fehlgeschlagen oder undefined für:", file);
      }

      index++;
      updateCount(totalLength, index);
    }

    // Schritt 3: Übersetzte ZIP-Datei herunterladen
    downloadZipFiles(array);
    setLoading(false);
  };

  return (
    <>
      <Head>
        <title>Code Translator</title>
        <meta
          name="description"
          content="Verwenden Sie KI, um Code von einer Sprache in eine andere zu übersetzen."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{mobileStyle}</style>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex h-full min-h-screen flex-col items-center bg-[#FFFFFF] px-4 pb-20 text-neutral-200 sm:px-10">
        <div className="mt-10 flex flex-col items-center justify-center sm:mt-20">
          <div className="text-4xl font-bold">CIB CodeTranslator</div>
          <img src="https://upload.wikimedia.org/wikipedia/de/8/81/CIB_Logo_RGB.jpg" width="200px" height="200px" alt="CIB Logo" />
        </div>

        <div className="mt-6 text-center text-sm">
          <APIKeyInput apiKey={apiKey} onChange={handleApiKeyChange} />
        </div>

        <div className="mt-2 flex items-center space-x-2">
          <ModelSelect model={model} onChange={(value) => setModel(value as OpenAIModel)} />
          <button
            className="w-[140px] cursor-pointer rounded-md bg-red-600 px-4 py-2 font-bold border-black text-black"
            onClick={() => handleTranslate()}
            disabled={loading}
          >
            {loading ? 'Translating...' : 'Translate'}
          </button>
        </div>

        <div className="mt-2 text-center text-xs">
          {loading
            ? 'Translating...'
            : hasTranslated
            ? 'Output copied to clipboard!'
            : ""}
        </div>
        <br />
        <h1>Einzelne Klassen, Methoden, etc. übersetzen...</h1>
        <div className="mt-6 flex w-full max-w-[1200px] flex-col justify-between sm:flex-row sm:space-x-4">
          <div className="h-100 flex flex-col justify-center space-y-2 sm:w-2/4">
            <div className="text-center text-xl font-bold">Input</div>

            <LanguageSelect
              language={inputLanguage}
              onChange={(value) => {
                setInputLanguage(value);
                setHasTranslated(false);
                setInputCode('');
                setOutputCode('');
              }}
            />

            {inputLanguage === 'Natural Language' ? (
              <TextBlock
                text={inputCode}
                editable={true}
                onChange={(value) => {
                  setInputCode(value);
                  setHasTranslated(false);
                }}
              />
            ) : (
              <CodeBlock
                code={inputCode}
                editable={true}
                onChange={(value) => {
                  setInputCode(value);
                  setHasTranslated(false);
                }}
              />
            )}
          </div>
          <div className="mt-8 flex h-full flex-col justify-center space-y-2 sm:mt-0 sm:w-2/4">
            <div className="text-center text-xl font-bold">Output</div>

            <LanguageSelect
              language={outputLanguage}
              onChange={(value) => {
                setOutputLanguage(value);
                setOutputCode('');
              }}
            />

            {outputLanguage === 'Natural Language' ? (
              <TextBlock text={outputCode} />
            ) : (
              <CodeBlock code={outputCode} />
            )}
          </div>
        </div>
        <br /><p>Ganze ZIP Ordner übersetzen ...</p><br />
        <br />

        <div className="flex flex-col items-center">
          <input type="file" accept=".zip" onChange={filechange} /> <br />
          <div>
            <FileTree file={selectedFile} />
          </div>
        </div>

        {/* Anzeige der Token und Kosten immer sichtbar */}
        <div className="mt-4 p-4 bg-gray-100 text-black rounded-md w-full max-w-[600px]">
          <h2 className="text-xl font-bold mb-2">Token und Kosten</h2>
          <p><strong>Gesamte Tokens:</strong> {tokenCounts.totalTokens}</p>
          <p><strong>Gesamte Kosten:</strong> ${tokenCounts.totalCost.toFixed(4)}</p>
          <h3 className="mt-2 font-semibold">Tokens pro Datei:</h3>
          <ul className="list-disc list-inside">
            {tokenCounts.fileTokenCounts.length > 0 ? (
              tokenCounts.fileTokenCounts.map((file) => (
                <li key={file.fileName}>
                  {file.fileName}: {file.tokenCount} Tokens
                </li>
              ))
            ) : (
              <li>Keine Dateien analysiert.</li>
            )}
          </ul>
        </div>
        <br />

        <textarea
          placeholder="Besonderheiten für Übersetzung..."
          value={textboxValue}
          style={inputStyle}
          onChange={handleTextboxChange}
        />

        <br />
        {/* Anzeige der Token und Kosten */}

        <button
          type='button'
          className="w-[140px] cursor-pointer rounded-md bg-red-600 px-4 py-2 font-bold border-black text-black"
          onClick={send}
          disabled={loading}
        >
          {loading ? 'Translating...' : 'Translate ZIP '}
        </button>

        <Toaster />
      </div>
    </>
  );
}