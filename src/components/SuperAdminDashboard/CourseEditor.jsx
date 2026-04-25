import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { 
  Video, Code, HelpCircle, Save, Plus, Trash2, ArrowLeft, Sliders,
  Layers, X, Check, Ban, BookOpen, GraduationCap, Upload, Link, FolderPlus, Eye
} from 'lucide-react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import SuperAdminLayout from './SuperAdminLayout';

const CONSTRAINT_OPTIONS = [
    { label: 'Loops (Any)', value: 'LOOP' },
    { label: 'For Loop', value: 'for loop' },
    { label: 'While Loop', value: 'while loop' },
    { label: 'Recursion', value: 'Recursion' },
    { label: 'If-Else', value: 'if-else statement' },
    { label: 'Arrays/Lists', value: 'Array/List' },
    { label: 'Built-in Sort', value: 'Built-in Sort Function' },
];

const DOMAINS = [
    'Web Development', 'Mobile App Development', 'Data Science', 'Machine Learning', 
    'Cybersecurity', 'Cloud Computing', 'DevOps', 'Blockchain', 'Game Development', 
    'Software Engineering', 'Artificial Intelligence', 'System Design'
];

const ALLOWED_THUMB_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_THUMB_SIZE = 2 * 1024 * 1024; // 2 MB

const CourseEditor = () => {
  const navigate = useNavigate();
  const { courseId } = useParams(); 
  const fileInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [activeLesson, setActiveLesson] = useState(null); 
  const [isSpecialization, setIsSpecialization] = useState(false);
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode");
  const isViewMode = mode === "view"; 
  const [activeModuleId, setActiveModuleId] = useState(null);
  
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    instructor: '',
    price: 0,
    duration: '',
    thumbnail: '',
    domain: 'Web Development',
    difficulty: 'Beginner',
    modules: [
        { 
        id: Date.now().toString(), 
        title: "Module 1", 
        lessons: [], 
        isCourseWrapper: false 
        }
    ]
});

