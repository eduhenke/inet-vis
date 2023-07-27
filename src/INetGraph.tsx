import { graphviz } from "d3-graphviz";
import { useEffect } from "react";
import { INet, INode } from "./inet";

const tableBorder = 0;
const tableCellBorder = 0;

const singlePortTable = `
<TR>
  <TD>
    <TABLE BORDER="${tableBorder}" CELLBORDER="${tableCellBorder}" CELLSPACING="0">
      <TR>
        <TD HEIGHT="1" WIDTH="1" FIXEDSIZE="TRUE"></TD>
        <TD PORT="p0" HEIGHT="1" WIDTH="1" FIXEDSIZE="TRUE"></TD>
        <TD HEIGHT="1" WIDTH="4" FIXEDSIZE="TRUE"></TD>
      </TR>
    </TABLE>
  </TD>
</TR>
`

const doublePortTable = `
<TR>
  <TD>
    <TABLE BORDER="${tableBorder}" CELLBORDER="${tableCellBorder}" CELLSPACING="0">
      <TR>
        <TD HEIGHT="1" WIDTH="15" FIXEDSIZE="TRUE"></TD>
        <TD PORT="p1" HEIGHT="1" WIDTH="1" FIXEDSIZE="TRUE"></TD>
        <TD HEIGHT="1" WIDTH="33" FIXEDSIZE="TRUE"></TD>
        <TD PORT="p2" HEIGHT="1" WIDTH="1" FIXEDSIZE="TRUE"></TD>
        <TD HEIGHT="1" WIDTH="15" FIXEDSIZE="TRUE"></TD>
      </TR>
    </TABLE>
  </TD>
</TR>
`;

const middleFillerTable = `
<TR>
  <TD>
    <TABLE BORDER="${tableBorder}" CELLBORDER="${tableCellBorder}" CELLSPACING="0">
      <TR>
        <TD HEIGHT="24" WIDTH="1" FIXEDSIZE="TRUE"></TD>
      </TR>
    </TABLE>
  </TD>
</TR>
`;

const downTable = `
[label=<<TABLE BORDER="${tableBorder}" CELLBORDER="${tableCellBorder}" CELLSPACING="0">
  ${doublePortTable}
  ${middleFillerTable}
  ${singlePortTable}
</TABLE>>, image="down.svg"]`

const upTable = `
[label=<<TABLE BORDER="${tableBorder}" CELLBORDER="${tableCellBorder}" CELLSPACING="0">
  ${singlePortTable}
  ${middleFillerTable}
  ${doublePortTable}
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
      `${from.type.toLocaleLowerCase()}_${from.idx}:p${from.port} -> ${to.type.toLocaleLowerCase()}_${to.idx}:p${to.port} // [label="  ${from.label}"]`
    ).join('\n')}

  }`;
}

export function INetGraph({ inet }: { inet: INet }) {
  const graph = fromINet(inet);
  const code = generateGraphvizCode(graph);

  useEffect(() => {
    graphviz(`#graphviz`, {
      fit: true,
      height: 500,
      width: 500,
      zoom: false,
      engine: 'dot',    
    })
      .addImage('up.svg', '100px', '50px')
      .addImage('up-black.svg', '100px', '50px')
      .addImage('down.svg', '100px', '50px')
      .renderDot(code);
  }, [code]);

  return <div id="graphviz" />;
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