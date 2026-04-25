import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
    Save, X, Plus, Trash2, Calendar, Clock, FileText, Code,
    Sparkles, Zap, Check, Ban, Trophy, Users, BookOpen, Building2,
    GraduationCap, ChevronDown
} from 'lucide-react';
import HtmlRequiredTags from '../TeacherDashboard/HtmlRequiredTags';
import HtmlNestingConstraints from '../TeacherDashboard/HtmlNestingConstraints';
import SuperAdminLayout from './SuperAdminLayout';

const CODE_CONSTRUCTS = {
    FOR_LOOP: 'for loop',
    WHILE_LOOP: 'while loop',
    RECURSION: 'Recursion',
    IF_ELSE: 'if-else statement',
    ARRAY: 'Array/List',
    GLOBAL: 'Global Variables',
    CUSTOM_FUNC: 'Custom Function/Method',
    BUILT_IN_SORT: 'Built-in Sort Function',
};

const CONSTRAINT_OPTIONS = [
    { label: 'Loops (Any)', value: 'LOOP' },
    { label: 'For Loop', value: CODE_CONSTRUCTS.FOR_LOOP },
    { label: 'While Loop', value: CODE_CONSTRUCTS.WHILE_LOOP },
    { label: 'Recursion', value: CODE_CONSTRUCTS.RECURSION },
    { label: 'If-Else', value: CODE_CONSTRUCTS.IF_ELSE },
    { label: 'Arrays/Lists', value: CODE_CONSTRUCTS.ARRAY },
    { label: 'Global Variables', value: CODE_CONSTRUCTS.GLOBAL },
    { label: 'Built-in Sort', value: CODE_CONSTRUCTS.BUILT_IN_SORT },
    { label: 'Custom Function', value: CODE_CONSTRUCTS.CUSTOM_FUNC },
];

const makeTask = () => ({
    id: Date.now() + Math.random(),
    title: '',
    marks: '',
    description: '',
    testCases: [makeTestCase()],
    codeConstraints: [],
    htmlRequiredTags: [],
    htmlNestingConstraints: [],
});

const makeTestCase = () => ({
    id: Date.now() + Math.random(),
    input: '',
    expectedOutput: '',
    comparisonMode: 'Exact',
    notes: '',
    isHidden: false,
});