useEffect(() => {
  if (courseId) {
    const loadCourseData = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL || `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}`}/api/curriculum/global-courses/${courseId}`);
        if (!res.data) return;

        let loaded = res.data;

        // Normalize a single lesson — guarantee it always has a string `id`
        const normalizeLesson = (l, fallbackIdx) => ({
          ...l,
          id: l.id
            ? String(l.id)
            : l._id
            ? String(l._id)
            : `lesson-${fallbackIdx}-${Date.now()}`
        });

        // Normalize a single module (or subModule)
        const normalizeModule = (m, fallbackIdx) => ({
          ...m,
          id: m.id
            ? String(m.id)
            : m._id
            ? String(m._id)
            : `mod-${fallbackIdx}-${Date.now()}`,
          lessons: (m.lessons || []).map((l, li) => normalizeLesson(l, li)),
          subModules: (m.subModules || []).map((sm, si) => ({
            ...sm,
            id: sm.id
              ? String(sm.id)
              : sm._id
              ? String(sm._id)
              : `sm-${si}-${Date.now()}`,
            lessons: (sm.lessons || []).map((l, li) => normalizeLesson(l, li))
          }))
        });

        if (loaded.isSpecialization && loaded.childCourses?.length > 0) {
          loaded.modules = loaded.childCourses.map((c, ci) => ({
            id: c.id
              ? String(c.id)
              : c._id
              ? String(c._id)
              : `course-${ci}-${Date.now()}`,
            title: c.title,
            isCourseWrapper: true,
            // childCourse modules become subModules in the frontend tree
            subModules: (c.modules || []).map((m, mi) => normalizeModule(m, mi))
          }));
        } else {
          loaded.modules = (loaded.modules || []).map((m, mi) => normalizeModule(m, mi));
        }

        setCourseData(loaded);
        setIsSpecialization(loaded.isSpecialization || false);
      } catch (err) {
        console.error("Load failed:", err);
      } finally {
        setLoading(false);
      }
    };
    loadCourseData();
  }
}, [courseId]);

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!ALLOWED_THUMB_TYPES.includes(file.type)) {
      alert('Only JPEG, PNG, and WebP images are allowed.');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_THUMB_SIZE) {
      alert('Thumbnail must be under 2 MB.');
      e.target.value = '';
      return;
    }
    try {
      setThumbnailUploading(true);
      const formData = new FormData();
      formData.append('thumbnail', file);
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL || `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}`}/api/curriculum/global-courses/upload-thumbnail`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      setCourseData(prev => ({ ...prev, thumbnail: res.data.thumbnailUrl }));
    } catch (err) {
      alert('Thumbnail upload failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setThumbnailUploading(false);
      e.target.value = '';
    }
  };

  const handleToggleSpecialization = (checked) => {
    if (isViewMode) return;
    setIsSpecialization(checked);
    setCourseData(prev => ({
      ...prev,
      modules: prev.modules.map((m, idx) => ({
        ...m,
        title: checked ? `Course ${idx + 1}` : `Module ${idx + 1}`,
        isCourseWrapper: checked,
        subModules: (checked && (!m.subModules || m.subModules.length === 0)) 
          ? [{ id: `sm-${Date.now()}`, title: "Module 1", lessons: [] }] 
          : m.subModules
      }))
    }));
  };

 const syncLesson = (updatedLesson) => {
  if (isViewMode) return;
  setActiveLesson(updatedLesson);
  setCourseData(prev => ({
    ...prev,
    modules: prev.modules.map(mod => ({
      ...mod,
      // For non-specialization: only update lesson if it's in the active module
      lessons: (mod.lessons || []).map(ls =>
        ls.id === updatedLesson.id && mod.id === activeModuleId
          ? updatedLesson
          : ls
      ),
      subModules: (mod.subModules || []).map(sm => ({
        ...sm,
        // For specialization: only update lesson if it's in the active subModule
        lessons: (sm.lessons || []).map(l =>
          l.id === updatedLesson.id && sm.id === activeModuleId
            ? updatedLesson
            : l
        )
      }))
    }))
  }));
};

  const addTopLevelCourse = () => {
    if (isViewMode) return;
    setCourseData(prev => ({
      ...prev,
      modules: [...prev.modules, { 
        id: Date.now().toString(), 
        title: `Course ${prev.modules.filter(m => m.isCourseWrapper).length + 1}`, 
        lessons: [], 
        isCourseWrapper: true,
        subModules: [{ id: `sm-${Date.now()}`, title: "Module 1", lessons: [] }]
      }]
    }));
  };

  const replicateModuleCard = () => {
    if (isViewMode) return;
    if (isSpecialization) {
        const updated = [...courseData.modules];
        const lastIdx = updated.length - 1;
        if (lastIdx < 0) return addTopLevelCourse();
        updated[lastIdx].subModules = [
            ...(updated[lastIdx].subModules || []),
            { id: Date.now().toString(), title: `Module ${(updated[lastIdx].subModules?.length || 0) + 1}`, lessons: [] }
        ];
        setCourseData(prev => ({ ...prev, modules: updated }));
    } else {
        setCourseData(prev => ({
            ...prev,
            modules: [...prev.modules, { id: Date.now().toString(), title: `Module ${prev.modules.length + 1}`, lessons: [] }]
        }));
    }
  };

  const addLesson = (containerId, type, isSubLayer = false) => {
    if (isViewMode) return;
    const newLesson = { 
      id: Date.now().toString(), 
      type, title: `New ${type}`, videoUrl: '', 
      labConfig: { language: 'nodejs', code: '', problemStatement: '', testCases: [], codeConstraints: [] }, 
      quizData: type === 'quiz' ? [{ id: `q-${Date.now()}`, question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '' }] : [], 
      studyMaterial: '' 
    };
    setCourseData(prev => ({
      ...prev,
      modules: prev.modules.map(m => {
        if (!isSubLayer && m.id === containerId) return { ...m, lessons: [...(m.lessons || []), newLesson] };
        if (isSubLayer) return {
            ...m, subModules: (m.subModules || []).map(sm => sm.id === containerId ? { ...sm, lessons: [...(sm.lessons || []), newLesson] } : sm)
        };
        return m;
      })
    }));
    setActiveLesson(newLesson);
    setActiveModuleId(containerId);
  };
 
  const handlePublish = async () => {
    if (isViewMode) return;
   if ( !courseData.title.trim() || !courseData.description.trim() || !courseData.instructor.trim()) {
        alert("Please fill Title, Description and Instructor");
        return;
    }   
    setLoading(true);
    try {
        let finalPayload = { ...courseData, isSpecialization };
        finalPayload.isPublished = true;
        if (isSpecialization) {
            finalPayload.childCourses = courseData.modules.map((cw, i) => ({
                // Preserve existing child course _id so learner progress references stay valid
                ...(/^[a-f\d]{24}$/i.test(cw.id) ? { _id: cw.id } : {}),
                title: cw.title,
                modules: cw.subModules || [],
                difficulty: courseData.difficulty,
                order: i
            }));
            finalPayload.modules = [];
        }
        const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL || `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}`}/api/curriculum/global-courses`, finalPayload);
        if (res.data.data?._id) setCourseData(prev => ({ ...prev, _id: res.data.data._id }));
        alert("Course published successfully!");
        navigate('/superadmin-courses');
    } catch (err) { alert("Save failed."); } finally { setLoading(false); }
  };

  return (
    <SuperAdminLayout title={isViewMode ? "Curriculum Viewer" : (isSpecialization ? "Path Architect" : "Global Studio")}>
      <div className="flex h-[calc(100vh-100px)] -m-8 overflow-hidden bg-gray-50">
        <aside className="w-1/3 bg-white border-r border-gray-200 flex flex-col shadow-sm shrink-0">
          <div className="p-5 border-b border-gray-100">
            <button onClick={() => navigate('/superadmin-courses')} className="flex items-center gap-2 text-gray-400 hover:text-indigo-600 mb-4 text-[10px] font-bold uppercase"><ArrowLeft size={12} /> Library</button>
            <div className="flex items-center justify-between">
                <h2 className="font-black text-lg text-gray-800 tracking-tight cursor-pointer" onClick={() => setActiveLesson(null)}>
                    {isSpecialization ? "SPECIALIZATION" : "COURSE TREE"}
                </h2>
                <div className="flex flex-col items-center bg-indigo-50 p-1.5 rounded-lg border border-indigo-100">
                    <input type="checkbox" disabled={isViewMode} checked={isSpecialization} onChange={(e) => handleToggleSpecialization(e.target.checked)} className="accent-indigo-600 w-3.5 h-3.5 cursor-pointer" />
                    <span className="text-[7px] font-black mt-0.5 text-indigo-600 uppercase">Special</span>
                </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {courseData.modules.map((mod, mIdx) => (
              <div key={mod.id} className="space-y-3">
                {isSpecialization && (
                    <div className="flex items-center justify-between px-3 py-2 bg-indigo-50/50 rounded-xl border border-indigo-100">
                        <input readOnly={isViewMode} className="font-black text-gray-800 bg-transparent outline-none text-xs w-full truncate" value={mod.title} onChange={(e) => {
                            const newMods = [...courseData.modules];
                            newMods[mIdx].title = e.target.value;
                            setCourseData({...courseData, modules: newMods});
                        }} />
                        {!isViewMode && <button onClick={() => setCourseData(p => ({...p, modules: p.modules.filter(m => m.id !== mod.id)}))} className="text-gray-300 hover:text-red-500 shrink-0"><Trash2 size={14}/></button>}
                    </div>
                )}
                {(isSpecialization ? (mod.subModules || []) : [mod]).map((sm, smIdx) => (
                    <div key={sm.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3 relative group">
                        <div className="flex items-center justify-between">
                            <input readOnly={isViewMode} className="font-bold text-gray-700 bg-transparent outline-none text-xs w-full truncate" value={sm.title} onChange={(e) => {
                                const updated = [...courseData.modules];
                                if (isSpecialization) updated[mIdx].subModules[smIdx].title = e.target.value;
                                else updated[mIdx].title = e.target.value;
                                setCourseData({...courseData, modules: updated});
                            }} />
                            {!isViewMode && (
                                <button onClick={() => setCourseData(p => {
                                    const up = [...p.modules];
                                    if(isSpecialization) up[mIdx].subModules = up[mIdx].subModules.filter(x => x.id !== sm.id);
                                    else return {...p, modules: p.modules.filter(x => x.id !== sm.id)};
                                    return {...p, modules: up};
                                })} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12}/></button>
                            )}
                        </div>
                        <div className="space-y-1">
                            {(sm.lessons || []).map((ls, lIdx) => (
                                <div key={ls.id || `ls-${lIdx}` || `lesson-${smIdx}-${lIdx}`} className="flex items-center gap-1 group/ls">
                                    <button onClick={() => {
                                                setActiveLesson(ls);
                                                setActiveModuleId(sm.id);
                                            }} className={`flex-1 flex items-center gap-2 p-2 rounded-lg text-[10px] font-bold ${activeLesson?.id === ls.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}>
                                                                                    {ls.type === 'video' ? <Video size={10}/> : ls.type === 'lab' ? <Code size={10}/> : <HelpCircle size={10}/>}
                                        <span className="truncate pr-5">{ls.title}</span>
                                    </button>
                                    {!isViewMode && (
                                        <button onClick={() => setCourseData(p => ({
                                            ...p,
                                            modules: p.modules.map(m => ({
                                                ...m,
                                                lessons: (m.lessons || []).filter(l => l.id !== ls.id),
                                                subModules: (m.subModules || []).map(sub => ({...sub, lessons: sub.lessons.filter(l => l.id !== ls.id)}))
                                            }))
                                        }))} className="text-gray-300 hover:text-red-500 p-1 opacity-0 group-hover/ls:opacity-100 transition-opacity"><X size={12}/></button>
                                    )}
                                </div>
                            ))}
                        </div>
                        {!isViewMode && (
                          <div className="grid grid-cols-3 gap-1 pt-1 border-t border-gray-50 mt-1">
                              <button onClick={() => addLesson(sm.id, 'video', isSpecialization)} className="p-1.5 bg-blue-50 text-blue-600 rounded-md flex justify-center hover:bg-blue-100"><Video size={12}/></button>
                              <button onClick={() => addLesson(sm.id, 'lab', isSpecialization)} className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md flex justify-center hover:bg-emerald-100"><Code size={12}/></button>
                              <button onClick={() => addLesson(sm.id, 'quiz', isSpecialization)} className="p-1.5 bg-orange-50 text-orange-600 rounded-md flex justify-center hover:bg-orange-100"><HelpCircle size={12}/></button>
                          </div>
                        )}
                    </div>
                ))}
              </div>
            ))}
            {!isViewMode && (
                <div className="space-y-2">
                    <button onClick={replicateModuleCard} className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:border-indigo-400 hover:text-indigo-600"><FolderPlus size={16}/> Add Module</button>
                    {isSpecialization && (
                        <button onClick={addTopLevelCourse} className="w-full py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-md"><GraduationCap size={16}/> Add Course</button>
                    )}
                </div>
            )}
          </div>

          {!isViewMode && (
            <div className="p-5 border-t border-gray-100 bg-white">
               <button onClick={handlePublish} disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-xs shadow-md hover:bg-indigo-700 flex items-center justify-center gap-2"><Save size={14}/> {loading ? "SAVING..." : "PUBLISH"}</button>
            </div>
          )}
        </aside>

        <main className="flex-1 overflow-y-auto bg-white flex justify-center border-l border-gray-100">
          <div className="w-full max-w-2xl px-12 py-12 pb-32">
            {!activeLesson ? (
              <div className="space-y-10 animate-in fade-in duration-300">
                <section className="space-y-4">
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest px-2 py-1 bg-indigo-50 rounded-md">General Settings</span>
                    <input readOnly={isViewMode} className="text-3xl font-black w-full outline-none placeholder:text-gray-100" placeholder="Title" value={courseData.title} onChange={(e) => setCourseData({...courseData, title: e.target.value})} />
                    <textarea readOnly={isViewMode} className="w-full text-base text-gray-500 outline-none h-24 leading-relaxed resize-none" placeholder="Description..." value={courseData.description} onChange={(e) => setCourseData({...courseData, description: e.target.value})} />
                    <div className="grid grid-cols-2 gap-6">
                    <input
                        readOnly={isViewMode}
                        type="text"
                        placeholder="Instructor Name"
                        className="w-full p-3 rounded-xl bg-gray-50 border border-gray-100 font-bold text-sm outline-none"
                        value={courseData.instructor}
                        onChange={(e) => setCourseData({ ...courseData, instructor: e.target.value })}
                    />

                    <input
                        readOnly={isViewMode}
                        type="number"
                        placeholder="Price ($)"
                        className="w-full p-3 rounded-xl bg-gray-50 border border-gray-100 font-bold text-sm outline-none"
                        value={courseData.price}
                        onChange={(e) => setCourseData({ ...courseData, price: Number(e.target.value) })}
                    />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                    <input
                        readOnly={isViewMode}
                        type="text"
                        placeholder="Duration (e.g. 8 weeks / 12 hours)"
                        className="w-full p-3 rounded-xl bg-gray-50 border border-gray-100 font-bold text-sm outline-none"
                        value={courseData.duration}
                        onChange={(e) => setCourseData({ ...courseData, duration: e.target.value })}
                    />

                    <div className="relative">
                      <input
                        ref={thumbnailInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleThumbnailUpload}
                        disabled={isViewMode}
                      />
                      {courseData.thumbnail ? (
                        <div className="relative rounded-xl overflow-hidden border border-gray-100 h-28 bg-gray-50 group">
                          <img
                            src={courseData.thumbnail}
                            alt="Course thumbnail"
                            className="h-full w-full object-cover"
                          />
                          {!isViewMode && (
                            <button
                              type="button"
                              onClick={() => thumbnailInputRef.current?.click()}
                              disabled={thumbnailUploading}
                              className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Upload size={18}/>
                              <span className="text-[10px] font-bold uppercase">Change</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        isViewMode ? (
                          <div className="h-28 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-300 text-[10px] font-bold uppercase">No Thumbnail</div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => thumbnailInputRef.current?.click()}
                            disabled={thumbnailUploading}
                            className="w-full h-28 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors disabled:opacity-60"
                          >
                            {thumbnailUploading ? (
                              <span className="text-[10px] font-bold uppercase">Uploading...</span>
                            ) : (
                              <>
                                <Upload size={20}/>
                                <span className="text-[10px] font-bold uppercase">Upload Thumbnail</span>
                                <span className="text-[9px] text-gray-300">JPEG · PNG · WebP · max 2 MB</span>
                              </>
                            )}
                          </button>
                        )
                      )}
                    </div>
                    </div>
                </section>
                
                <div className="grid grid-cols-2 gap-6">
                    <select disabled={isViewMode} className="w-full p-3 rounded-xl bg-gray-50 border border-gray-100 font-bold text-sm outline-none shadow-sm cursor-pointer" value={courseData.domain} onChange={(e) => setCourseData({...courseData, domain: e.target.value})}>
                        {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <select disabled={isViewMode} className="w-full p-3 rounded-xl bg-gray-50 border border-gray-100 font-bold text-sm outline-none shadow-sm cursor-pointer" value={courseData.difficulty} onChange={(e) => setCourseData({...courseData, difficulty: e.target.value})}>
                        <option value="Beginner">Beginner</option><option value="Intermediate">Intermediate</option><option value="Advanced">Advanced</option>
                    </select>
                </div>

                {isSpecialization && (
                    <div className="p-8 bg-indigo-50/50 rounded-[2.5rem] border border-indigo-100 animate-in slide-in-from-bottom-2">
                        <h4 className="font-black text-indigo-900 text-[10px] uppercase mb-6 flex items-center gap-2 tracking-[0.15em]"><Layers size={16}/> Path Contents Track</h4>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-indigo-50 flex items-center justify-between">
                                <span className="text-[9px] font-bold text-gray-400 uppercase">Courses</span>
                                <span className="text-xl font-black text-indigo-600">{courseData.modules.filter(m => m.isCourseWrapper).length}</span>
                            </div>
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-indigo-50 flex items-center justify-between">
                                <span className="text-[9px] font-bold text-gray-400 uppercase">Modules</span>
                                <span className="text-xl font-black text-indigo-600">{courseData.modules.reduce((acc, m) => acc + (m.subModules?.length || 0), 0)}</span>
                            </div>
                        </div>
                    </div>
                )}
              </div>
            ) : (
              <LessonDetailEditor 
                key={activeLesson.id} 
                lesson={activeLesson} 
                setLesson={syncLesson} 
                fileInputRef={fileInputRef} 
                isViewMode={isViewMode} 
                courseId={courseId}
                moduleId={activeModuleId}
              />
            )}
          </div>
        </main>
      </div>
    </SuperAdminLayout>
  );
};

