import {type NodeTypesObject, useVueFlow} from "@vue-flow/core";
import {markRaw, type MaybeRefOrGetter, toRef} from "vue";
import InputNode from "../components/nodes/InputNode.vue";
import OutputNode from "../components/nodes/OutputNode.vue";
import RegexNode from "../components/nodes/RegexNode.vue";
import StringNode from "../components/nodes/StringNode.vue";
import CombineStringsNode from "../components/nodes/CombineStringsNode.vue";
import JoinNode from "../components/nodes/JoinNode.vue";
import SplitNode from "../components/nodes/SplitNode.vue";
import CounterNode from "../components/nodes/CounterNode.vue";
import CoalesceNode from "../components/nodes/CoalesceNode.vue";
import CompareNode from "../components/nodes/CompareNode.vue";
import IfNode from "../components/nodes/IfNode.vue";
import GroupNode from "../components/nodes/GroupNode.vue";
import {nodes} from "./usePipeline.ts";

export const nodeTypes: NodeTypesObject = {
    input: markRaw(InputNode),
    output: markRaw(OutputNode),
    regex: markRaw(RegexNode),
    string: markRaw(StringNode),
    combine: markRaw(CombineStringsNode),
    join: markRaw(JoinNode),
    split: markRaw(SplitNode),
    counter: markRaw(CounterNode),
    coalesce: markRaw(CoalesceNode),
    compare: markRaw(CompareNode),
    if: markRaw(IfNode),
    group: markRaw(GroupNode)
}

export type NodeType =
    'input' |
    'output' |
    'regex' |
    'string' |
    'combine' |
    'join' |
    'split' |
    'counter' |
    'coalesce' |
    'compare' |
    'if' |
    'group';

export const useAddNode = (editorContainer: MaybeRefOrGetter<HTMLDivElement | null>) => {
    const { project, dimensions, getViewport } = useVueFlow({ id: 'flow-editor' });
    const editorContainerRef = toRef(editorContainer);

    function addRegexNode() {
        const id = `regex_${Date.now()}`
        nodes.value.push({
            id,
            type: 'regex',
            label: 'Regex',
            position: getSpawnPosition(140, 140),
            data: { pattern: '', replacement: '', mode: 'match', flags: '' }
        })
    }

    function addStringNode() {
        const id = `string_${Date.now()}`
        nodes.value.push({
            id,
            type: 'string',
            label: 'String',
            position: getSpawnPosition(180, 180),
            data: { value: '' }
        })
    }

    function addCombineStringsNode() {
        const id = `combine_${Date.now()}`
        nodes.value.push({
            id,
            type: 'combine',
            label: 'Combine Strings',
            position: getSpawnPosition(220, 220),
            data: {}
        })
    }

    function addJoinNode() {
        const id = `join_${Date.now()}`
        nodes.value.push({
            id,
            type: 'join',
            label: 'Join',
            position: getSpawnPosition(260, 260),
            data: { inputCount: 2 }
        })
    }

    function addSplitNode() {
        const id = `split_${Date.now()}`
        nodes.value.push({
            id,
            type: 'split',
            label: 'Split',
            position: getSpawnPosition(260, 140),
            data: { outputCount: 2 }
        })
    }

    function addCounterNode() {
        const id = `counter_${Date.now()}`
        nodes.value.push({
            id,
            type: 'counter',
            label: 'Counter',
            position: getSpawnPosition(220, 180),
            data: { startMode: 'manual', startValue: 0, step: 1 }
        })
    }

    function addCoalesceNode() {
        const id = `coalesce_${Date.now()}`
        nodes.value.push({
            id,
            type: 'coalesce',
            label: 'Coalesce',
            position: getSpawnPosition(180, 160),
            data: { inputCount: 2 }
        })
    }

    function addCompareNode() {
        const id = `compare_${Date.now()}`
        nodes.value.push({
            id,
            type: 'compare',
            label: 'Compare',
            position: getSpawnPosition(140, 200),
            data: { operator: 'equals' }
        })
    }

    function addIfNode() {
        const id = `if_${Date.now()}`
        nodes.value.push({
            id,
            type: 'if',
            label: 'If',
            position: getSpawnPosition(120, 240),
            data: {}
        })
    }

    function addGroupNode() {
        const id = `group_${Date.now()}`
        nodes.value.push({
            id,
            type: 'group',
            label: 'Group',
            position: getSpawnPosition(420, 260),
            width: 420,
            height: 260,
            style: {
                width: '420px',
                height: '260px'
            },
            data: {
                width: 420,
                height: 260
            }
        })
    }

    const getSpawnPosition = (nodeWidth = 220, nodeHeight = 160) => {
        const vp = getViewport()
        const width = dimensions.value.width || editorContainerRef.value?.clientWidth || 800
        const height = dimensions.value.height || editorContainerRef.value?.clientHeight || 600

        const centerScreen = {
            x: width / 2,
            y: height / 2
        }

        let centerFlow: { x: number; y: number }
        try {
            centerFlow = project(centerScreen)
        } catch {
            const zoom = vp.zoom || 1
            centerFlow = {
                x: (centerScreen.x - (vp.x || 0)) / zoom,
                y: (centerScreen.y - (vp.y || 0)) / zoom
            }
        }

        let x = Math.round(centerFlow.x - nodeWidth / 2)
        let y = Math.round(centerFlow.y - nodeHeight / 2)

        const existingPositions = new Set(
            (nodes.value as Array<{ position: { x: number; y: number } }>).map(
                (n) => `${n.position.x},${n.position.y}`
            )
        )
        while (existingPositions.has(`${x},${y}`)) {
            x += 20
            y += 20
        }

        return { x, y }
    }

    const addNode = (type: keyof NodeTypesObject) => {
        switch (type) {
            case 'regex':
                addRegexNode()
                break;
            case 'string':
                addStringNode()
                break;
            case 'combine':
                addCombineStringsNode()
                break;
            case 'counter':
                addCounterNode()
                break;
            case 'coalesce':
                addCoalesceNode()
                break;
            case 'compare':
                addCompareNode()
                break;
            case 'if':
                addIfNode()
                break;
            case 'group':
                addGroupNode()
                break;
            case 'join':
                addJoinNode()
                break;
            case 'split':
                addSplitNode()
                break;
        }
    }

    return { getSpawnPosition, addNode }
}