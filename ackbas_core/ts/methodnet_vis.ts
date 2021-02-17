import * as vis from "vis-network/standalone";
import {KnowledgeGraphData, SolutionGraphData} from "./methodnet_data";

let knowledgeGraphNetwork: vis.Network
let knowledgeGraphNetworkData: {
    nodes: vis.DataSetNodes,
    edges: vis.DataSetEdges
}

let solutionGraphNetwork: vis.Network
let solutionGraphNetworkData: {
    nodes: vis.DataSetNodes,
    edges: vis.DataSetEdges
}

let typeToId: Record<string, number> = {}
let methodToId: Record<string, number> = {}
let edgeIds: [string, string, number][] = []

export function initKnowledgeGraph(div: HTMLElement) {
    let knowledgeGraphOptions: vis.Options = {
        physics: {
            barnesHut: {
                avoidOverlap: 0.1, // default 0
                springConstant: 0.002,  // default 0.04
                springLength: 50, // default 95
                centralGravity: 0.1,
                gravitationalConstant: -3000
            }
        },
        autoResize: true,
        height: "100%"
    }

    let knowledgeGraphContainer = document.getElementById('knowledge-graph')
    knowledgeGraphNetworkData = {
        nodes: new vis.DataSet([]) as vis.DataSetNodes,
        edges: new vis.DataSet([]) as vis.DataSetEdges
    }
    knowledgeGraphNetwork = new vis.Network(knowledgeGraphContainer, knowledgeGraphNetworkData, knowledgeGraphOptions);
}

export function initSolutionGraph(div: HTMLElement) {
    let solutionGraphOptions: vis.Options = {
        physics: {
            barnesHut: {
                avoidOverlap: 0.1, // default 0
                springConstant: 0.01,  // default 0.04
                springLength: 50, // default 95
                centralGravity: 0.01, // default 0.3
                gravitationalConstant: -300 // default -2000
            }
        },
        autoResize: true,
        height: "100%"
    }

    let solutionGraphContainer = document.getElementById('solution-graph')
    solutionGraphNetworkData = {
        nodes: new vis.DataSet([]) as vis.DataSetNodes,
        edges: new vis.DataSet([]) as vis.DataSetEdges
    }
    solutionGraphNetwork = new vis.Network(solutionGraphContainer, solutionGraphNetworkData, solutionGraphOptions);
    let solutionGraphCanvas = solutionGraphContainer.getElementsByClassName('vis-network')[0].getElementsByTagName('canvas')[0]
    solutionGraphCanvas.setAttribute('tabindex','1')
    solutionGraphCanvas.addEventListener('keydown', ev => {
        if (ev.key == 'f') {
            solutionGraphNetwork.getSelectedNodes().forEach((value) => {
                solutionGraphNetworkData.nodes.update({
                    id: value,
                    fixed: {
                        x: true,
                        y: true
                    }
                })
            })
        } else if (ev.key == 'r') {
            solutionGraphNetwork.getSelectedNodes().forEach((value) => {
                solutionGraphNetworkData.nodes.update({
                    id: value,
                    fixed: {
                        x: false,
                        y: false
                    }
                })
            })
        }
    });
}

export function setKnowledgeGraphData(graphData: KnowledgeGraphData) {
    let nodes = knowledgeGraphNetworkData.nodes
    let edges = knowledgeGraphNetworkData.edges

    for (let type of graphData.types) {
        let newNode: vis.Node = {
            label: type.name,
            title: `<pre><code>${type.yaml}</code></pre>`,
            shape: "ellipse",
            color: {
                border: '#64b14b',
                background: '#82e760'
            }
        }
        let [id] = nodes.add(newNode)
        typeToId[type.name] = id as number
    }

    for (let method of graphData.methods) {
        let newNode: vis.Node = {
            label: method.name,
            title: `<pre><code>${method.yaml}</code></pre>`,
            shape: "box",
            color: {
                background: '#e6f0ff'
            }
        }
        let [id] = nodes.add(newNode)
        methodToId[method.name] = id as number
    }

    for (let [name1, name2] of graphData.connections) {
        let fromId = typeToId[name1] ?? methodToId[name1]
        let toId = typeToId[name2] ?? methodToId[name2]

        let newEdge: vis.Edge = {
            from: fromId,
            to: toId,
            arrows: "to",
            color: "black",
            // @ts-ignore
            smooth: {
                enabled: false
            }
        }
        let [id] = edges.add(newEdge)
        edgeIds.push([name1, name2, id as number])
    }

    knowledgeGraphNetwork.stabilize()
}

