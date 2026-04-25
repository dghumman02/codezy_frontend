import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, ChevronRight, ChevronDown, Search, X, GitBranch } from 'lucide-react';
import { VALID_HTML_TAGS } from './HtmlRequiredTags';

// Valid parent → allowed children mapping
// Keys are parent tags, values are arrays of allowed child tags.
// If a parent is not listed, it can accept any tag (container-like).
const VALID_CHILDREN = {
    // Lists
    ul: ['li'],
    ol: ['li'],
    // List items can contain many things
    li: ['a', 'img', 'p', 'span', 'strong', 'em', 'b', 'i', 'u', 'small', 'mark', 'code', 'ul', 'ol', 'div', 'figure', 'blockquote', 'pre', 'br', 'hr'],
    // Table structure
    table: ['thead', 'tbody', 'tfoot', 'tr', 'caption', 'colgroup'],
    thead: ['tr'],
    tbody: ['tr'],
    tfoot: ['tr'],
    tr: ['th', 'td'],
    th: ['a', 'img', 'span', 'strong', 'em', 'b', 'i', 'u', 'small', 'code', 'br', 'ul', 'ol', 'div', 'p'],
    td: ['a', 'img', 'span', 'strong', 'em', 'b', 'i', 'u', 'small', 'code', 'br', 'ul', 'ol', 'div', 'p', 'figure', 'blockquote', 'pre', 'form', 'input', 'button', 'select', 'textarea', 'label'],
    colgroup: ['col'],
    // Definitions
    dl: ['dt', 'dd'],
    dt: ['a', 'span', 'strong', 'em', 'b', 'i', 'code'],
    dd: ['a', 'img', 'p', 'span', 'strong', 'em', 'b', 'i', 'u', 'code', 'ul', 'ol', 'div', 'blockquote', 'pre'],
    // Form
    form: ['input', 'textarea', 'button', 'select', 'label', 'fieldset', 'div', 'p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'datalist', 'output', 'a', 'ul', 'ol', 'table', 'section', 'header', 'footer', 'details'],
    fieldset: ['legend', 'input', 'textarea', 'button', 'select', 'label', 'div', 'p', 'span'],
    select: ['option', 'optgroup'],
    optgroup: ['option'],
    datalist: ['option'],
    // Media containers
    figure: ['img', 'figcaption', 'picture', 'video', 'audio', 'canvas', 'svg', 'iframe', 'embed', 'p'],
    picture: ['source', 'img'],
    video: ['source'],
    audio: ['source'],
    // Details
    details: ['summary', 'p', 'div', 'span', 'ul', 'ol', 'table', 'pre', 'blockquote', 'a', 'img'],
    // Head
    head: ['title', 'meta', 'link', 'style', 'script', 'noscript'],
    // Text-only tags (no children allowed)
    h1: [], h2: [], h3: [], h4: [], h5: [], h6: [],
    p: ['a', 'span', 'strong', 'em', 'b', 'i', 'u', 'small', 'mark', 'sub', 'sup', 'code', 'abbr', 'cite', 'br', 'img', 'time'],
    span: ['a', 'strong', 'em', 'b', 'i', 'u', 'small', 'mark', 'sub', 'sup', 'code', 'abbr', 'cite', 'br', 'img'],
    strong: ['span', 'em', 'a', 'code', 'br'],
    em: ['span', 'strong', 'a', 'code', 'br'],
    a: ['img', 'span', 'strong', 'em', 'b', 'i', 'u', 'code', 'small'],
    blockquote: ['p', 'cite', 'footer', 'span', 'a', 'strong', 'em'],
    pre: ['code', 'span'],
    code: [],
    label: ['input', 'span', 'strong', 'em'],
    button: ['span', 'strong', 'em', 'img'],
    // Self-closing / void (no children)
    img: [], input: [], br: [], hr: [], col: [], meta: [], link: [],
    source: [], embed: [], wbr: [],
    option: [], legend: [], caption: [], title: [],
    // Generic containers - accept most block/inline elements
    div: null,
    section: null,
    article: null,
    aside: null,
    header: null,
    footer: null,
    main: null,
    nav: null,
    html: ['head', 'body'],
    body: null,
    dialog: null,
};

// Void elements that cannot have children
const VOID_ELEMENTS = ['img', 'input', 'br', 'hr', 'col', 'meta', 'link', 'source', 'embed', 'wbr'];

// Container-like elements that can accept any block/inline child
const GENERIC_CHILDREN = VALID_HTML_TAGS.filter(t => !['html', 'head', 'body'].includes(t));

function getAllowedChildren(parentTag) {
    if (VOID_ELEMENTS.includes(parentTag)) return [];
    const mapping = VALID_CHILDREN[parentTag];
    if (mapping === undefined) return []; // unlisted tag, no children
    if (mapping === null) return GENERIC_CHILDREN; // null = container, allow generic set
    return mapping;
}

// Recursive tree node component
const NestingNode = ({ node, path, onUpdate, onRemove, onAddChild, depth = 0 }) => {
    const [collapsed, setCollapsed] = useState(false);
    const [showChildDropdown, setShowChildDropdown] = useState(false);
    const [childSearch, setChildSearch] = useState('');
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowChildDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const allowedChildren = getAllowedChildren(node.tag);
    const canHaveChildren = allowedChildren.length > 0;
    const hasChildren = node.children && node.children.length > 0;

    const filteredChildren = allowedChildren.filter(
        tag => tag.toLowerCase().includes(childSearch.toLowerCase())
    );

    const indentColors = [
        'border-emerald-400', 'border-blue-400', 'border-purple-400',
        'border-pink-400', 'border-amber-400', 'border-cyan-400'
    ];
    const bgColors = [
        'bg-emerald-50', 'bg-blue-50', 'bg-purple-50',
        'bg-pink-50', 'bg-amber-50', 'bg-cyan-50'
    ];

    return (
        <div className={`ml-${Math.min(depth * 4, 16)}`}>
            <div className={`flex items-start gap-2 p-3 rounded-xl border-l-4 ${indentColors[depth % indentColors.length]} ${bgColors[depth % bgColors.length]} mb-2`}>
                {/* Expand/Collapse */}
                <button
                    type="button"
                    onClick={() => setCollapsed(!collapsed)}
                    className="flex-shrink-0 mt-0.5 text-gray-500 hover:text-gray-800 transition-colors"
                    disabled={!hasChildren}
                >
                    {hasChildren ? (collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />) : <span className="w-4 inline-block" />}
                </button>

                {/* Tag badge */}
                <div className="flex-shrink-0 px-2.5 py-1 bg-white border-2 border-gray-300 rounded-lg font-mono font-bold text-sm text-gray-700 shadow-sm">
                    &lt;{node.tag}&gt;
                </div>

                {/* Min count */}
                <div className="flex items-center gap-1">
                    <label className="text-xs text-gray-500 whitespace-nowrap">min:</label>
                    <input
                        type="number"
                        value={node.minCount}
                        onChange={(e) => onUpdate(path, 'minCount', Math.max(1, parseInt(e.target.value) || 1))}
                        min="1"
                        className="w-16 px-2 py-1 border rounded-lg text-sm text-center focus:ring-2 focus:ring-emerald-400"
                    />
                </div>

                {/* Message */}
                <input
                    type="text"
                    value={node.message || ''}
                    onChange={(e) => onUpdate(path, 'message', e.target.value)}
                    placeholder="Feedback message (optional)"
                    className="flex-1 px-2 py-1 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 min-w-0"
                />

                {/* Add child */}
                {canHaveChildren && (
                    <div className="relative" ref={dropdownRef}>
                        <button
                            type="button"
                            onClick={() => { setShowChildDropdown(!showChildDropdown); setChildSearch(''); }}
                            className="flex-shrink-0 p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                            title="Add child tag"
                        >
                            <Plus size={14} />
                        </button>
                        {showChildDropdown && (
                            <div className="absolute right-0 z-30 mt-1 w-56 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                                <div className="p-2 border-b">
                                    <div className="relative">
                                        <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            value={childSearch}
                                            onChange={(e) => setChildSearch(e.target.value)}
                                            placeholder="Search tags..."
                                            className="w-full pl-7 pr-2 py-1.5 border rounded-lg text-xs focus:ring-2 focus:ring-emerald-400"
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                <div className="max-h-40 overflow-y-auto">
                                    {filteredChildren.length > 0 ? filteredChildren.map(tag => (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => { onAddChild(path, tag); setShowChildDropdown(false); }}
                                            className="w-full text-left px-3 py-2 hover:bg-emerald-50 text-sm flex items-center gap-2 border-b border-gray-50 last:border-0 transition-colors"
                                        >
                                            <span className="px-1.5 py-0.5 bg-gray-100 rounded font-mono text-xs">&lt;{tag}&gt;</span>
                                        </button>
                                    )) : (
                                        <div className="px-3 py-2 text-xs text-gray-400 text-center">No matching tags</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Delete */}
                <button
                    type="button"
                    onClick={() => onRemove(path)}
                    className="flex-shrink-0 text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded-lg transition-colors"
                >
                    <Trash2 size={14} />
                </button>
            </div>

            {/* Children */}
            {hasChildren && !collapsed && (
                <div className="ml-6 pl-3 border-l-2 border-dashed border-gray-300">
                    {node.children.map((child, idx) => (
                        <NestingNode
                            key={`${path}-${idx}`}
                            node={child}
                            path={[...path, idx]}
                            onUpdate={onUpdate}
                            onRemove={onRemove}
                            onAddChild={onAddChild}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const HtmlNestingConstraints = ({ constraints, onChange }) => {
    const [showRootDropdown, setShowRootDropdown] = useState(false);
    const [rootSearch, setRootSearch] = useState('');
    const rootDropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (rootDropdownRef.current && !rootDropdownRef.current.contains(e.target)) {
                setShowRootDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Tags that make sense as root of a nesting rule
    const rootCandidates = VALID_HTML_TAGS.filter(
        tag => !VOID_ELEMENTS.includes(tag) && tag.toLowerCase().includes(rootSearch.toLowerCase())
    );

    const addRootNode = (tag) => {
        onChange([...constraints, { id: Date.now(), tag, minCount: 1, message: '', children: [] }]);
        setShowRootDropdown(false);
        setRootSearch('');
    };

    const removeNode = (path) => {
        if (path.length === 1) {
            // Remove root node
            onChange(constraints.filter((_, i) => i !== path[0]));
        } else {
            // Deep remove
            const newConstraints = JSON.parse(JSON.stringify(constraints));
            let parent = newConstraints[path[0]];
            for (let i = 1; i < path.length - 1; i++) {
                parent = parent.children[path[i]];
            }
            parent.children.splice(path[path.length - 1], 1);
            onChange(newConstraints);
        }
    };

    const updateNode = (path, field, value) => {
        const newConstraints = JSON.parse(JSON.stringify(constraints));
        let node = newConstraints[path[0]];
        for (let i = 1; i < path.length; i++) {
            node = node.children[path[i]];
        }
        node[field] = value;
        onChange(newConstraints);
    };

    const addChild = (path, tag) => {
        const newConstraints = JSON.parse(JSON.stringify(constraints));
        let node = newConstraints[path[0]];
        for (let i = 1; i < path.length; i++) {
            node = node.children[path[i]];
        }
        if (!node.children) node.children = [];
        node.children.push({ tag, minCount: 1, message: '', children: [] });
        onChange(newConstraints);
    };

    return (
        <div className="mt-8 pt-4 border-t border-gray-200">
            <h4 className="text-xl font-bold text-gray-800 mb-1 flex items-center gap-2">
                <GitBranch size={20} className="text-emerald-500" />
                B. Nesting Constraints (Tree Rules)
            </h4>
            <p className="text-sm text-gray-500 mb-4">
                Define parent–child relationships between HTML tags. Each rule is a tree where you specify required nesting structures.
            </p>

            {/* Existing trees */}
            <div className="space-y-3 mb-4">
                {constraints.map((rootNode, idx) => (
                    <div key={rootNode.id || idx} className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                        <NestingNode
                            node={rootNode}
                            path={[idx]}
                            onUpdate={updateNode}
                            onRemove={removeNode}
                            onAddChild={addChild}
                            depth={0}
                        />
                    </div>
                ))}
            </div>

            {/* Add root node */}
            <div className="relative" ref={rootDropdownRef}>
                <button
                    type="button"
                    onClick={() => { setShowRootDropdown(!showRootDropdown); setRootSearch(''); }}
                    className="flex items-center px-4 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors text-sm font-medium shadow-sm"
                >
                    <Plus size={18} className="mr-1.5" /> Add Nesting Rule
                </button>

                {showRootDropdown && (
                    <div className="absolute z-30 mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                        <div className="p-2 border-b">
                            <div className="relative">
                                <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={rootSearch}
                                    onChange={(e) => setRootSearch(e.target.value)}
                                    placeholder="Search root tag..."
                                    className="w-full pl-7 pr-2 py-1.5 border rounded-lg text-xs focus:ring-2 focus:ring-emerald-400"
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                            {rootCandidates.length > 0 ? rootCandidates.map(tag => (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => addRootNode(tag)}
                                    className="w-full text-left px-3 py-2 hover:bg-emerald-50 text-sm flex items-center gap-2 border-b border-gray-50 last:border-0 transition-colors"
                                >
                                    <span className="px-1.5 py-0.5 bg-gray-100 rounded font-mono text-xs">&lt;{tag}&gt;</span>
                                    <Plus size={14} className="ml-auto text-emerald-400" />
                                </button>
                            )) : (
                                <div className="px-3 py-3 text-xs text-gray-400 text-center">No matching tags</div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HtmlNestingConstraints;
