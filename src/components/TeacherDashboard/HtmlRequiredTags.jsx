import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Search, Tag, X } from 'lucide-react';

const VALID_HTML_TAGS = [
    // Structure
    'html', 'head', 'body', 'header', 'footer', 'main', 'nav', 'aside', 'section', 'article',
    // Headings
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    // Text
    'p', 'span', 'strong', 'em', 'b', 'i', 'u', 'small', 'mark', 'sub', 'sup', 'blockquote', 'pre', 'code', 'abbr', 'cite',
    // Lists
    'ul', 'ol', 'li', 'dl', 'dt', 'dd',
    // Links & Media
    'a', 'img', 'audio', 'video', 'source', 'picture', 'figure', 'figcaption', 'canvas', 'svg',
    // Tables
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
    // Forms
    'form', 'input', 'textarea', 'button', 'select', 'option', 'optgroup', 'label', 'fieldset', 'legend', 'datalist', 'output',
    // Containers
    'div', 'details', 'summary', 'dialog',
    // Embedded
    'iframe', 'embed', 'object',
    // Semantic
    'time', 'address', 'hr', 'br', 'wbr',
    // Meta
    'meta', 'link', 'title', 'style', 'script', 'noscript',
];

const HtmlRequiredTags = ({ tags, onChange }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const usedTags = tags.map(t => t.tag);
    const filteredTags = VALID_HTML_TAGS.filter(
        tag => !usedTags.includes(tag) && tag.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const addTag = (tagName) => {
        onChange([...tags, { id: Date.now(), tag: tagName, minCount: 1, maxCount: 0, message: '' }]);
        setSearchQuery('');
        setShowDropdown(false);
    };

    const removeTag = (id) => {
        onChange(tags.filter(t => t.id !== id));
    };

    const updateTag = (id, field, value) => {
        onChange(tags.map(t => t.id === id ? { ...t, [field]: value } : t));
    };

    return (
        <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-xl font-bold text-gray-800 mb-1 flex items-center gap-2">
                <Tag size={20} className="text-orange-500" />
                A. Required HTML Tags
            </h4>
            <p className="text-sm text-gray-500 mb-4">Define which HTML tags must be present in the student's submission</p>

            {/* Added tags */}
            <div className="space-y-3 mb-4">
                {tags.map((t) => (
                    <div key={t.id} className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-xl">
                        <div className="flex-shrink-0 px-3 py-1.5 bg-orange-500 text-white rounded-lg font-mono font-bold text-sm">
                            &lt;{t.tag}&gt;
                        </div>
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Min Count *</label>
                                <input
                                    type="number"
                                    value={t.minCount}
                                    onChange={(e) => updateTag(t.id, 'minCount', Math.max(1, parseInt(e.target.value) || 1))}
                                    min="1"
                                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Max Count <span className="text-gray-400">(0 = no limit)</span></label>
                                <input
                                    type="number"
                                    value={t.maxCount}
                                    onChange={(e) => updateTag(t.id, 'maxCount', Math.max(0, parseInt(e.target.value) || 0))}
                                    min="0"
                                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Feedback Message</label>
                                <input
                                    type="text"
                                    value={t.message}
                                    onChange={(e) => updateTag(t.id, 'message', e.target.value)}
                                    placeholder="e.g., Add at least two paragraphs"
                                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400"
                                />
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => removeTag(t.id)}
                            className="flex-shrink-0 text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Searchable dropdown to add new tag */}
            <div className="relative" ref={dropdownRef}>
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                            onFocus={() => setShowDropdown(true)}
                            placeholder="Search and add HTML tag..."
                            className="w-full pl-9 pr-4 py-2.5 border-2 border-dashed border-orange-300 rounded-xl text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200 bg-white"
                        />
                        {searchQuery && (
                            <button type="button" onClick={() => { setSearchQuery(''); setShowDropdown(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {showDropdown && filteredTags.length > 0 && (
                    <div className="absolute z-20 mt-1 w-full max-w-sm bg-white border border-gray-200 rounded-xl shadow-xl max-h-56 overflow-y-auto">
                        {filteredTags.map(tag => (
                            <button
                                key={tag}
                                type="button"
                                onClick={() => addTag(tag)}
                                className="w-full text-left px-4 py-2.5 hover:bg-orange-50 flex items-center gap-2 text-sm transition-colors border-b border-gray-50 last:border-0"
                            >
                                <span className="px-2 py-0.5 bg-gray-100 rounded font-mono text-xs text-gray-700">&lt;{tag}&gt;</span>
                                <Plus size={14} className="ml-auto text-orange-400" />
                            </button>
                        ))}
                    </div>
                )}
                {showDropdown && searchQuery && filteredTags.length === 0 && (
                    <div className="absolute z-20 mt-1 w-full max-w-sm bg-white border border-gray-200 rounded-xl shadow-xl p-4 text-sm text-gray-500 text-center">
                        No matching tags found
                    </div>
                )}
            </div>
        </div>
    );
};

export { VALID_HTML_TAGS };
export default HtmlRequiredTags;
