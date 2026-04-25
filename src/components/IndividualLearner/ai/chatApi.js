import axios from "axios";

export const sendChatMessage = async (question, context = {}, conversationHistory = []) => {
  try {
    const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/learners/chatbot`, {
      question,
      context,
      conversationHistory // ✅ ADD THIS
    });

    return response.data;
  } catch (err) {
    console.error("Chatbot error:", err);
    return {
      reply: "Sorry, I couldn't reach the AI assistant right now.",
      conversationHistory: []
    };
  }
};