import axios from "axios";
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Eye, Pencil, Trash2, Plus, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const ManageLabsPage = () => {
  const { courseId, classId } = useParams();
  const navigate = useNavigate();

  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLabs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      // Fetch only the labs for this specific class (not all classes in course)
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL || `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}`}/api/courses/${courseId}/classes/${classId}/labs`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      // The endpoint returns a single lab object when fetching by labId,
      // but we need the class labs array. Use the course endpoint to get class-specific labs.
      setLabs(res.data || []);
    } catch (err) {
       console.error("Error fetching labs:", err.response?.data || err.message);
       // Fallback: fetch via all-labs and filter by classId
       try {
         const token = localStorage.getItem("token");
         const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL || `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}`}/api/courses/${courseId}/all-labs`, {
           headers: { Authorization: `Bearer ${token}` }
         });
         const classLabs = (res.data || []).filter(lab => {
           const parentClass = String(lab.parentClassId || "");
           return parentClass === String(classId);
         });
         setLabs(classLabs);
       } catch (fallbackErr) {
         console.error("Fallback fetch failed:", fallbackErr);
         setLabs([]);
       }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabs();
  }, [courseId, classId]);

  const deleteLab = async (labId) => {
    if (!window.confirm("Are you sure you want to delete this lab?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL || `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}`}/api/courses/${courseId}/classes/${classId}/labs/${labId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      fetchLabs();
    } catch (err) {
      console.error("Delete Error:", err);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center p-20 animate-pulse text-indigo-600 font-medium">
      Loading Labs...
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <header className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Lab History</h1>
            <p className="text-gray-500 mt-1">Labs assigned to students in this class</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/createlab`)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              <Plus size={18} />
              Create New Lab
            </button>
            <button
              onClick={() => navigate('/mycourses')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
            >
              <ArrowLeft size={18} />
              Back to My Courses
            </button>
          </div>
        </div>
      </header>

      <div className="space-y-4">
        {labs.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <p className="text-gray-500 text-lg font-semibold">No labs found in this class.</p>
            <p className="text-gray-400 mt-2">Create a new lab or import from Shared Labs.</p>
          </div>
        ) : (
          labs.map((lab) => {
            const now = new Date();
            const dueDateTime = new Date(lab.dueDate);
            if (lab.dueTime) {
              const [h, m] = lab.dueTime.split(':');
              dueDateTime.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
            }
            const isExpired = now > dueDateTime;
            const statusLabel = lab.status === "Draft" ? "Draft" : isExpired ? "Expired" : lab.status;
            const statusColor = lab.status === "Draft" ? "bg-gray-100 text-gray-600" : isExpired ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700";

            return (
              <motion.div
                key={lab._id}
                whileHover={{ scale: 1.005 }}
                className="bg-white rounded-xl shadow-sm p-5 flex justify-between items-center border border-gray-100"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg font-bold text-gray-800">{lab.title}</h2>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${statusColor}`}>
                      {statusLabel}
                    </span>
                  </div>
                  {lab.description && (
                    <p className="text-sm text-gray-600 line-clamp-1">{lab.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-xs text-gray-500"><strong>Marks:</strong> {lab.marks}</span>
                    <span className="text-xs text-gray-500"><strong>Difficulty:</strong> {lab.difficulty || "Medium"}</span>
                    <span className="text-xs text-gray-500"><strong>Tasks:</strong> {lab.tasks?.length || 0}</span>
                    <span className="text-xs text-gray-500"><strong>Submissions:</strong> {lab.submissions?.length || 0}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => navigate(`/courses/${courseId}/class/${classId}/labs/${lab._id}/submissions`)}
                    className="flex items-center gap-1 text-sm px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                  >
                    <Eye size={14} /> View
                  </button>
                  <button
                    onClick={() => navigate(`/createlab/${lab._id}/${courseId}/${classId}`)}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
                    title="Edit Lab"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={() => deleteLab(lab._id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                    title="Delete Lab"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ManageLabsPage;