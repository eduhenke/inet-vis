import React, { useEffect, useMemo } from 'react';
import logo from './logo.svg';
import './App.css';
import { graphviz, GraphvizOptions } from 'd3-graphviz';
import { options } from 'yargs';
import * as monaco from '@monaco-editor/react';
import { loader as monacoLoader, Editor as MonacoEditor } from '@monaco-editor/react';

type INode =
  { type: 'Erase', ports: [string] } |
  { type: 'Root', ports: [string] } |
  { type: 'Dup', ports: [string, string, string] } |
  { type: 'Lam', ports: [string, string, string] } |
  { type: 'App', ports: [string, string, string] };

type INet = INode[];

function nodeType(type: string): INode['type'] {
  switch (type) {
    case 'ERA':
      return 'Erase';
    case 'DUP':
      return 'Dup';
    case 'LAM':
      return 'Lam';
    case 'APP':
      return 'App';
    case 'ROOT':
      return 'Root';
    default:
      throw new Error(`Unknown node type: ${type}`);
  }
}


function parseNode(input: string, typeRegex: RegExp, keys: string[]): INode[] {
  const nodes: INode[] = [];
  let match: RegExpExecArray | null;
  while ((match = typeRegex.exec(input)) !== null) {
    const node: INode = { type: nodeType(match[1]), ports: [match[2]] as any };
    for (let i = 1; i < keys.length; i++) {
      node.ports.push(match[i + 2]);
    }
    nodes.push(node);
  }
  return nodes;
}

function parseINet(input: string): INet {
  const eraseRegex = /(ERA)\s*(\w+)/g;
  const rootRegex = /(ROOT)\s*(\w+)/g;
  const dupRegex = /(DUP)\s*(\w+)\s*(\w+)\s*(\w+)/g;
  const lamRegex = /(LAM)\s*(\w+)\s*(\w+)\s*(\w+)/g;
  const appRegex = /(APP)\s*(\w+)\s*(\w+)\s*(\w+)/g;

  let nodes = [];
  for (const line of input.split('\n')) {
    const eraseNodes = parseNode(line, eraseRegex, ['p0']);
    const rootNodes = parseNode(line, rootRegex, ['p0']);
    const dupNodes = parseNode(line, dupRegex, ['p0', 'p1', 'p2']);
    const lamNodes = parseNode(line, lamRegex, ['p0', 'p1', 'p2']);
    const appNodes = parseNode(line, appRegex, ['p0', 'p1', 'p2']);
    nodes.push(...[...eraseNodes, ...rootNodes, ...dupNodes, ...lamNodes, ...appNodes]);
  }
  return nodes;
}

const tableBorder = 0;
const tableCellBorder = 0;

const downTable = `
[label=<<TABLE BORDER="${tableBorder}" CELLBORDER="${tableCellBorder}" CELLSPACING="0">
  <TR>
    <TD>
      <TABLE BORDER="${tableBorder}" CELLBORDER="${tableCellBorder}" CELLSPACING="0">
        <TR>
          <TD HEIGHT="1" WIDTH="24" FIXEDSIZE="TRUE"></TD>
          <TD PORT="p1" HEIGHT="1" WIDTH="1" FIXEDSIZE="TRUE"></TD>
          <TD HEIGHT="1" WIDTH="50" FIXEDSIZE="TRUE"></TD>
          <TD PORT="p2" HEIGHT="1" WIDTH="1" FIXEDSIZE="TRUE"></TD>
          <TD HEIGHT="1" WIDTH="24" FIXEDSIZE="TRUE"></TD>
        </TR>
      </TABLE>
    </TD>
  </TR>
  <TR>
    <TD>
      <TABLE BORDER="${tableBorder}" CELLBORDER="${tableCellBorder}" CELLSPACING="0">
        <TR>
          <TD HEIGHT="24" WIDTH="50" FIXEDSIZE="TRUE"></TD>
        </TR>
      </TABLE>
    </TD>
  </TR>
  <TR>
    <TD>
      <TABLE BORDER="${tableBorder}" CELLBORDER="${tableCellBorder}" CELLSPACING="0">
        <TR>
          <TD HEIGHT="1" WIDTH="40" FIXEDSIZE="TRUE"></TD>
          <TD PORT="p0" HEIGHT="1" WIDTH="18" FIXEDSIZE="TRUE"></TD>
          <TD HEIGHT="1" WIDTH="42" FIXEDSIZE="TRUE"></TD>
        </TR>
      </TABLE>
    </TD>
  </TR>
</TABLE>>, image="down.svg"]`