export function setSolutionGraphData(graphData: SolutionGraphData) {
    let nodes = solutionGraphNetworkData.nodes
    let edges = solutionGraphNetworkData.edges

    edges.clear()
    nodes.clear()

    let nr_start_nodes = graphData.objects.filter(it => it.is_start).length
    let nr_end_nodes = graphData.objects.filter(it => !it.is_start && it.is_end).length

    let start_i = 0
    let end_i = 0

    let H_SPACE = 500
    let V_SPACE = 250

    let maxDistanceToStart = graphData.objects.filter(value => value.is_end).map(value => value.distance_to_start).reduce((a, b) => Math.max(a,b))

    for (let ao of graphData.objects) {
        let newNode: vis.Node = {
            id: ao.id,
            label: "     " + ao.name + "     ",
            title: '<b>' + ao.type + '</b><br>' + dictToTooltip(ao.params),
            shape: "ellipse"
        }

        if (ao.is_start) {
            newNode.color = {
                border: '#b04a9e',
                background: '#a0d5e5'
            }
            newNode.borderWidth = 4
            newNode.fixed = true
            newNode.x = (start_i - (nr_start_nodes - 1)/2)*H_SPACE
            start_i++
            newNode.y = 0
        } else if (ao.is_end) {
            newNode.color = {
                border: '#64b14b',
                background: '#a0d5e5'
            }
            newNode.borderWidth = 4
            newNode.fixed = true
            newNode.x = (end_i - (nr_end_nodes - 1)/2)*H_SPACE
            end_i++
            newNode.y = maxDistanceToStart*V_SPACE
        } else {
            if (ao.on_solution_path) {
                newNode.color = {
                    border: '#4393a4',
                    background: '#a0d5e5'
                }
            } else {
                newNode.color = {
                    border: '#a56750',
                    background: '#a0d5e5'
                }
                newNode.borderWidth = 4
            }
        }

        nodes.add(newNode)
    }

    for (let method of graphData.methods) {
        let methodNode: vis.Node = {
            id: method.id,
            label: method.name,
            shape: "box",
            color: {
                background: '#e6f0ff'
            },
            title: method.description ?? undefined
        }

        nodes.add(methodNode)

        for (let port of method.inputs) {
            let portNode: vis.Node = {
                id: port.id,
                label: port.name,
                title: dictToTooltip(port.constraints),
                shape: "dot",
                size: 4,
                color: (port.tune ?? false) ? {
                    border: '#a770b3',
                    background: '#ed9eff'
                } : {
                    border: '#b6be77',
                    background: '#f4ff9e'
                }
            }

            nodes.add(portNode)

            edges.add({
                from: port.id,
                to: method.id,
                color: 'black',
                arrows: 'to',
                // @ts-ignore
                smooth: {
                    enabled: false
                }
            })
        }

        for (let output_option of method.outputs) {
            let demux_id

            if (method.outputs.length > 1) {
                let demux: vis.Node = {
                    id: graphData.nextId,
                    shape: "square",
                    color: {
                        background: "black",
                        border: "black"
                    },
                    size: 10
                }
                nodes.add(demux)
                graphData.nextId++

                edges.add({
                    from: method.id,
                    to: demux.id,
                    color: 'black',
                    arrows: 'to',
                    // @ts-ignore
                    smooth: {
                        enabled: false
                    }
                })

                demux_id = demux.id
            } else {
                demux_id = method.id
            }

            for (let port of output_option) {
                let portNode: vis.Node = {
                    id: port.id,
                    label: port.name,
                    title: dictToTooltip(port.constraints),
                    shape: "dot",
                    size: 4,
                    color: {
                        border: '#42cb52',
                        background: '#bef7c5'
                    }
                }

                nodes.add(portNode)

                edges.add({
                    from: demux_id,
                    to: port.id,
                    color: 'black',
                    arrows: 'to',
                    // @ts-ignore
                    smooth: {
                        enabled: false
                    }
                })
            }
        }
    }


    for (let con of graphData.connections) {
        let newEdge: vis.Edge = {
            //id: edge.id,
            from: con.fromId,
            to: con.toId,
            color: 'black',
            arrows: 'to',
            // @ts-ignore
            smooth: {
                enabled: false
            }
        }
        edges.add(newEdge)
    }

    solutionGraphNetwork.stabilize()
}

function dictToTooltip(dict: object): string {
    let tooltip = ""
    for (let [param_name, param_val] of Object.entries(dict)) {
        tooltip += param_name + ": " + param_val + "<br>"
    }

    return tooltip
}

export function stopPhysics() {
    solutionGraphNetwork.setOptions({
        physics: {
            enabled: false
        }
    })
    knowledgeGraphNetwork.setOptions({
        physics: {
            enabled: false
        }
    })
}

export function startPhysics() {
    solutionGraphNetwork.setOptions({
        physics: {
            enabled: true
        }
    })
    knowledgeGraphNetwork.setOptions({
        physics: {
            enabled: true
        }
    })
}

export function getSolutionNodePositions() {
    solutionGraphNetwork.storePositions()
    return solutionGraphNetworkData.nodes.map((item) => {
        return {
            id: item.id,
            x: item.x,
            y: item.y
        }
    })
}

export function setSolutionNodePositions(array) {
    for (let entry of array) {
        solutionGraphNetwork.moveNode(entry.id, entry.x, entry.y)
    }
}
