'use client';

import { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';

export default function Diagram() {
    const cyRef = useRef(null);

    useEffect(() => {
        const cy = cytoscape({
        container: cyRef.current,
        style: [
            {
            selector: 'node',
            style: {
                shape: 'roundrectangle',
                'background-color': '#1e293b',
                'label': 'data(label)',
                'text-valign': 'center',
                'text-halign': 'center',
                'color': '#f8fafc',
                'text-wrap': 'wrap',
                'text-max-width': 120,
                'font-size': 14,
                'text-outline-width': 1,
                'text-outline-color': '#1e293b',
                'padding': '12px',
                'width': 'label',
                'height': 'label',
                'border-width': 1,
                'border-color': '#38bdf8',
                'transition-property': 'opacity',
                'transition-duration': '0.8s',
                'opacity': 1,
            }
            },
            {
            selector: 'node.hidden',
            style: {
                'opacity': 0,
            }
            },
            {
            selector: 'edge',
            style: {
                width: 2,
                'line-color': '#94a3b8',
                'target-arrow-color': '#94a3b8',
                'target-arrow-shape': 'triangle',
                'curve-style': 'bezier',
                'source-endpoint': 'outside-to-node',
                'target-endpoint': 'outside-to-node'
            }
            },
            {
            selector: 'edge.highlighted',
            style: {
                'line-color': '#f43f5e',
                'target-arrow-color': '#f43f5e',
                'width': 4
            }
            }
        ],
        elements: [],
        layout: {
            name: 'preset'
        }
        });

        // Manual positions for each node
        const nodePositions = {
        attacker: { x: 100, y: 300 },
        tool: { x: 100, y: 100 },
        basicForwarder: { x: 500, y: 150 },
        multicall: { x: 300, y: 300 },
        naiveReceiverPool: { x: 250, y: 450 },
        flashLoanReceiver: { x: 500, y: 500 }
        };

        const nodesWithParents = [
        {
            node: {
            id: 'attacker',
            label: 'Attacker\n(Origin)',
            position: nodePositions.attacker
            }
        },
        {
            node: {
            id: 'tool',
            label: 'Tool\nExecutor',
            position: nodePositions.tool
            },
            edge: { id: 'e1', source: 'attacker', target: 'tool', label: 'Calculate pool + receiver funds' }
        },
        {
            node: {
            id: 'basicForwarder',
            label: 'BasicForwarder',
            position: nodePositions.basicForwarder
            },
            edge: { id: 'e2', source: 'tool', target: 'basicForwarder' }
        },
        {
            node: {
            id: 'multicall',
            label: 'Multicall',
            position: nodePositions.multicall
            },
            edge: { id: 'e4', source: 'tool', target: 'multicall' }
        },
        {
            node: {
            id: 'naiveReceiverPool',
            label: 'NaiveReceiverPool',
            position: nodePositions.naiveReceiverPool
            },
            edge: { id: 'e5', source: 'tool', target: 'naiveReceiverPool' }
        },
        {
            node: {
            id: 'flashLoanReceiver',
            label: 'FlashLoanReceiver',
            position: nodePositions.flashLoanReceiver
            },
            edge: { id: 'e3', source: 'naiveReceiverPool', target: 'flashLoanReceiver' }
        }
        ];

        const delay = 3600;

        nodesWithParents.forEach(({ node, edge }, i) => {
        // Add node with preset position, initially hidden
        cy.add({
            data: { id: node.id, label: node.label },
            position: node.position,
            classes: 'hidden'
        });

        setTimeout(() => {
            // Reveal node
            const n = cy.getElementById(node.id);
            n.removeClass('hidden');

            // Add edge if it exists
            if (edge) {
            cy.add({ data: edge });
            }
        }, delay * i);
        });
        /*
        // Edge hover effect
        cy.on('mouseover', 'edge', (evt) => {
        evt.target.addClass('highlighted');
        });
        cy.on('mouseout', 'edge', (evt) => {
        evt.target.removeClass('highlighted');
        });
        */

        return () => cy.destroy();
    }, []);

    return (
        <div
        className="w-full h-[600px] bg-[#0C0C0C] bg-[radial-gradient(circle,_#1e293b_1px,_transparent_1px)] [background-size:20px_20px] rounded-lg shadow-md"
        ref={cyRef}
        ></div>
    );
}
