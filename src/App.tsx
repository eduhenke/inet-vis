import React, { useEffect } from 'react';
import { parseINet } from './parser';
import { INet } from './inet';
import { INetGraph } from './INetGraph';
import { Editor } from './Editor';
import SplitterLayout from 'react-splitter-layout';
import 'react-splitter-layout/lib/index.css';

function App() {
  const [rawCode, setRawCode] = React.useState<string>('');
  const [inet, setINet] = React.useState<INet>(parseINet(rawCode));

  useEffect(() => {
    setINet(parseINet(rawCode));
  }, [rawCode]);

  return (
    <SplitterLayout>
      <Editor onChange={setRawCode}/>
      <INetGraph inet={inet} />
    </SplitterLayout>
  );
}

export default App;