const upTable = `
[label=<<TABLE BORDER="${tableBorder}" CELLBORDER="${tableCellBorder}" CELLSPACING="0">
  <TR>
    <TD>
      <TABLE BORDER="${tableBorder}" CELLBORDER="${tableCellBorder}" CELLSPACING="0">
        <TR>
          <TD HEIGHT="1" WIDTH="40" FIXEDSIZE="TRUE"></TD>
          <TD PORT="p0" HEIGHT="1" WIDTH="18" FIXEDSIZE="TRUE"></TD>
          <TD HEIGHT="1" WIDTH="42" FIXEDSIZE="TRUE"></TD>
        </TR>
      </TABLE>
    </TD>
  </TR>
  <TR>
    <TD>
      <TABLE BORDER="${tableBorder}" CELLBORDER="${tableCellBorder}" CELLSPACING="0">
        <TR>
          <TD HEIGHT="24" WIDTH="50" FIXEDSIZE="TRUE"></TD>
        </TR>
      </TABLE>
    </TD>
  </TR>
  <TR>
    <TD>
      <TABLE BORDER="${tableBorder}" CELLBORDER="${tableCellBorder}" CELLSPACING="0">
        <TR>
          <TD HEIGHT="1" WIDTH="24" FIXEDSIZE="TRUE"></TD>
          <TD PORT="p1" HEIGHT="1" WIDTH="1" FIXEDSIZE="TRUE"></TD>
          <TD HEIGHT="1" WIDTH="50" FIXEDSIZE="TRUE"></TD>
          <TD PORT="p2" HEIGHT="1" WIDTH="1" FIXEDSIZE="TRUE"></TD>
          <TD HEIGHT="1" WIDTH="24" FIXEDSIZE="TRUE"></TD>
        </TR>
      </TABLE>
    </TD>
  </TR>
</TABLE>>, image="up.svg"]`;

function generateGraphvizCode(graph: Graph) {
  return  `
  digraph G {
    graph [splines=true, center=true]
    node [shape=none]

    ${graph.nodes
      .filter(node => node.type === 'Root')
      .map(node => `root_${node.idx}:p0 [shape=circle, label="", width=0.3]`).join('\n')}
    ${graph.nodes
        .filter(node => node.type === 'Erase')
        .map(node => `erase_${node.idx}:p0 [shape=underline, label="", height=0, width=0.3]`).join('\n')}
    ${graph.nodes
      .filter(node => node.type === 'Lam')
      .map(node => `lam_${node.idx} ${upTable}`).join('\n')}
    ${graph.nodes
      .filter(node => node.type === 'Dup')
      .map(node => `dup_${node.idx} ${upTable.replace('up.svg', 'up-black.svg')}`).join('\n')}
    ${graph.nodes
      .filter(node => node.type === 'App')
      .map(node => `app_${node.idx} ${downTable}`).join('\n')}
  
    edge [dir=none]

    ${graph.edges.map(([from, to]) =>
      `${from.type.toLocaleLowerCase()}_${from.idx}:p${from.port} -> ${to.type.toLocaleLowerCase()}_${to.idx}:p${to.port} [label="  ${from.label}"]`
    ).join('\n')}

  }`;
}

const defaultOptions: GraphvizOptions = {
  fit: true,
  height: 500,
  width: 500,
  zoom: false,
  engine: 'dot',
};


let counter = 0;
// eslint-disable-next-line no-plusplus
const getId = () => `graphviz${counter++}`;

function INetGraph({ code }: { code: string }) {
  const id = useMemo(getId, []);

  useEffect(() => {
    graphviz(`#${id}`, defaultOptions)
      .addImage('up.svg', '100px', '50px')
      .addImage('up-black.svg', '100px', '50px')
      .addImage('down.svg', '100px', '50px')
      .renderDot(code);
  }, [code]);

  return <div id={id} />;
}

function Editor({ onChange }: { onChange: (code: string) => void }) {
  const defaultValue = "ROOT z\nERA z";

  useEffect(() => {
    onChange(defaultValue);
    monacoLoader.init().then(monaco => {
      const keywords = ['ROOT', 'LAM', 'APP', 'DUP', 'ERA'];
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

function App() {
  const [rawCode, setRawCode] = React.useState<string>('');
  const [graphvizCode, setGraphvizCode] = React.useState<string>('');

  useEffect(() => {
    const inet = parseINet(rawCode);
    const graph = fromINet(inet);
    const code = generateGraphvizCode(graph);
    console.log(code);
    setGraphvizCode(code);
  }, [rawCode]);

  return (
    <div className="App">
        <Editor onChange={setRawCode}/>
        <INetGraph code={graphvizCode} />
    </div>
  );
}

// Placeholder type for GraphNode
interface GraphNode {
  type: INode['type'];
  idx: number;
}

// Placeholder type for Graph
interface Graph {
  nodes: GraphNode[];
  edges: [GraphNode & { port: number, label: string }, GraphNode & { port: number, label: string }][];
}

function fromINet(nodes: INet): Graph {
  const edges: Graph['edges'] = [];

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    for (let j = i; j < nodes.length; j++) {
      const find = nodes[j];

      for (let k = 0; k < node.ports.length; k++) {
        const port = find.ports.findIndex((port, idx) => 
          port === node.ports[k]
          && (i !== j || idx !== k)
        );
        // console.log({ i, j, k, port });

        if (port !== -1) {
          edges.push([
            { type: node.type, idx: i, port: k, label: node.ports[k] },
            { type: find.type, idx: j, port, label: node.ports[k] },
          ]);
        }
      }
    }
  }

  return {
    nodes: nodes.map(({ type }, idx) => ({ type, idx })),
    edges
  };
}

export default App;
