import { loader as monacoLoader, Editor as MonacoEditor } from '@monaco-editor/react';
import { useEffect } from 'react';
import { keywords } from './parser';

export function Editor({ onChange }: { onChange: (code: string) => void }) {
  const defaultValue = "ROOT z\nERA z";

  useEffect(() => {
    onChange(defaultValue);
    monacoLoader.init().then(monaco => {
      monaco.languages.register({ id: 'inet' });
      monaco.languages.setMonarchTokensProvider('inet', {
        tokenizer: {
          root: [
            [/\/\/.*/, 'comment'],
            [new RegExp(`(${keywords.join('|')})`), 'keyword'],
          ]
        }
      });
      monaco.languages.registerCompletionItemProvider('inet', {
        provideCompletionItems: () => ({
          suggestions: keywords.map(keyword => ({
            label: keyword,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: keyword,
          }))
        })
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <MonacoEditor
      height="100vh"
      defaultLanguage="inet"
      theme="vs-dark"
      onChange={value => onChange(value ?? '')}
      defaultValue={defaultValue}/>
  );

}