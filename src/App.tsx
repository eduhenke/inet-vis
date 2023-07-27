import React, { useEffect } from 'react';
import { parseINet } from './parser';
import { INet } from './inet';
import { INetGraph } from './INetGraph';
import { Editor } from './Editor';

function App() {
  const [rawCode, setRawCode] = React.useState<string>('');
  const [inet, setINet] = React.useState<INet>(parseINet(rawCode));

  useEffect(() => {
    setINet(parseINet(rawCode));
  }, [rawCode]);

  return (
    <div style={{ display: "flex" }}>
      <Editor onChange={setRawCode}/>
      <INetGraph inet={inet} />
    </div>
  );
}

export default App;