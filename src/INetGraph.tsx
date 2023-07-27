import { graphviz } from "d3-graphviz";
import { useEffect, useState } from "react";
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

// Same font as in Editor
const fontname = 'Menlo, Monaco, monospace';

function generateGraphvizCode(graph: Graph, showLabels: boolean) {
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

    ${graph.edges.map(([from, to]) => {
      const formatPort = (port: GraphPort) => `${port.type.toLocaleLowerCase()}_${port.idx}:p${port.port}`;
      const connection = `${formatPort(from)} -> ${formatPort(to)}`;
      return showLabels
        ? `${connection} [label="  ${from.label}", fontname="${fontname}}"]`
        : connection;
    }).join('\n')}

  }`;
}

export function INetGraph({ inet }: { inet: INet }) {
  const [showLabels, setShowLabels] = useState<boolean>(false);
  const graph = fromINet(inet);
  const code = generateGraphvizCode(graph, showLabels);

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

  return <div>
    <div id="graphviz" />
    <div style={{
      position: 'absolute',
      bottom: 10,
      right: 10,
    }}>
      <input
        type="checkbox"
        checked={showLabels}
        onChange={e => setShowLabels(e.target.checked)}
        />
      <label>Show labels</label>
    </div>
  </div>;
}

// Placeholder type for GraphNode
interface GraphNode {
  type: INode['type'];
  idx: number;
}

type GraphPort = GraphNode & { port: number, label: string }

// Placeholder type for Graph
interface Graph {
  nodes: Array<GraphNode>;
  edges: Array<[GraphPort, GraphPort]>;
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