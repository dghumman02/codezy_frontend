import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  Building2, BookOpen, Users, Plus, Trash2, Globe 
} from 'lucide-react';
import SuperAdminLayout from './SuperAdminLayout';

// Animation variants for the content cards
const cardVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: (i) => ({ 
    y: 0, 
    opacity: 1, 
    transition: { delay: i * 0.1, type: 'spring', stiffness: 100 } 
  })
};

// Custom hook for the count-up effect on stats
const useCountUp = (end, duration = 2000) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTime;
    const animate = (now) => {
      if (!startTime) startTime = now;
      const progress = Math.min((now - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [end, duration]);
  return count;
};

const SuperAdminDashboard = () => {
  const [data, setData] = useState({ 
    summary: { institutions: 0, individuals: 0, activeUsers: 0 }, 
    institutions: [], 
    individualCourses: [] 
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/superadmin/dashboard-stats');
        setData(res.data);
      } catch (err) {
        console.error("Fetch error:", err);
        // Fallback dummy data for development if backend is not ready
        setData({
          summary: { institutions: 12, individuals: 1240, activeUsers: 84 },
          institutions: [
            { name: "Tech University", students: 450, teachers: 24, courses: 12 },
            { name: "Global Institute", students: 310, teachers: 15, courses: 8 }
          ],
          individualCourses: [
            { title: "Advanced React Patterns", lectures: 24, students: 156 },
            { title: "Cloud Infrastructure", lectures: 18, students: 89 }
          ]
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <SuperAdminLayout title="System Overview">
      <div className="animate-pulse space-y-10">
        <div className="h-8 w-64 bg-gray-200 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[0,1,2].map(i => <div key={i} className="h-32 bg-gray-200 rounded-3xl" />)}
        </div>
        <div className="h-64 bg-gray-200 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-72 bg-gray-200 rounded-2xl" />
          <div className="h-72 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    </SuperAdminLayout>
  );

  return (
    <SuperAdminLayout title="System Overview">
      <div className="space-y-10">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-gray-500 mt-1">Real-time statistics across all Codezy nodes.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <AnimatedStatCard 
            label="Total Institutions" 
            value={data.summary.institutions} 
            icon={<Building2 size={28}/>} 
            color="from-indigo-600 to-blue-500" 
            index={0} 
          />
          <AnimatedStatCard 
            label="Total Learners" 
            value={data.summary.individuals} 
            icon={<Users size={28}/>} 
            color="from-purple-600 to-pink-500" 
            index={1} 
          />
          <AnimatedStatCard 
            label="Active Systems" 
            value={data.summary.activeUsers} 
            icon={<Globe size={28}/>} 
            color="from-emerald-600 to-teal-500" 
            index={2} 
          />
        </div>

        {/* Institution List Table-style Cards */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800">Managed Institutions</h3>
            <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-all shadow-md text-sm font-semibold">
              <Plus size={18} /> Add New Node
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {data.institutions.map((inst, i) => (
              <motion.div 
                key={i} custom={i} variants={cardVariants} initial="hidden" animate="visible"
                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xl hover:shadow-2xl transition-all group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                      <Building2 size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">{inst.name}</h4>
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md uppercase tracking-wider">Verified System</span>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={20}/></button>
                </div>
                <div className="grid grid-cols-3 gap-4 border-t border-gray-50 pt-6">
                  <DataDetail label="Learners" value={inst.students} />
                  <DataDetail label="Staff" value={inst.teachers} />
                  <DataDetail label="Courses" value={inst.courses} />
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Bottom Grid for Individual Content */}
        <section>
          <h3 className="text-xl font-bold text-gray-800 mb-6">Course Performance Tracking</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.individualCourses.map((course, i) => (
              <motion.div 
                key={i} custom={i + 4} variants={cardVariants} initial="hidden" animate="visible"
                className="bg-white p-5 rounded-2xl border border-gray-100 shadow-lg hover:border-indigo-200 transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 group-hover:text-indigo-600 mb-4 transition-colors">
                  <BookOpen size={20} />
                </div>
                <h4 className="font-bold text-gray-800 mb-4 truncate text-sm">{course.title}</h4>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-medium">Labs: <b className="text-gray-900">{course.lectures}</b></span>
                  <span className="text-gray-500 font-medium">Enrolled: <b className="text-gray-900">{course.students}</b></span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </SuperAdminLayout>
  );
};

// --- HELPER COMPONENTS ---

const AnimatedStatCard = ({ label, value, icon, color, index }) => {
  const count = useCountUp(value);
  return (
    <motion.div 
      custom={index} variants={cardVariants} initial="hidden" animate="visible"
      whileHover={{ y: -5, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)' }}
      className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 flex justify-between items-center relative overflow-hidden group"
    >
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color} opacity-[0.03] -mr-10 -mt-10 rounded-full group-hover:scale-150 transition-transform duration-500`} />
      <div>
        <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-2">{label}</p>
        <h2 className="text-5xl font-black text-gray-900 tracking-tighter">{count}</h2>
      </div>
      <div className={`p-5 rounded-2xl bg-gradient-to-br ${color} text-white shadow-lg transform group-hover:rotate-6 transition-transform`}>
        {icon}
      </div>
    </motion.div>
  );
};

const DataDetail = ({ label, value }) => (
  <div className="text-center">
    <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">{label}</p>
    <p className="text-lg font-extrabold text-indigo-600">{value}</p>
  </div>
);

export default SuperAdminDashboard;