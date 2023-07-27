import { INet, INode, PortLabel, nodeDirection } from "./inet";

const keywordsTable = {
  'ERA': 'Erase',
  'DUP': 'Dup',
  'LAM': 'Lam',
  'APP': 'App',
  'ROOT': 'Root'
} as const;

type Keyword = keyof typeof keywordsTable;
export const keywords: Keyword[] = Object.keys(keywordsTable) as any;

type Context = {
  _hiddenLabelCounter: number
};

function parseNode(context: Context, input: string, typeRegex: RegExp): INode[] {
  function nodeTypeFromKeyword(type: string): INode['type'] {
    if (!(type in keywordsTable)) throw new Error(`Unknown node type: ${type}`);
    return keywordsTable[type as Keyword];
  }
  const nodes: INode[] = [];
  let match: RegExpExecArray | null;
  while ((match = typeRegex.exec(input)) !== null) {
    const [, keyword, ...ports] = match;
    const type = nodeTypeFromKeyword(keyword);

    let newNodesAbove: INode[] = [];
    let newNodesBelow: INode[] = [];
    const currentNodePorts: PortLabel[] = ports;

    for (let i = 0; i < ports.length; i++) {
      const port = ports[i];
      if (port !== '*')
        continue;

      const hiddenLabel = context._hiddenLabelCounter++;
      currentNodePorts[i] = hiddenLabel;

      const newEraseNode: INode = {
        type: 'Erase',
        ports: [hiddenLabel]
      }

      switch (nodeDirection(type, i)) {
        case 'up':
          newNodesAbove.push(newEraseNode);
          break;
        case 'down':
        case 'any':
          newNodesBelow.push(newEraseNode);
      }
    }
    nodes.push(...[
      ...newNodesAbove,
      {
        type,
        ports: currentNodePorts as any,
      },
      ...newNodesBelow
    ]);
  }
  return nodes;
}

const onePortRegex = /(ERA|ROOT)\s*(\w+|\*)/g;
const threePortRegex = /(DUP|LAM|APP)\s*(\w+|\*)\s*(\w+|\*)\s*(\w+|\*)/g;

export function parseINet(input: string): INet {
  // Use a counter object to pass by reference
  let context: Context = { _hiddenLabelCounter: 0 };
  return input.split('\n').flatMap(line =>
    [
      ...parseNode(context, line, onePortRegex),
      ...parseNode(context, line, threePortRegex)
    ]
  );
}
