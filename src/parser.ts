import { INet, INode } from "./inet";

const keywordsTable = {
  'ERA': 'Erase',
  'DUP': 'Dup',
  'LAM': 'Lam',
  'APP': 'App',
  'ROOT': 'Root'
} as const;

type Keyword = keyof typeof keywordsTable;
export const keywords: Keyword[] = Object.keys(keywordsTable) as any;

function parseNode(input: string, typeRegex: RegExp, keys: string[]): INode[] {
  function nodeTypeFromKeyword(type: string): INode['type'] {
    if (!(type in keywordsTable)) throw new Error(`Unknown node type: ${type}`);
    return keywordsTable[type as Keyword];
  }
  const nodes: INode[] = [];
  let match: RegExpExecArray | null;
  while ((match = typeRegex.exec(input)) !== null) {
    const [, keyword, ...ports] = match;
    nodes.push({
      type: nodeTypeFromKeyword(keyword),
      ports: ports as any
    });
  }
  return nodes;
}

const onePortRegex = /(ERA|ROOT)\s*(\w+)/g;
const threePortRegex = /(DUP|LAM|APP)\s*(\w+)\s*(\w+)\s*(\w+)/g;

export function parseINet(input: string): INet {
  return input.split('\n').flatMap(line =>
    [
      ...parseNode(line, onePortRegex, ['p0']),
      ...parseNode(line, threePortRegex, ['p0', 'p1', 'p2'])
    ]
  );
}
