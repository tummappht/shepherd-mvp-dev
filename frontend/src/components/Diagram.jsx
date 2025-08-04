// src/components/Diagram.jsx
"use client";
import CytoscapeComponent from "react-cytoscapejs";
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";

cytoscape.use(dagre);


export default function Diagram() {
    const elements = [
        { data: { id: 'planner', label: 'Planner', group: 'main' } },
        { data: { id: 'executor', label: 'Executor', group: 'quant' } },
        { data: { id: 'reflector', label: 'Reflector', group: 'scout' } },
        { data: { id: 'reporter', label: 'Reporter', group: 'scout-highlight' } },

        { data: { source: 'planner', target: 'executor' } },
        { data: { source: 'executor', target: 'reflector' } },
        { data: { source: 'reflector', target: 'reporter' } },
    ];

    return (
        <div style={{ width: "100%", height: "600px", background: "#0b0b0b" }}>
            <CytoscapeComponent
                elements={elements}
                style={{ width: "100%", height: "100%" }}
                layout={{ name: 'dagre' }}
                stylesheet={[
                    {
                        selector: 'node',
                        style: {
                            'label': 'data(label)',
                            'text-wrap': 'wrap',
                            'text-max-width': 100,
                            'font-size': '12px',
                            'text-valign': 'center',
                            'text-halign': 'center',
                            'shape': 'roundrectangle',
                            'padding': '10px',
                            'width': 'label',
                            'height': 'label',
                            'color': '#fff',
                            'background-color': '#222',
                            'border-width': 2,
                            'border-color': '#444',
                            'box-shadow': '0 0 6px #000',
                        }
                    },
                    {
                        selector: 'node[group="main"]',
                        style: {
                            'background-color': '#4a4a8a',
                            'border-color': '#6f6fdd',
                            'box-shadow': '0 0 10px #6f6fdd',
                        }
                    },
                    {
                        selector: 'node[group="quant"]',
                        style: {
                            'background-color': '#b2852f',
                            'border-color': '#ffc04d',
                            'box-shadow': '0 0 10px #ffc04d',
                        }
                    },
                    {
                        selector: 'node[group="scout"]',
                        style: {
                            'background-color': '#2f6a8a',
                            'border-color': '#4dbfff',
                            'box-shadow': '0 0 10px #4dbfff',
                        }
                    },
                    {
                        selector: 'node[group="scout-highlight"]',
                        style: {
                            'background-color': '#20b2aa',
                            'border-color': '#7fffd4',
                            'box-shadow': '0 0 10px #7fffd4',
                        }
                    },
                    {
                        selector: 'edge',
                        style: {
                            'width': 2,
                            'line-color': '#888',
                            'target-arrow-color': '#888',
                            'target-arrow-shape': 'triangle',
                            'curve-style': 'bezier',
                        }
                    }
                ]}
            />
        </div>
    );
}