const SuperAdminCreateCompetitionPage = () => {
    const navigate = useNavigate();
    const tasksSectionRef = useRef(null);
    const instructionsSectionRef = useRef(null);
    const instDropdownRef = useRef(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        instructions: '',
        language: 'python',
        difficulty: 'Medium',
        totalMarks: '',
        startDate: '',
        startTime: '',
        dueDate: '',
        dueTime: '',
    });

    // Platform eligibility state
    const [institutions, setInstitutions] = useState('all'); // 'all' | 'none' | 'specific'
    const [selectedTenantIds, setSelectedTenantIds] = useState([]);
    const [selectedTenantNames, setSelectedTenantNames] = useState([]);
    const [allowLearners, setAllowLearners] = useState(false);
    const [minLearnerXP, setMinLearnerXP] = useState('');
    const [maxLearnerXP, setMaxLearnerXP] = useState('');

    const [availableInstitutions, setAvailableInstitutions] = useState([]);
    const [instDropdownOpen, setInstDropdownOpen] = useState(false);

    const [tasks, setTasks] = useState([{
        id: 'initial',
        title: 'Problem Statement',
        marks: 10,
        description: '',
        testCases: [{ id: 'tc-initial', input: '', expectedOutput: '', comparisonMode: 'Exact', notes: '', isHidden: false }],
        codeConstraints: [],
        htmlRequiredTags: [],
        htmlNestingConstraints: [],
    }]);

    const [activeSection, setActiveSection] = useState('basic');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    // Fetch available institutions for the dropdown
    useEffect(() => {
        const fetchInstitutions = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(
                    `${import.meta.env.VITE_BACKEND_URL || `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}`}/api/platform-competitions/institutions`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setAvailableInstitutions(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                console.error('Fetch institutions error:', err);
            }
        };
        fetchInstitutions();
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (instDropdownRef.current && !instDropdownRef.current.contains(e.target)) {
                setInstDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    /* ── form helpers ──────────────────────────────────────── */
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleInstitutionToggle = (inst) => {
        const id = String(inst.tenantId);
        const selected = selectedTenantIds.includes(id);
        if (selected) {
            setSelectedTenantIds(prev => prev.filter(x => x !== id));
            setSelectedTenantNames(prev => prev.filter(n => n !== inst.name));
        } else {
            setSelectedTenantIds(prev => [...prev, id]);
            setSelectedTenantNames(prev => [...prev, inst.name]);
        }
    };

    const removeInstitution = (id) => {
        const idx = selectedTenantIds.indexOf(id);
        setSelectedTenantIds(prev => prev.filter(x => x !== id));
        setSelectedTenantNames(prev => {
            const next = [...prev];
            next.splice(idx, 1);
            return next;
        });
    };

    /* ── task helpers ───────────────────────────────────────── */
    const handleTaskChange = (id, field, value) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
    };

    const addTask = () => setTasks(prev => [...prev, makeTask()]);

    const removeTask = (id) => {
        if (tasks.length > 1) setTasks(prev => prev.filter(t => t.id !== id));
    };

    const addTestCase = (taskId) => {
        setTasks(prev => prev.map(t =>
            t.id === taskId ? { ...t, testCases: [...t.testCases, makeTestCase()] } : t
        ));
    };

    const removeTestCase = (taskId, tcId) => {
        setTasks(prev => prev.map(t =>
            t.id === taskId ? { ...t, testCases: t.testCases.filter(tc => tc.id !== tcId) } : t
        ));
    };

    const handleTestCaseChange = (taskId, tcId, field, value) => {
        setTasks(prev => prev.map(t =>
            t.id === taskId
                ? { ...t, testCases: t.testCases.map(tc => tc.id === tcId ? { ...tc, [field]: value } : tc) }
                : t
        ));
    };

    const addConstraint = (taskId, type) => {
        setTasks(prev => prev.map(t =>
            t.id === taskId
                ? { ...t, codeConstraints: [...t.codeConstraints, { id: Date.now() + Math.random(), type, construct: CONSTRAINT_OPTIONS[0].value, specifics: { minDepth: 0, maxDepth: 0 } }] }
                : t
        ));
    };

    const removeConstraint = (taskId, cId) => {
        setTasks(prev => prev.map(t =>
            t.id === taskId ? { ...t, codeConstraints: t.codeConstraints.filter(c => c.id !== cId) } : t
        ));
    };

    const handleConstraintChange = (taskId, cId, field, value) => {
        setTasks(prev => prev.map(t => {
            if (t.id !== taskId) return t;
            return {
                ...t,
                codeConstraints: t.codeConstraints.map(c => {
                    if (c.id !== cId) return c;
                    if (field.startsWith('specifics.')) {
                        return { ...c, specifics: { ...c.specifics, [field.split('.')[1]]: parseInt(value) || 0 } };
                    }
                    return { ...c, [field]: value };
                }),
            };
        }));
    };

    const scrollToSection = (section) => {
        setActiveSection(section);
        if (section === 'tasks' && tasksSectionRef.current) {
            tasksSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (section === 'instructions' && instructionsSectionRef.current) {
            instructionsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const toISODateTime = (date, time) => {
        if (!date || !time) return null;
        const d = new Date(`${date}T${time}`);
        return isNaN(d.getTime()) ? null : d.toISOString();
    };

    /* ── submit ─────────────────────────────────────────────── */
    const handleSubmit = async (e, statusOverride) => {
        if (e) e.preventDefault();
        setIsSubmitting(true);
        setSubmitError(null);

        const startDateTime = toISODateTime(formData.startDate, formData.startTime);
        const dueDateTime = toISODateTime(formData.dueDate, formData.dueTime);

        if (!startDateTime || !dueDateTime) {
            setSubmitError('Please enter valid start and due date/time.');
            setIsSubmitting(false);
            return;
        }

        const totalMarks = Number(formData.totalMarks) || 0;
        const isHtml = formData.language === 'html';

        const stripIds = (node) => {
            const { id, ...rest } = node;
            return { ...rest, children: (rest.children || []).map(stripIds) };
        };

        const mappedTasks = tasks.map(task => {
            const base = {
                title: String(task.title).trim(),
                marks: Number(task.marks) || 0,
                description: task.description || '',
            };
            if (isHtml) {
                return {
                    ...base,
                    testCases: [],
                    codeConstraints: [],
                    htmlRequiredTags: task.htmlRequiredTags.map(({ id, ...t }) => ({
                        tag: t.tag,
                        minCount: Number(t.minCount) || 1,
                        maxCount: Number(t.maxCount) || 0,
                        message: t.message || '',
                    })),
                    htmlNestingConstraints: task.htmlNestingConstraints.map(stripIds),
                };
            }
            return {
                ...base,
                testCases: task.testCases.map(tc => ({
                    input: tc.input,
                    expectedOutput: tc.expectedOutput,
                    comparisonMode: tc.comparisonMode || 'Exact',
                    isHidden: !!tc.isHidden,
                    notes: tc.notes || '',
                })),
                codeConstraints: task.codeConstraints.map(c => ({
                    construct: c.construct,
                    type: c.type,
                    specifics: {
                        minDepth: Number(c.specifics.minDepth) || 0,
                        maxDepth: Number(c.specifics.maxDepth) || 0,
                    },
                })),
                htmlRequiredTags: [],
                htmlNestingConstraints: [],
            };
        });

        const sumOfTaskMarks = mappedTasks.reduce((s, t) => s + t.marks, 0);
        if (sumOfTaskMarks !== totalMarks) {
            setSubmitError(`Sum of task marks (${sumOfTaskMarks}) must equal total marks (${totalMarks}).`);
            setIsSubmitting(false);
            return;
        }

        const payload = {
            title: formData.title.trim(),
            description: formData.description,
            instructions: formData.instructions,
            language: formData.language,
            difficulty: formData.difficulty,
            totalMarks,
            startDate: startDateTime,
            dueDate: dueDateTime,
            status: statusOverride || 'Active',
            eligibility: {
                institutions,
                tenantIds: institutions === 'specific' ? selectedTenantIds : [],
                tenantNames: institutions === 'specific' ? selectedTenantNames : [],
                allowLearners,
                minLearnerXP: allowLearners ? (Number(minLearnerXP) || 0) : 0,
                maxLearnerXP: allowLearners ? (Number(maxLearnerXP) || 0) : 0,
            },
            tasks: mappedTasks,
            createdBy: {
                id: localStorage.getItem('userId'),
                name: localStorage.getItem('fullName') || 'SuperAdmin',
            },
        };

        try {
            const token = localStorage.getItem('token');
            await axios.post(`${import.meta.env.VITE_BACKEND_URL || `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}`}/api/platform-competitions`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            alert(`Competition "${formData.title}" created successfully!`);
            navigate('/superadmin-competitions');
        } catch (err) {
            console.error('Create competition error:', err.response?.data);
            setSubmitError(err.response?.data?.message || err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    /* ── ProgressIndicator ──────────────────────────────────── */
    const ProgressIndicator = () => (
        <div className="flex items-center justify-center mb-8">
            {[
                { key: 'basic', label: 'Setup' },
                { key: 'tasks', label: 'Tasks' },
                { key: 'instructions', label: 'Instructions' },
            ].map((item, index) => (
                <React.Fragment key={item.key}>
                    <div
                        className={`flex flex-col items-center cursor-pointer transition-all duration-300 ${activeSection === item.key ? 'scale-110' : ''}`}
                        onClick={() => scrollToSection(item.key)}
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${activeSection === item.key ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'border-gray-300 text-gray-400'}`}>
                            {index + 1}
                        </div>
                        <span className={`text-xs mt-1 font-medium ${activeSection === item.key ? 'text-indigo-600' : 'text-gray-500'}`}>
                            {item.label}
                        </span>
                    </div>
                    {index < 2 && (
                        <div className={`w-16 h-1 mx-2 rounded ${activeSection === item.key ? 'bg-indigo-600' : 'bg-gray-200'}`} />
                    )}
                </React.Fragment>
            ))}
        </div>
    );

    /* ── render ─────────────────────────────────────────────── */
    return (
        <SuperAdminLayout>
            <div className="max-w-4xl mx-auto">
                {/* Page header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-900 flex items-center justify-center gap-3">
                        <Trophy size={30} className="text-yellow-500" />
                        Create Platform Competition
                    </h1>
                    <p className="text-gray-500 mt-2">
                        Set up a platform-wide competition open to institutions and/or individual learners
                    </p>
                    <div className="flex justify-center mt-3">
                        <Sparkles className="text-yellow-400" size={20} />
                    </div>
                </div>

                <ProgressIndicator />

                <form onSubmit={(e) => handleSubmit(e, 'Active')} className="space-y-8">
                    {/* Error banner */}
                    {submitError && (
                        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-xl flex items-center justify-between">
                            <span><strong>Error: </strong>{submitError}</span>
                            <button type="button" onClick={() => setSubmitError(null)}>
                                <X size={18} />
                            </button>
                        </div>
                    )}

                    {/* ══ SECTION 1: Basic Details ══════════════════════════════ */}
                    <div className={`bg-white rounded-2xl p-8 shadow-xl border border-gray-100 transition-opacity ${activeSection === 'basic' ? 'opacity-100' : 'opacity-75'}`}>
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                                <FileText size={22} className="text-white" />
                            </div>
                            Competition Details
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Title */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Competition Title *
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    placeholder="e.g., National Coding Championship 2026"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400"
                                    required
                                />
                            </div>

                            {/* Language */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <Code size={14} className="inline mr-1 text-indigo-500" />
                                    Programming Language *
                                </label>
                                <select
                                    name="language"
                                    value={formData.language}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
                                >
                                    <option value="python">🐍 Python 3.11</option>
                                    <option value="java">☕ Java 17</option>
                                    <option value="cpp">⚡ C++ 17</option>
                                    <option value="html">🌐 HTML</option>
                                </select>
                            </div>

                            {/* Difficulty */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Difficulty Level</label>
                                <select
                                    name="difficulty"
                                    value={formData.difficulty}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
                                >
                                    <option value="Easy">🎯 Easy</option>
                                    <option value="Medium">⚡ Medium</option>
                                    <option value="Hard">🔥 Hard</option>
                                </select>
                            </div>

                            {/* Start Date */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <Calendar size={14} className="inline mr-1 text-green-500" />
                                    Start Date *
                                </label>
                                <input
                                    type="date"
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500"
                                    required
                                />
                            </div>

                            {/* Start Time */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <Clock size={14} className="inline mr-1 text-green-500" />
                                    Start Time *
                                </label>
                                <input
                                    type="time"
                                    name="startTime"
                                    value={formData.startTime}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500"
                                    required
                                />
                            </div>

                            {/* Due Date */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <Calendar size={14} className="inline mr-1 text-rose-500" />
                                    Due Date *
                                </label>
                                <input
                                    type="date"
                                    name="dueDate"
                                    value={formData.dueDate}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                            </div>

                            {/* Due Time */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <Clock size={14} className="inline mr-1 text-rose-500" />
                                    Due Time *
                                </label>
                                <input
                                    type="time"
                                    name="dueTime"
                                    value={formData.dueTime}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                            </div>

                            {/* Total Marks */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <Zap size={14} className="inline mr-1 text-red-500" />
                                    Total Marks *
                                </label>
                                <input
                                    type="number"
                                    name="totalMarks"
                                    value={formData.totalMarks}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 100"
                                    min="1"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                            </div>

                            {/* Description */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Brief overview of the competition..."
                                    rows="3"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 resize-none"
                                />
                            </div>
                        </div>

                        {/* ── Platform Eligibility ─────────────────────────────── */}
                        <div className="mt-8 pt-8 border-t-2 border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg">
                                    <Users size={18} className="text-white" />
                                </div>
                                Eligibility Criteria
                            </h3>
                            <p className="text-sm text-gray-500 mb-6">
                                Define who across the Codezy platform can participate.
                            </p>

                            {/* ── Institution eligibility ── */}
                            <div className="mb-6">
                                <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                    <Building2 size={15} className="text-indigo-500" />
                                    Institution Access
                                </label>
                                <div className="flex flex-wrap gap-3 mb-4">
                                    {[
                                        { value: 'all', label: 'All Universities' },
                                        { value: 'none', label: 'No Universities' },
                                        { value: 'specific', label: 'Specific Universities' },
                                    ].map(opt => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => {
                                                setInstitutions(opt.value);
                                                if (opt.value !== 'specific') {
                                                    setSelectedTenantIds([]);
                                                    setSelectedTenantNames([]);
                                                }
                                            }}
                                            className={`px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                                                institutions === opt.value
                                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                                    : 'border-gray-200 text-gray-600 hover:border-indigo-300'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Specific institution multi-select */}
                                {institutions === 'specific' && (
                                    <div ref={instDropdownRef} className="relative mb-3">
                                        <button
                                            type="button"
                                            onClick={() => setInstDropdownOpen(o => !o)}
                                            className="w-full flex items-center justify-between px-4 py-3 border-2 border-gray-200 rounded-xl bg-white hover:border-indigo-400 transition-all"
                                        >
                                            <span className="text-sm text-gray-500">
                                                {selectedTenantIds.length === 0
                                                    ? 'Select institutions...'
                                                    : `${selectedTenantIds.length} institution(s) selected`}
                                            </span>
                                            <ChevronDown
                                                size={16}
                                                className={`text-gray-400 transition-transform ${instDropdownOpen ? 'rotate-180' : ''}`}
                                            />
                                        </button>

                                        {instDropdownOpen && (
                                            <div className="absolute z-30 top-full mt-1 w-full bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-52 overflow-y-auto">
                                                {availableInstitutions.length === 0 ? (
                                                    <div className="px-4 py-3 text-sm text-gray-400 text-center">
                                                        No institutions found
                                                    </div>
                                                ) : availableInstitutions.map(inst => {
                                                    const isSelected = selectedTenantIds.includes(String(inst.tenantId));
                                                    return (
                                                        <button
                                                            key={String(inst._id)}
                                                            type="button"
                                                            onClick={() => handleInstitutionToggle(inst)}
                                                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-indigo-50 transition-colors ${isSelected ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'}`}
                                                        >
                                                            <span className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                                                                {isSelected && <Check size={11} className="text-white" />}
                                                            </span>
                                                            <span className="font-medium">{inst.name}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Selected institution chips */}
                                {institutions === 'specific' && selectedTenantIds.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {selectedTenantIds.map((id, idx) => (
                                            <span
                                                key={id}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold"
                                            >
                                                <Building2 size={12} />
                                                {selectedTenantNames[idx] || id}
                                                <button
                                                    type="button"
                                                    onClick={() => removeInstitution(id)}
                                                    className="hover:text-red-500 transition-colors"
                                                >
                                                    <X size={13} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* ── Individual learner eligibility ── */}
                            <div className="bg-purple-50 border border-purple-100 rounded-2xl p-5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <GraduationCap size={20} className="text-purple-600" />
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">Individual Learners</p>
                                            <p className="text-xs text-gray-500">Allow subscribed Codezy learners to participate</p>
                                        </div>
                                    </div>
                                    {/* Toggle switch */}
                                    <button
                                        type="button"
                                        onClick={() => setAllowLearners(v => !v)}
                                        className={`relative w-11 h-6 rounded-full transition-colors ${allowLearners ? 'bg-purple-600' : 'bg-gray-300'}`}
                                    >
                                        <span
                                            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${allowLearners ? 'translate-x-5' : 'translate-x-0'}`}
                                        />
                                    </button>
                                </div>

                                {allowLearners && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="mt-5 pt-4 border-t border-purple-200 grid grid-cols-1 md:grid-cols-2 gap-4"
                                    >
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                <Zap size={13} className="inline mr-1 text-purple-500" />
                                                Minimum XP Required
                                                <span className="ml-1 text-xs text-gray-400 font-normal">(0 = no minimum)</span>
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={minLearnerXP}
                                                onChange={e => setMinLearnerXP(e.target.value)}
                                                placeholder="e.g., 500"
                                                className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 bg-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                <Zap size={13} className="inline mr-1 text-purple-500" />
                                                Maximum XP Allowed
                                                <span className="ml-1 text-xs text-gray-400 font-normal">(0 = no limit)</span>
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={maxLearnerXP}
                                                onChange={e => setMaxLearnerXP(e.target.value)}
                                                placeholder="e.g., 2000"
                                                className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 bg-white"
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ══ SECTION 2: Tasks ══════════════════════════════════════ */}
                    <div
                        ref={tasksSectionRef}
                        className={`bg-white rounded-2xl p-8 shadow-xl border border-gray-100 transition-opacity ${activeSection === 'tasks' ? 'opacity-100' : 'opacity-75'}`}
                    >
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                                <Code size={22} className="text-white" />
                            </div>
                            Competition Tasks
                        </h2>

                        <div className="space-y-6">
                            {tasks.map((task, index) => (
                                <div key={String(task.id)} className="border-2 border-gray-200 rounded-2xl p-6 bg-white hover:shadow-lg transition-all">
                                    {/* Task header */}
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                                {index + 1}
                                            </div>
                                            <span className="font-bold text-gray-900">Task {index + 1}</span>
                                        </div>
                                        {tasks.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeTask(task.id)}
                                                className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Task fields */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-gray-100 pb-4 mb-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Task Title</label>
                                            <input
                                                type="text"
                                                value={task.title}
                                                onChange={e => handleTaskChange(task.id, 'title', e.target.value)}
                                                placeholder="Task title"
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Marks</label>
                                            <input
                                                type="number"
                                                value={task.marks}
                                                onChange={e => handleTaskChange(task.id, 'marks', e.target.value)}
                                                placeholder="10"
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div className="md:col-span-3">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Problem Statement</label>
                                            <textarea
                                                value={task.description}
                                                onChange={e => handleTaskChange(task.id, 'description', e.target.value)}
                                                placeholder="Describe the problem..."
                                                rows="3"
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 resize-none"
                                            />
                                        </div>
                                    </div>

                                    {/* HTML or Code tasks */}
                                    {formData.language === 'html' ? (
                                        <>
                                            <HtmlRequiredTags
                                                tags={task.htmlRequiredTags}
                                                onChange={t => handleTaskChange(task.id, 'htmlRequiredTags', t)}
                                            />
                                            <HtmlNestingConstraints
                                                constraints={task.htmlNestingConstraints}
                                                onChange={c => handleTaskChange(task.id, 'htmlNestingConstraints', c)}
                                            />
                                        </>
                                    ) : (
                                        <>
                                            {/* Test Cases */}
                                            <div className="mb-6">
                                                <h4 className="font-bold text-gray-800 mb-3">A. Test Cases</h4>
                                                <div className="space-y-4">
                                                    {task.testCases.map((tc, tcIdx) => (
                                                        <div key={String(tc.id)} className="p-4 border border-gray-200 rounded-xl bg-gray-50">
                                                            <div className="flex items-center justify-between mb-3 border-b border-gray-200 pb-2">
                                                                <span className="font-semibold text-gray-700 text-sm">
                                                                    Test Case #{tcIdx + 1}
                                                                </span>
                                                                <div className="flex items-center gap-3">
                                                                    <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={tc.isHidden}
                                                                            onChange={e => handleTestCaseChange(task.id, tc.id, 'isHidden', e.target.checked)}
                                                                            className="form-checkbox text-indigo-600 rounded"
                                                                        />
                                                                        Hidden
                                                                    </label>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeTestCase(task.id, tc.id)}
                                                                        disabled={task.testCases.length <= 1}
                                                                        className={`text-red-400 hover:text-red-600 ${task.testCases.length <= 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                                                <textarea
                                                                    placeholder="Input (stdin)"
                                                                    value={tc.input}
                                                                    onChange={e => handleTestCaseChange(task.id, tc.id, 'input', e.target.value)}
                                                                    rows="3"
                                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                                                />
                                                                <textarea
                                                                    placeholder="Expected Output"
                                                                    value={tc.expectedOutput}
                                                                    onChange={e => handleTestCaseChange(task.id, tc.id, 'expectedOutput', e.target.value)}
                                                                    rows="3"
                                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                                                />
                                                                <div className="lg:col-span-2">
                                                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                                                        Comparison Mode
                                                                    </label>
                                                                    <select
                                                                        value={tc.comparisonMode}
                                                                        onChange={e => handleTestCaseChange(task.id, tc.id, 'comparisonMode', e.target.value)}
                                                                        className="w-full md:w-1/3 px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm"
                                                                    >
                                                                        <option value="Exact">Exact Match</option>
                                                                        <option value="Contains">Contains</option>
                                                                        <option value="Regex">Regex</option>
                                                                        <option value="Float">Float (Approx)</option>
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => addTestCase(task.id)}
                                                    className="mt-3 flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm hover:bg-emerald-600 transition-colors"
                                                >
                                                    <Plus size={15} /> Add Test Case
                                                </button>
                                            </div>

                                            {/* Constraints */}
                                            <div>
                                                <h4 className="font-bold text-gray-800 mb-3">B. Code Constraints</h4>
                                                <div className="space-y-3">
                                                    {task.codeConstraints.map(constraint => (
                                                        <motion.div
                                                            key={String(constraint.id)}
                                                            initial={{ opacity: 0, y: 8 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className={`p-4 rounded-xl border-l-4 ${constraint.type === 'Required' ? 'bg-blue-50 border-blue-400' : 'bg-red-50 border-red-400'}`}
                                                        >
                                                            <div className="flex items-center justify-between mb-3">
                                                                <div className="flex items-center gap-2 font-bold text-gray-800 text-sm">
                                                                    {constraint.type === 'Required'
                                                                        ? <Check size={15} className="text-blue-500" />
                                                                        : <Ban size={15} className="text-red-500" />}
                                                                    {constraint.type} Constraint
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeConstraint(task.id, constraint.id)}
                                                                    className="text-gray-400 hover:text-red-500"
                                                                >
                                                                    <X size={15} />
                                                                </button>
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                                <div>
                                                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                                                        Construct
                                                                    </label>
                                                                    <select
                                                                        value={constraint.construct}
                                                                        onChange={e => handleConstraintChange(task.id, constraint.id, 'construct', e.target.value)}
                                                                        className="w-full px-3 py-2 border rounded-lg bg-white text-sm"
                                                                    >
                                                                        {CONSTRAINT_OPTIONS.map(opt => (
                                                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                                {([CODE_CONSTRUCTS.FOR_LOOP, CODE_CONSTRUCTS.WHILE_LOOP, CODE_CONSTRUCTS.IF_ELSE, 'LOOP'].includes(constraint.construct)) && (
                                                                    <>
                                                                        <div>
                                                                            <label className="block text-xs font-medium text-gray-500 mb-1">Min Nesting</label>
                                                                            <input
                                                                                type="number"
                                                                                value={constraint.specifics.minDepth}
                                                                                onChange={e => handleConstraintChange(task.id, constraint.id, 'specifics.minDepth', e.target.value)}
                                                                                min="0"
                                                                                className="w-full px-3 py-2 border rounded-lg text-sm"
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-xs font-medium text-gray-500 mb-1">Max Nesting</label>
                                                                            <input
                                                                                type="number"
                                                                                value={constraint.specifics.maxDepth}
                                                                                onChange={e => handleConstraintChange(task.id, constraint.id, 'specifics.maxDepth', e.target.value)}
                                                                                min="0"
                                                                                className="w-full px-3 py-2 border rounded-lg text-sm"
                                                                            />
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                                <div className="flex gap-3 mt-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => addConstraint(task.id, 'Required')}
                                                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                                                    >
                                                        <Plus size={15} /> Add Required
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => addConstraint(task.id, 'Forbidden')}
                                                        className="flex items-center gap-1.5 px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
                                                    >
                                                        <Plus size={15} /> Add Forbidden
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={addTask}
                            className="mt-5 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-xl hover:scale-[1.02] transition-all shadow-md font-semibold"
                        >
                            <Plus size={18} /> Add Task
                        </button>
                    </div>

                    {/* ══ SECTION 3: Instructions ═══════════════════════════════ */}
                    <div
                        ref={instructionsSectionRef}
                        className={`bg-white rounded-2xl p-8 shadow-xl border border-gray-100 transition-opacity ${activeSection === 'instructions' ? 'opacity-100' : 'opacity-75'}`}
                    >
                        <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg">
                                <FileText size={22} className="text-white" />
                            </div>
                            Competition Instructions
                        </h2>
                        <textarea
                            name="instructions"
                            value={formData.instructions}
                            onChange={handleInputChange}
                            placeholder="Rules, guidelines, allowed libraries, submission notes..."
                            rows="6"
                            className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 resize-none"
                        />
                    </div>

                    {/* ══ Action Buttons ════════════════════════════════════════ */}
                    <div className="flex flex-wrap gap-4 justify-center pt-4 pb-16">
                        <button
                            type="button"
                            onClick={() => navigate('/superadmin-competitions')}
                            className="flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                        >
                            <X size={18} /> Cancel
                        </button>
                        <button
                            type="button"
                            onClick={e => handleSubmit(e, 'Draft')}
                            disabled={isSubmitting}
                            className="flex items-center gap-2 border-2 border-indigo-600 text-indigo-600 px-6 py-3 rounded-xl font-semibold hover:bg-indigo-50 transition-colors disabled:opacity-50"
                        >
                            <Save size={18} /> Save as Draft
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Trophy size={18} /> Launch Competition
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </SuperAdminLayout>
    );
};

export default SuperAdminCreateCompetitionPage;
