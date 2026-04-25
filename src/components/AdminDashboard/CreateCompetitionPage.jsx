import axios from 'axios';
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Save, X, Plus, Trash2, Calendar, Clock, FileText, Code,
    Sparkles, Zap, Check, Ban, Trophy, Users, BookOpen
} from 'lucide-react';
import HtmlRequiredTags from '../TeacherDashboard/HtmlRequiredTags';
import HtmlNestingConstraints from '../TeacherDashboard/HtmlNestingConstraints';

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

const CreateCompetitionPage = () => {
    const tasksSectionRef = useRef(null);
    const instructionsSectionRef = useRef(null);
    const courseDropdownRef = useRef(null);
    const navigate = useNavigate();

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

    const [eligibility, setEligibility] = useState({
        courseIds: [],       // empty = open to all courses
        courseNames: [],
        classIds: [],        // empty = all classes in selected courses
        classNames: [],
        allClasses: true,
    });
    const [courseDropdownOpen, setCourseDropdownOpen] = useState(false);

    const [tasks, setTasks] = useState([
        {
            id: Date.now() + 1,
            title: 'Problem Statement',
            marks: 10,
            description: '',
            testCases: [{ id: Date.now(), input: '', expectedOutput: '', comparisonMode: 'Exact', notes: '', isHidden: false }],
            codeConstraints: [{ id: Date.now(), type: 'Required', construct: CODE_CONSTRUCTS.CUSTOM_FUNC, specifics: { minDepth: 0, maxDepth: 0 } }],
            htmlRequiredTags: [],
            htmlNestingConstraints: []
        }
    ]);

    const [availableCourses, setAvailableCourses] = useState([]);   // [{ _id, title, classes:[{_id,name}] }]
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [activeSection, setActiveSection] = useState('basic');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    /* ─── fetch courses for eligibility dropdown ───────────────── */
    useEffect(() => {
        const fetchCourses = async () => {
            try {
                setLoadingCourses(true);
                const token = localStorage.getItem('token');
                const res = await axios.get('http://localhost:5000/api/courses/admin/all', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setAvailableCourses(res.data || []);
            } catch (err) {
                console.error('Error fetching courses:', err);
            } finally {
                setLoadingCourses(false);
            }
        };
        fetchCourses();
    }, []);

    const selectedCourseObjects = availableCourses.filter(c => eligibility.courseIds.includes(c._id));
    // Combined unique classes from all selected courses
    const combinedClasses = selectedCourseObjects.reduce((acc, course) => {
        (course.classes || []).forEach(cls => {
            if (!acc.find(c => c._id === cls._id)) acc.push(cls);
        });
        return acc;
    }, []);

    /* ─── handlers ─────────────────────────────────────────────── */
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Close course dropdown when clicking outside
    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (courseDropdownRef.current && !courseDropdownRef.current.contains(e.target)) {
                setCourseDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    const handleCourseToggle = (courseId) => {
        const course = availableCourses.find(c => c._id === courseId);
        if (!course) return;
        setEligibility(prev => {
            const alreadySelected = prev.courseIds.includes(courseId);
            const newIds = alreadySelected
                ? prev.courseIds.filter(id => id !== courseId)
                : [...prev.courseIds, courseId];
            const newNames = alreadySelected
                ? prev.courseNames.filter(n => n !== course.title)
                : [...prev.courseNames, course.title];
            // Reset class selection when courses change
            return { ...prev, courseIds: newIds, courseNames: newNames, classIds: [], classNames: [], allClasses: true };
        });
    };

    const handleRemoveCourse = (courseId) => {
        const course = availableCourses.find(c => c._id === courseId);
        setEligibility(prev => ({
            ...prev,
            courseIds: prev.courseIds.filter(id => id !== courseId),
            courseNames: prev.courseNames.filter(n => n !== course?.title),
            classIds: [],
            classNames: [],
            allClasses: true,
        }));
    };

    const handleClassToggle = (classId, className) => {
        setEligibility(prev => {
            const alreadySelected = prev.classIds.includes(classId);
            const newIds = alreadySelected
                ? prev.classIds.filter(id => id !== classId)
                : [...prev.classIds, classId];
            const newNames = alreadySelected
                ? prev.classNames.filter(n => n !== className)
                : [...prev.classNames, className];
            return { ...prev, classIds: newIds, classNames: newNames, allClasses: newIds.length === 0 };
        });
    };

    const handleAllClassesToggle = () => {
        setEligibility(prev => ({ ...prev, classIds: [], classNames: [], allClasses: true }));
    };

    /* ─── task helpers ──────────────────────────────────────────── */
    const handleTaskChange = (id, field, value) =>
        setTasks(tasks.map(t => t.id === id ? { ...t, [field]: value } : t));

    const addTask = () => setTasks([...tasks, {
        id: Date.now(),
        title: '',
        marks: '',
        description: '',
        testCases: [{ id: Date.now(), input: '', expectedOutput: '', comparisonMode: 'Exact', notes: '', isHidden: false }],
        codeConstraints: [{ id: Date.now(), type: 'Required', construct: CODE_CONSTRUCTS.CUSTOM_FUNC, specifics: { minDepth: 0, maxDepth: 0 } }],
        htmlRequiredTags: [],
        htmlNestingConstraints: []
    }]);

    const removeTask = (id) => { if (tasks.length > 1) setTasks(tasks.filter(t => t.id !== id)); };

    const addTestCase = (taskId) => setTasks(tasks.map(t =>
        t.id === taskId ? { ...t, testCases: [...t.testCases, { id: Date.now(), input: '', expectedOutput: '', comparisonMode: 'Exact', notes: '', isHidden: false }] } : t
    ));

    const removeTestCase = (taskId, tcId) => setTasks(tasks.map(t =>
        t.id === taskId ? { ...t, testCases: t.testCases.filter(tc => tc.id !== tcId) } : t
    ));

    const handleTestCaseChange = (taskId, tcId, field, value) => setTasks(tasks.map(t =>
        t.id === taskId ? { ...t, testCases: t.testCases.map(tc => tc.id === tcId ? { ...tc, [field]: value } : tc) } : t
    ));

    const addConstraint = (taskId, type) => setTasks(tasks.map(t =>
        t.id === taskId ? { ...t, codeConstraints: [...t.codeConstraints, { id: Date.now(), type, construct: CONSTRAINT_OPTIONS[0].value, specifics: { minDepth: 0, maxDepth: 0 } }] } : t
    ));

    const removeConstraint = (taskId, cId) => setTasks(tasks.map(t =>
        t.id === taskId ? { ...t, codeConstraints: t.codeConstraints.filter(c => c.id !== cId) } : t
    ));

    const handleConstraintFieldChange = (taskId, cId, field, value) => setTasks(tasks.map(t =>
        t.id === taskId ? {
            ...t, codeConstraints: t.codeConstraints.map(c => c.id === cId
                ? (field.includes('specifics.')
                    ? { ...c, specifics: { ...c.specifics, [field.split('.')[1]]: parseInt(value) || 0 } }
                    : { ...c, [field]: value })
                : c)
        } : t
    ));

    const scrollToSection = (section) => {
        setActiveSection(section);
        if (section === 'tasks' && tasksSectionRef.current) tasksSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        else if (section === 'instructions' && instructionsSectionRef.current) instructionsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        else window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const toISODateTime = (date, time) => {
        if (!date || !time) return null;
        const d = new Date(`${date}T${time}`);
        return isNaN(d.getTime()) ? null : d.toISOString();
    };

    /* ─── submit ────────────────────────────────────────────────── */
    const handleSubmit = async (e, statusOverride = 'Active') => {
        if (e) e.preventDefault();
        setIsSubmitting(true);
        setSubmitError(null);

        const startDateTime = toISODateTime(formData.startDate, formData.startTime);
        const dueDateTime = toISODateTime(formData.dueDate, formData.dueTime);

        if (!startDateTime || !dueDateTime) {
            setSubmitError('Invalid date/time format.');
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
                title: task.title.trim(),
                marks: Number(task.marks) || 0,
                description: task.description
            };
            if (isHtml) {
                return {
                    ...base,
                    testCases: [],
                    codeConstraints: [],
                    htmlRequiredTags: task.htmlRequiredTags.map(({ id, ...t }) => ({
                        tag: t.tag, minCount: Number(t.minCount) || 1,
                        maxCount: Number(t.maxCount) || 0, message: t.message || ''
                    })),
                    htmlNestingConstraints: task.htmlNestingConstraints.map(stripIds)
                };
            }
            return {
                ...base,
                testCases: task.testCases.map(tc => ({
                    input: tc.input, expectedOutput: tc.expectedOutput,
                    comparisonMode: tc.comparisonMode || 'Exact',
                    isHidden: !!tc.isHidden, notes: tc.notes || ''
                })),
                codeConstraints: task.codeConstraints.map(c => ({
                    construct: c.construct, type: c.type,
                    specifics: { minDepth: Number(c.specifics.minDepth) || 0, maxDepth: Number(c.specifics.maxDepth) || 0 }
                })),
                htmlRequiredTags: [],
                htmlNestingConstraints: []
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
            status: statusOverride,
            eligibility: {
                courseIds: eligibility.courseIds,
                courseNames: eligibility.courseNames,
                classIds: eligibility.allClasses ? [] : eligibility.classIds,
                classNames: eligibility.allClasses ? [] : eligibility.classNames,
            },
            tasks: mappedTasks,
            adminId: localStorage.getItem('userId'),
            adminName: localStorage.getItem('fullName') || ''
        };

        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/competitions', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert(`Competition "${formData.title}" created successfully!`);
            navigate('/admin');
        } catch (err) {
            console.error('Competition creation error:', err.response?.data);
            setSubmitError(err.response?.data?.message || err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    /* ─── sub-components ──────────────────────────────────────── */
    const FloatingParticles = () => (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(15)].map((_, i) => (
                <div key={i} className="absolute w-1 h-1 bg-indigo-300/20 rounded-full animate-float"
                    style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 8}s`, animationDuration: `${20 + Math.random() * 15}s` }}
                />
            ))}
        </div>
    );

    const ProgressIndicator = () => (
        <div className="flex items-center justify-center mb-8">
            {[
                { key: 'basic', label: 'Setup' },
                { key: 'tasks', label: 'Tasks' },
                { key: 'instructions', label: 'Instructions' }
            ].map((item, index) => (
                <React.Fragment key={item.key}>
                    <div className={`flex flex-col items-center cursor-pointer transition-all duration-500 ${activeSection === item.key ? 'scale-110' : 'scale-100'}`} onClick={() => scrollToSection(item.key)}>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${activeSection === item.key ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'border-gray-300 text-gray-400'}`}>{index + 1}</div>
                        <span className={`text-xs mt-2 font-medium capitalize transition-colors duration-300 ${activeSection === item.key ? 'text-indigo-600' : 'text-gray-500'}`}>{item.label}</span>
                    </div>
                    {index < 2 && <div className={`w-16 h-1 mx-2 transition-all duration-500 ${activeSection === item.key ? 'bg-indigo-600' : 'bg-gray-200'}`} />}
                </React.Fragment>
            ))}
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 relative overflow-hidden">
            <FloatingParticles />
            <div className="absolute top-0 -left-20 w-80 h-80 bg-gradient-to-r from-cyan-400/10 to-blue-500/10 rounded-full blur-3xl animate-pulse-slow" />
            <div className="absolute bottom-0 -right-20 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-pink-500/10 rounded-full blur-3xl animate-pulse-slower" />

            {/* Navbar */}
            <motion.nav initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }} className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/admin')}>
                            <span className="text-indigo-600 font-bold text-xl">&lt;/&gt;</span>
                            <span className="text-indigo-600 font-bold text-xl">Codezy</span>
                        </div>
                        <div className="hidden md:flex space-x-8 font-medium">
                            <button onClick={() => navigate('/admin')} className="hover:text-indigo-600 transition">Dashboard</button>
                            <button onClick={() => navigate('/admin/courses')} className="hover:text-indigo-600 transition">Courses</button>
                            <span className="text-indigo-600 border-b-2 border-indigo-600">Create Competition</span>
                        </div>
                    </div>
                </div>
            </motion.nav>

            <div className="max-w-6xl mx-auto p-6 relative z-10">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center justify-center gap-3">
                        <Trophy size={36} className="text-yellow-500" /> Create Institution Competition
                    </h1>
                    <p className="text-gray-600 text-lg">Set up a coding competition for your students with custom tasks and eligibility criteria</p>
                    <div className="flex justify-center mt-4"><Sparkles className="text-yellow-500 animate-spin-slow" size={24} /></div>
                </div>

                <ProgressIndicator />

                <form onSubmit={(e) => handleSubmit(e, 'Active')} className="space-y-8">
                    {submitError && (
                        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative shadow-md">
                            <strong className="font-bold mr-2">Error:</strong>
                            <span>{submitError}</span>
                            <span onClick={() => setSubmitError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer"><X size={20} /></span>
                        </motion.div>
                    )}

                    {/* ── SECTION 1: Basic Info ── */}
                    <div className={`bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20 transition-all duration-700 ${activeSection === 'basic' ? 'scale-100 opacity-100' : 'scale-95 opacity-70'}`}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg shadow-lg"><FileText size={28} className="text-white" /></div>
                                Competition Details
                            </h2>
                            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">Required</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Title */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Trophy size={16} className="text-yellow-500" /> Competition Title *</label>
                                <input type="text" name="title" value={formData.title} onChange={handleInputChange} placeholder="e.g., DSA Championship – Spring 2026" className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 transition-all" required />
                            </div>

                            {/* Language */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Code size={16} className="text-indigo-500" /> Programming Language *</label>
                                <select name="language" value={formData.language} onChange={handleInputChange} className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white">
                                    <option value="python">🐍 Python 3.11</option>
                                    <option value="java">☕ Java 17</option>
                                    <option value="cpp">⚡ C++ 17</option>
                                    <option value="html">🌐 HTML</option>
                                </select>
                            </div>

                            {/* Difficulty */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">Difficulty Level</label>
                                <select name="difficulty" value={formData.difficulty} onChange={handleInputChange} className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white">
                                    <option value="Easy">🎯 Easy</option>
                                    <option value="Medium">⚡ Medium</option>
                                    <option value="Hard">🔥 Hard</option>
                                </select>
                            </div>

                            {/* Start Date */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Calendar size={16} className="text-green-600" /> Start Date *</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500" required />
                                </div>
                            </div>

                            {/* Start Time */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Clock size={16} className="text-green-600" /> Start Time *</label>
                                <div className="relative">
                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input type="time" name="startTime" value={formData.startTime} onChange={handleInputChange} className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500" required />
                                </div>
                            </div>

                            {/* Due Date */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Calendar size={16} className="text-indigo-600" /> Due Date *</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input type="date" name="dueDate" value={formData.dueDate} onChange={handleInputChange} className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500" required />
                                </div>
                            </div>

                            {/* Due Time */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Clock size={16} className="text-indigo-600" /> Due Time *</label>
                                <div className="relative">
                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input type="time" name="dueTime" value={formData.dueTime} onChange={handleInputChange} className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500" required />
                                </div>
                            </div>

                            {/* Total Marks */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Zap size={16} className="text-red-500" /> Total Marks *</label>
                                <input type="number" name="totalMarks" value={formData.totalMarks} onChange={handleInputChange} placeholder="e.g., 100" min="1" className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500" required />
                            </div>

                            {/* Description */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-3">Description</label>
                                <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Brief overview of the competition..." rows="3" className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 resize-none" />
                            </div>
                        </div>

                        {/* ── Eligibility Section ── */}
                        <div className="mt-8 pt-8 border-t-2 border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg shadow-lg"><Users size={22} className="text-white" /></div>
                                Eligibility Criteria
                            </h3>
                            <p className="text-sm text-gray-500 mb-5">Restrict participation to specific courses or classes. Leave empty to make it open to all students.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Multi-select Course Dropdown */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><BookOpen size={16} className="text-indigo-500" /> Select Courses</label>

                                    {/* Custom dropdown trigger */}
                                    <div className="relative" ref={courseDropdownRef}>
                                        <button
                                            type="button"
                                            onClick={() => setCourseDropdownOpen(o => !o)}
                                            disabled={loadingCourses}
                                            className="w-full flex items-center justify-between px-4 py-4 border-2 border-gray-200 rounded-xl bg-white hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50"
                                        >
                                            <span className="text-sm text-gray-500">
                                                {loadingCourses
                                                    ? 'Loading courses...'
                                                    : eligibility.courseIds.length === 0
                                                        ? 'All Courses (Open to Everyone)'
                                                        : `${eligibility.courseIds.length} course${eligibility.courseIds.length > 1 ? 's' : ''} selected`}
                                            </span>
                                            <svg className={`w-5 h-5 text-gray-400 transition-transform ${courseDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                        </button>

                                        {/* Dropdown list */}
                                        {courseDropdownOpen && !loadingCourses && (
                                            <div className="absolute z-30 top-full mt-1 w-full bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-56 overflow-y-auto">
                                                {availableCourses.length === 0 ? (
                                                    <div className="px-4 py-3 text-sm text-gray-400 text-center">No courses found</div>
                                                ) : availableCourses.map(course => {
                                                    const isSelected = eligibility.courseIds.includes(course._id);
                                                    return (
                                                        <button
                                                            key={course._id}
                                                            type="button"
                                                            onClick={() => handleCourseToggle(course._id)}
                                                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors hover:bg-indigo-50 ${isSelected ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'}`}
                                                        >
                                                            <span className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                                                                {isSelected && <Check size={12} className="text-white" />}
                                                            </span>
                                                            <span className="font-medium">{course.title}</span>
                                                            {course.courseCode && <span className="ml-auto text-xs text-gray-400">{course.courseCode}</span>}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Selected course chips/bubbles */}
                                    {eligibility.courseIds.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {eligibility.courseIds.map((id, idx) => (
                                                <span key={id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold border border-indigo-200">
                                                    <BookOpen size={12} />
                                                    {eligibility.courseNames[idx] || id}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveCourse(id)}
                                                        className="ml-0.5 hover:text-red-500 transition-colors rounded-full"
                                                        aria-label={`Remove ${eligibility.courseNames[idx]}`}
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Class selection – only show when at least one course is selected */}
                                {eligibility.courseIds.length > 0 && combinedClasses.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">Select Classes</label>
                                        <div className="border-2 border-gray-200 rounded-xl p-4 max-h-48 overflow-y-auto space-y-2 bg-white">
                                            {/* All classes option */}
                                            <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-indigo-50 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={eligibility.allClasses}
                                                    onChange={handleAllClassesToggle}
                                                    className="form-checkbox text-indigo-600 rounded"
                                                />
                                                <span className="text-sm font-semibold text-indigo-600">All Classes</span>
                                            </label>
                                            <hr className="border-gray-200" />
                                            {combinedClasses.map(cls => (
                                                <label key={cls._id} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        checked={eligibility.classIds.includes(cls._id)}
                                                        onChange={() => handleClassToggle(cls._id, cls.name)}
                                                        className="form-checkbox text-indigo-600 rounded"
                                                    />
                                                    <span className="text-sm text-gray-700">{cls.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                        {!eligibility.allClasses && eligibility.classIds.length > 0 && (
                                            <p className="text-xs text-indigo-600 mt-2 font-medium">
                                                {eligibility.classIds.length} class(es) selected
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Eligibility summary badge */}
                            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-full text-sm text-indigo-700 font-medium">
                                <Check size={14} className="text-indigo-500" />
                                {eligibility.courseIds.length === 0
                                    ? 'Open to all students'
                                    : eligibility.allClasses
                                        ? `All classes in: ${eligibility.courseNames.join(', ')}`
                                        : `${eligibility.courseNames.join(', ')} – ${eligibility.classNames.join(', ')}`
                                }
                            </div>
                        </div>
                    </div>

                    {/* ── SECTION 2: Tasks ── */}
                    <div ref={tasksSectionRef} className={`bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20 transition-all duration-700 ${activeSection === 'tasks' ? 'scale-100 opacity-100' : 'scale-95 opacity-70'}`}>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg shadow-lg"><Code size={28} className="text-white" /></div>
                            Competition Tasks
                        </h2>

                        <div className="space-y-6">
                            {tasks.map((task, index) => (
                                <div key={task.id} className="border-2 border-gray-200 rounded-2xl p-6 bg-white/50 backdrop-blur-sm hover:shadow-xl transition-all duration-500">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">{index + 1}</div>
                                            <h3 className="font-bold text-gray-900 text-lg">Task {index + 1}</h3>
                                        </div>
                                        {tasks.length > 1 && (
                                            <button type="button" onClick={() => removeTask(task.id)} className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={20} /></button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b pb-4 mb-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Task Title</label>
                                            <input type="text" value={task.title} onChange={(e) => handleTaskChange(task.id, 'title', e.target.value)} placeholder="Task title" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Marks</label>
                                            <input type="number" value={task.marks} onChange={(e) => handleTaskChange(task.id, 'marks', e.target.value)} placeholder="10" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500" />
                                        </div>
                                        <div className="md:col-span-3">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Task Description / Problem Statement</label>
                                            <textarea value={task.description} onChange={(e) => handleTaskChange(task.id, 'description', e.target.value)} placeholder="Describe the problem..." rows="3" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 resize-none" />
                                        </div>
                                    </div>

                                    {formData.language === 'html' ? (
                                        <>
                                            <HtmlRequiredTags tags={task.htmlRequiredTags} onChange={(t) => handleTaskChange(task.id, 'htmlRequiredTags', t)} />
                                            <HtmlNestingConstraints constraints={task.htmlNestingConstraints} onChange={(c) => handleTaskChange(task.id, 'htmlNestingConstraints', c)} />
                                        </>
                                    ) : (
                                        <>
                                            {/* Test Cases */}
                                            <div className="mt-4 pt-4 border-t border-gray-200">
                                                <h4 className="text-xl font-bold text-gray-800 mb-4">A. Test Cases</h4>
                                                <div className="space-y-4">
                                                    {task.testCases.map((tc, tcIndex) => (
                                                        <div key={tc.id} className="p-4 border border-gray-300 rounded-xl bg-white shadow-sm">
                                                            <div className="flex justify-between items-center mb-3 border-b pb-2">
                                                                <span className="font-semibold text-gray-700">Test Case #{tcIndex + 1}</span>
                                                                <div className="flex items-center space-x-3">
                                                                    <label className="flex items-center gap-1 text-sm text-gray-600">
                                                                        <input type="checkbox" checked={tc.isHidden} onChange={(e) => handleTestCaseChange(task.id, tc.id, 'isHidden', e.target.checked)} className="form-checkbox text-indigo-600 rounded" />
                                                                        <span className="font-medium">Hidden</span>
                                                                    </label>
                                                                    <button type="button" onClick={() => removeTestCase(task.id, tc.id)} disabled={task.testCases.length <= 1} className={`text-red-500 ${task.testCases.length > 1 ? 'opacity-100' : 'opacity-30 cursor-not-allowed'}`}><Trash2 size={18} /></button>
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                                <textarea placeholder="Input (stdin)" value={tc.input} onChange={(e) => handleTestCaseChange(task.id, tc.id, 'input', e.target.value)} rows="3" className="w-full px-3 py-2 border rounded-lg" />
                                                                <textarea placeholder="Expected Output" value={tc.expectedOutput} onChange={(e) => handleTestCaseChange(task.id, tc.id, 'expectedOutput', e.target.value)} rows="3" className="w-full px-3 py-2 border rounded-lg" />
                                                                <div className="lg:col-span-2">
                                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Comparison Mode</label>
                                                                    <select value={tc.comparisonMode} onChange={(e) => handleTestCaseChange(task.id, tc.id, 'comparisonMode', e.target.value)} className="w-full md:w-1/3 px-3 py-2 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500">
                                                                        <option value="Exact">Exact Match</option>
                                                                        <option value="Contains">Contains (Partial)</option>
                                                                        <option value="Regex">Regex Match</option>
                                                                        <option value="Float">Float (Approximate)</option>
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <button type="button" onClick={() => addTestCase(task.id)} className="mt-4 flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                                                    <Plus size={18} className="mr-1" /> Add Test Case
                                                </button>
                                            </div>

                                            {/* Constraints */}
                                            <div className="mt-8 pt-4 border-t border-gray-200">
                                                <h4 className="text-xl font-bold text-gray-800 mb-4">B. Code Structure Constraints</h4>
                                                <div className="space-y-4">
                                                    {task.codeConstraints.map((constraint) => (
                                                        <motion.div key={constraint.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`p-4 rounded-xl shadow-md border-l-4 ${constraint.type === 'Required' ? 'bg-blue-50 border-blue-500' : 'bg-red-50 border-red-500'}`}>
                                                            <div className="flex items-center justify-between mb-3 font-bold text-gray-800">
                                                                <div className="flex items-center gap-2">{constraint.type === 'Required' ? <Check size={18} className="text-blue-500" /> : <Ban size={18} className="text-red-500" />} {constraint.type} Constraint</div>
                                                                <button type="button" onClick={() => removeConstraint(task.id, constraint.id)} className="text-gray-400 hover:text-red-600"><X size={16} /></button>
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                                                <div className="col-span-1">
                                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Construct Type</label>
                                                                    <select value={constraint.construct} onChange={(e) => handleConstraintFieldChange(task.id, constraint.id, 'construct', e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white">
                                                                        {CONSTRAINT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                                                    </select>
                                                                </div>
                                                                {([CODE_CONSTRUCTS.FOR_LOOP, CODE_CONSTRUCTS.WHILE_LOOP, CODE_CONSTRUCTS.IF_ELSE].includes(constraint.construct) || constraint.construct === 'LOOP') && (
                                                                    <>
                                                                        <div>
                                                                            <label className="block text-xs font-medium text-gray-500 mb-1">Min Nesting</label>
                                                                            <input type="number" value={constraint.specifics.minDepth} onChange={(e) => handleConstraintFieldChange(task.id, constraint.id, 'specifics.minDepth', e.target.value)} min="0" className="w-full px-3 py-2 border rounded-lg" />
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-xs font-medium text-gray-500 mb-1">Max Nesting</label>
                                                                            <input type="number" value={constraint.specifics.maxDepth} onChange={(e) => handleConstraintFieldChange(task.id, constraint.id, 'specifics.maxDepth', e.target.value)} min="0" className="w-full px-3 py-2 border rounded-lg" />
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                                <div className="mt-4 flex gap-4">
                                                    <button type="button" onClick={() => addConstraint(task.id, 'Required')} className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"><Plus size={18} className="mr-1" /> Add Required</button>
                                                    <button type="button" onClick={() => addConstraint(task.id, 'Forbidden')} className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"><Plus size={18} className="mr-1" /> Add Forbidden</button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>

                        <button type="button" onClick={addTask} className="mt-6 w-full flex items-center justify-center gap-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-xl hover:scale-[1.02] transition-all duration-300 group shadow-lg">
                            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" /> Add Task
                        </button>
                    </div>

                    {/* ── SECTION 3: Instructions ── */}
                    <div ref={instructionsSectionRef} className={`bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20 transition-all duration-700 ${activeSection === 'instructions' ? 'scale-100 opacity-100' : 'scale-95 opacity-70'}`}>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg shadow-lg"><FileText size={28} className="text-white" /></div>
                            Competition Instructions
                        </h2>
                        <textarea name="instructions" value={formData.instructions} onChange={handleInputChange} placeholder="Rules, guidelines, allowed libraries, submission notes..." rows="6" className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 resize-none" />
                    </div>

                    {/* ── Action Buttons ── */}
                    <div className="flex gap-6 justify-center pt-8 pb-12">
                        <button type="button" onClick={() => navigate('/admin')} className="flex items-center gap-3 bg-gradient-to-r from-gray-400 to-gray-600 text-white px-8 py-4 rounded-xl hover:scale-105 transition-all duration-300">
                            <X size={20} /> <span className="font-semibold">Cancel</span>
                        </button>

                        <button type="button" onClick={(e) => handleSubmit(e, 'Draft')} disabled={isSubmitting} className={`flex items-center gap-3 bg-white border-2 border-indigo-600 text-indigo-600 px-8 py-4 rounded-xl hover:scale-105 transition-all duration-300 ${isSubmitting ? 'opacity-50' : ''}`}>
                            <FileText size={20} /> <span className="font-semibold">Save as Draft</span>
                        </button>

                        <button type="submit" disabled={isSubmitting} className={`flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:scale-105 transition-all duration-300 shadow-lg ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            {isSubmitting
                                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                : <><Trophy size={20} /> <span className="font-semibold">Launch Competition</span></>
                            }
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
                @keyframes float { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-20px) rotate(180deg)} }
                @keyframes pulse-slow { 0%,100%{opacity:.5} 50%{opacity:.8} }
                @keyframes pulse-slower { 0%,100%{opacity:.3} 50%{opacity:.6} }
                @keyframes spin-slow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
                .animate-float { animation:float 25s ease-in-out infinite }
                .animate-pulse-slow { animation:pulse-slow 4s ease-in-out infinite }
                .animate-pulse-slower { animation:pulse-slower 6s ease-in-out infinite }
                .animate-spin-slow { animation:spin-slow 8s linear infinite }
            `}</style>
        </div>
    );
};

export default CreateCompetitionPage;