const LessonDetailEditor = ({ lesson, setLesson, fileInputRef, isViewMode, courseId, moduleId }) => {
    const update = (fields) => {
        if (isViewMode) return;
        setLesson({ ...lesson, ...fields });
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 500 * 1024 * 1024) {
            alert("File is too large (Max 500MB)");
            return;
        }

        // Use whichever ID exists — id field first, then _id
        const lessonIdentifier = lesson.id || (lesson._id ? String(lesson._id) : null);
        
        if (!lessonIdentifier) {
            alert("Cannot upload: lesson has no ID. Please save/publish the course first, then re-open it to upload videos.");
            return;
        }

        if (!moduleId) {
            alert("Cannot upload: module ID is missing. Please click the lesson in the sidebar first.");
            return;
        }

        if (!courseId) {
            alert("Cannot upload: Please publish the course first before uploading videos.");
            return;
        }

        try {
            const formData = new FormData();
            formData.append("video", file);
            formData.append("courseId", courseId);
            formData.append("moduleId", moduleId);
            formData.append("lessonId", lessonIdentifier);

            console.log("Uploading with:", { courseId, moduleId, lessonId: lessonIdentifier });

            const res = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/curriculum/global-courses/upload-video`,
                formData,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                    onUploadProgress: (progressEvent) => {
                        const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        console.log(`Upload Progress: ${pct}%`);
                    }
                }
            );

            update({ videoUrl: res.data.videoUrl });
            alert("Upload successful!");

        } catch (err) {
            console.error("Upload Error:", err.response?.data || err.message);
            alert(`Upload failed: ${err.response?.data?.message || err.message}`);
        }
    };
        const addQuizQuestion = () => {
        const q = { id: Date.now().toString(), question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '' };
        update({ quizData: [...(lesson.quizData || []), q] });
        };

    const addTestCase = () => {
        const tc = { id: Date.now().toString(), input: '', expectedOutput: '', comparisonMode: 'Exact', isHidden: false };
        update({ labConfig: { ...lesson.labConfig, testCases: [...(lesson.labConfig?.testCases || []), tc] } });
    };

    const addConstraint = (type) => {
        const c = { id: Date.now().toString(), type, construct: CONSTRAINT_OPTIONS[0].value, specifics: { minDepth: 0, maxDepth: 0 } };
        update({ labConfig: { ...lesson.labConfig, codeConstraints: [...(lesson.labConfig?.codeConstraints || []), c] } });
    };

    const getYoutubeID = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-10 w-full">
            <div className="flex items-center gap-3 border-b border-gray-50 pb-6">
                <div className={`p-3 rounded-xl ${lesson.type === 'video' ? 'bg-blue-600' : lesson.type === 'lab' ? 'bg-emerald-600' : 'bg-orange-600'} text-white shadow-sm shrink-0`}>
                    {lesson.type === 'video' ? <Video size={20}/> : lesson.type === 'lab' ? <Code size={20}/> : <HelpCircle size={20}/>}
                </div>
                <input readOnly={isViewMode} className="text-2xl font-black text-gray-900 w-full outline-none bg-transparent" value={lesson.title} onChange={(e) => update({ title: e.target.value })} />
            </div>

            {lesson.type === 'video' && (
                <div className="space-y-6">
                    <div className="p-6 bg-blue-50/50 rounded-[2rem] border border-blue-100 space-y-6 shadow-sm">
                    
                    {/* Upload + URL Input */}
                    {!isViewMode && (
                        <div className="flex gap-2">
                        <div className="flex-1 flex items-center bg-white rounded-xl px-3 border border-blue-100 shadow-sm overflow-hidden">
                            <Link size={16} className="text-blue-300 mr-2 shrink-0" />
                            <input
                            className="w-full py-2.5 text-xs font-bold outline-none text-blue-900"
                            placeholder="Paste YouTube link or uploaded video URL..."
                            value={lesson.videoUrl || ''}
                            onChange={(e) => update({ videoUrl: e.target.value })}
                            />
                        </div>

                        <button
                            onClick={() => fileInputRef.current.click()}
                            className="p-2.5 bg-white border border-blue-100 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm shrink-0"
                        >
                            <Upload size={18} />
                        </button>

                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="video/*"
                            onChange={handleFileChange}
                        />
                        </div>
                    )}

                    {/* Video Preview */}
                    {lesson.videoUrl ? (
                        <div className="rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl bg-black aspect-video group relative">

                        {/* YouTube */}
                        {lesson.videoUrl.includes("youtube.com") ||
                        lesson.videoUrl.includes("youtu.be") ? (
                            <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${getYoutubeID(
                                lesson.videoUrl
                            )}`}
                            frameBorder="0"
                            allowFullScreen
                            />
                        ) : (
                            /* Uploaded / Local */
                            <video
                            key={lesson.videoUrl}
                            controls
                            className="w-full h-full"
                            src={
                                lesson.videoUrl.startsWith("http")
                                ? lesson.videoUrl
                                : `${import.meta.env.VITE_BACKEND_URL || `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}`}${lesson.videoUrl}`
                            }
                            >
                            Your browser does not support the video tag.
                            </video>
                        )}

                        {!isViewMode && (
                            <button
                            onClick={() => update({ videoUrl: "" })}
                            className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                            >
                            <X size={16} />
                            </button>
                        )}
                        </div>
                    ) : (
                        <div className="py-12 border-2 border-dashed border-blue-100 rounded-[2rem] flex flex-col items-center justify-center text-blue-300 bg-white/50 text-center uppercase font-black text-xs tracking-widest">
                        No Video Selected
                        </div>
                    )}
                    </div>
                </div>
                )}

            {lesson.type === 'quiz' && (
                <div className="space-y-4">
                    {(lesson.quizData || []).map((q, qIdx) => (
                        <div key={q.id} className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-4 relative group animate-in slide-in-from-top-2">
                            {!isViewMode && <button className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => update({ quizData: lesson.quizData.filter((_, i) => i !== qIdx) })}><Trash2 size={16}/></button>}
                            <input readOnly={isViewMode} className="text-sm font-bold w-full outline-none border-b border-gray-50 pb-2" placeholder="Type question..." value={q.question} onChange={(e) => {
                                 const updated = [...lesson.quizData]; updated[qIdx].question = e.target.value; update({ quizData: updated });
                            }}/>
                            <div className="grid grid-cols-1 gap-2">
                                {q.options.map((opt, oIdx) => (
                                    <div key={oIdx} className="flex items-center gap-2">
                                        <input type="radio" disabled={isViewMode} checked={q.correctAnswer === oIdx} onChange={() => {
                                             const updated = [...lesson.quizData]; updated[qIdx].correctAnswer = oIdx; update({ quizData: updated });
                                        }} className="w-4 h-4 accent-indigo-600 cursor-pointer" />
                                        <input readOnly={isViewMode} className={`flex-1 p-2 bg-gray-50 rounded-lg text-xs font-medium outline-none border border-transparent focus:border-indigo-100 ${q.correctAnswer === oIdx ? 'bg-indigo-50/50' : ''}`} placeholder={`Option ${oIdx + 1}`} value={opt} onChange={(e) => {
                                             const updated = [...lesson.quizData]; updated[qIdx].options[oIdx] = e.target.value; update({ quizData: updated });
                                        }}/>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    {!isViewMode && <button onClick={addQuizQuestion} className="w-full py-4 border-2 border-dashed border-gray-100 rounded-xl text-gray-400 font-bold text-[10px] uppercase hover:bg-indigo-600 hover:text-white transition-all">+ Add Next Question</button>}
                </div>
            )}

            {lesson.type === 'lab' && (
                <div className="space-y-10 animate-in fade-in">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">1. Problem Statement</label>
                        <textarea readOnly={isViewMode} className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 text-sm outline-none resize-none h-48 focus:bg-white" value={lesson.labConfig?.problemStatement || ''} onChange={(e) => update({ labConfig: { ...lesson.labConfig, problemStatement: e.target.value } })} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">2. Starter Code</label>
                        <div className="p-4 bg-gray-900 rounded-xl border border-gray-800 shadow-inner">
                            <textarea readOnly={isViewMode} className="w-full bg-transparent text-emerald-400 font-mono text-xs outline-none h-48 resize-none" value={lesson.labConfig?.code || ''} onChange={(e) => update({ labConfig: { ...lesson.labConfig, code: e.target.value } })} />
                        </div>
                    </div>

                    <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100 space-y-5 shadow-sm">
                        <h4 className="text-[10px] font-black text-indigo-900 uppercase flex items-center gap-2"><Sliders size={14}/> Structure Constraints</h4>
                        <div className="space-y-4">
                            {(lesson.labConfig?.codeConstraints || []).map((constraint, cIdx) => (
                                <div key={constraint.id} className={`p-4 rounded-xl border-l-4 shadow-sm bg-white ${constraint.type === 'Required' ? 'border-blue-500' : 'border-red-500'}`}>
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase">
                                            {constraint.type === 'Required' ? <Check size={14} className="text-blue-500"/> : <Ban size={14} className="text-red-500"/>} {constraint.type}
                                        </div>
                                        {!isViewMode && (
                                            <button onClick={() => {
                                                const updatedC = lesson.labConfig.codeConstraints.filter(c => c.id !== constraint.id);
                                                update({ labConfig: { ...lesson.labConfig, codeConstraints: updatedC } });
                                            }} className="text-gray-300 hover:text-red-500"><X size={14}/></button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <select disabled={isViewMode} value={constraint.construct} onChange={(e) => {
                                            const updated = [...lesson.labConfig.codeConstraints];
                                            updated[cIdx].construct = e.target.value;
                                            update({ labConfig: { ...lesson.labConfig, codeConstraints: updated } });
                                        }} className="w-full p-2 bg-gray-50 border rounded-lg text-[10px] font-bold outline-none">
                                            {CONSTRAINT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                        </select>
                                        {['LOOP', 'for loop', 'while loop', 'if-else statement'].includes(constraint.construct) && (
                                            <>
                                                <input type="number" readOnly={isViewMode} placeholder="Min Nest" value={constraint.specifics.minDepth} onChange={(e) => {
                                                    const updated = [...lesson.labConfig.codeConstraints];
                                                    updated[cIdx].specifics.minDepth = parseInt(e.target.value) || 0;
                                                    update({ labConfig: { ...lesson.labConfig, codeConstraints: updated } });
                                                }} className="w-full p-2 bg-gray-50 border rounded-lg text-[10px]" min="0" />
                                                <input type="number" readOnly={isViewMode} placeholder="Max Nest" value={constraint.specifics.maxDepth} onChange={(e) => {
                                                    const updated = [...lesson.labConfig.codeConstraints];
                                                    updated[cIdx].specifics.maxDepth = parseInt(e.target.value) || 0;
                                                    update({ labConfig: { ...lesson.labConfig, codeConstraints: updated } });
                                                }} className="w-full p-2 bg-gray-50 border rounded-lg text-[10px]" min="0" />
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {!isViewMode && (
                                <div className="flex gap-2">
                                    <button onClick={() => addConstraint('Required')} className="flex-1 py-2 bg-blue-600 text-white text-[9px] font-black uppercase rounded-lg hover:bg-blue-700">+ Add Required</button>
                                    <button onClick={() => addConstraint('Forbidden')} className="flex-1 py-2 bg-red-500 text-white text-[9px] font-black uppercase rounded-lg hover:bg-red-600 transition-all">+ Add Forbidden</button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100 space-y-6 shadow-sm">
                        <h4 className="text-[11px] font-black text-emerald-800 uppercase tracking-widest flex items-center gap-2"><Check size={12}/> Validation Logic</h4>
                        <div className="space-y-4">
                            {(lesson.labConfig?.testCases || []).map((tc, idx) => (
                                <div key={tc.id} className="bg-white border border-emerald-100 rounded-2xl p-5 shadow-sm transition-all hover:shadow-md">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight block">Suite #{idx + 1}</span>
                                        {!isViewMode && (
                                            <button onClick={() => {
                                                const updatedTC = lesson.labConfig.testCases.filter(x => x.id !== tc.id);
                                                update({ labConfig: { ...lesson.labConfig, testCases: updatedTC } });
                                            }} className="text-red-300 hover:text-red-500"><Trash2 size={12}/></button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <textarea readOnly={isViewMode} className="w-full p-3 bg-gray-950 text-emerald-400 font-mono text-[10px] rounded-xl outline-none shadow-inner" rows="3" value={tc.input} onChange={(e) => {
                                            const updated = [...lesson.labConfig.testCases]; updated[idx].input = e.target.value; update({ labConfig: { ...lesson.labConfig, testCases: updated } });
                                        }}/>
                                        <textarea readOnly={isViewMode} className="w-full p-3 bg-gray-950 text-emerald-400 font-mono text-[10px] rounded-xl outline-none shadow-inner" rows="3" value={tc.expectedOutput} onChange={(e) => {
                                            const updated = [...lesson.labConfig.testCases]; updated[idx].expectedOutput = e.target.value; update({ labConfig: { ...lesson.labConfig, testCases: updated } });
                                        }}/>
                                    </div>
                                    <select disabled={isViewMode} className="w-full mt-3 bg-gray-50 p-2 rounded-lg text-[10px] font-bold border-none outline-none cursor-pointer" value={tc.comparisonMode} onChange={(e) => {
                                        const updated = [...lesson.labConfig.testCases]; updated[idx].comparisonMode = e.target.value; update({ labConfig: { ...lesson.labConfig, testCases: updated } });
                                    }}>
                                        <option value="Exact">Exact Match</option>
                                        <option value="Contains">Contains (Partial)</option>
                                        <option value="Regex">Regex</option>
                                    </select>
                                </div>
                            ))}
                            {!isViewMode && <button onClick={addTestCase} className="w-full py-4 border-2 border-dashed border-emerald-200 text-emerald-600 font-black rounded-2xl hover:bg-emerald-600 hover:text-white transition-all uppercase text-[9px] flex items-center justify-center gap-2 bg-white/50"><Plus size={14}/> Add Test Case</button>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CourseEditor;