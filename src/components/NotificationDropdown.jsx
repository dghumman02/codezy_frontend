import React, { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Check, ExternalLink, Megaphone, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "../services/axiosInstance";

/**
 * NotificationDropdown Component
 * 
 * Features:
 * - Fetches notifications from REST API (source of truth)
 * - Real-time updates via Socket.io
 * - Unread count badge
 * - Mark as read functionality
 * - Deep linking to labs
 */
const NotificationDropdown = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [announcementModal, setAnnouncementModal] = useState(null); // holds notification object
  const socketRef = useRef(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get("/notifications");
      if (response.data.success) {
        setNotifications(response.data.notifications || []);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch unread count from API
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await axios.get("/notifications/unread-count");
      if (response.data.success) {
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  }, []);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await axios.patch(`/notifications/${notificationId}/read`);
      
      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    // Mark as read first
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    if (notification.type === "ANNOUNCEMENT") {
      setAnnouncementModal(notification);
      setIsOpen(false);
      return;
    }

    // Navigate to the lab if it's a lab notification
    if (notification.type === "LAB_CREATED" && notification.course && notification.lab) {
      navigate(`/student/courses/${notification.course}/labs?labId=${notification.lab}`);
      setIsOpen(false);
    }
  };

  // Initialize Socket.io connection
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Connect to socket server
    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[Notifications] Socket connected");
    });

    // Handle new notification
    socket.on("new_notification", (notification) => {
      console.log("[Notifications] New notification received:", notification);
      
      // Add to notifications list
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    // Handle notification read sync (from other tabs/devices)
    socket.on("notification_read", ({ notificationId }) => {
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    });

    socket.on("connect_error", (err) => {
      console.warn("[Notifications] Socket connection error:", err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // Fetch initial data
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Format time ago
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case "LAB_CREATED":
        return "🧪";
      case "ANNOUNCEMENT":
        return "📣";
      default:
        return "🔔";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Announcement detail modal */}
      {announcementModal && (
        <AnnouncementModal
          notification={announcementModal}
          onClose={() => setAnnouncementModal(null)}
        />
      )}

      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-indigo-600 transition-colors rounded-lg hover:bg-gray-50"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </h3>
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-400">
                <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Bell size={32} className="mx-auto mb-2 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`px-4 py-3 flex gap-3 border-b border-gray-50 cursor-pointer transition-colors hover:bg-gray-50 ${
                    !notification.isRead ? "bg-indigo-50/50" : ""
                  }`}
                >
                  {/* Icon */}
                  <div className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-lg bg-indigo-100">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`text-sm font-semibold truncate ${
                          !notification.isRead ? "text-gray-900" : "text-gray-600"
                        }`}
                      >
                        {notification.title}
                      </p>
                      {!notification.isRead && (
                        <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1.5"></span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-gray-400">
                        {formatTimeAgo(notification.createdAt)}
                      </span>
                      {notification.type === "LAB_CREATED" && (
                        <span className="text-[10px] text-indigo-500 flex items-center gap-0.5">
                          <ExternalLink size={10} /> View Lab
                        </span>
                      )}
                      {notification.type === "ANNOUNCEMENT" && (
                        <span className="text-[10px] text-purple-500 flex items-center gap-0.5">
                          <Megaphone size={10} /> View Announcement
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Mark as read button */}
                  {!notification.isRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification._id);
                      }}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors shrink-0 self-center"
                      title="Mark as read"
                    >
                      <Check size={16} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
              <p className="text-[10px] text-gray-400 text-center">
                Notifications auto-delete after 7 days
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Announcement Detail Modal (used standalone outside the dropdown) ──
export const AnnouncementModal = ({ notification, onClose }) => {
  if (!notification) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-lg shadow">
              📣
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-purple-500">Announcement</p>
              <h2 className="text-base font-bold text-gray-900 leading-snug mt-0.5">{notification.title}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Meta */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-4 text-xs text-gray-500">
          {notification.senderName && (
            <span>From: <span className="font-medium text-gray-700">{notification.senderName}</span></span>
          )}
          <span>Sent: <span className="font-medium text-gray-700">{new Date(notification.createdAt).toLocaleString()}</span></span>
          {notification.subject && (
            <span className="w-full">Subject: <span className="font-medium text-gray-700">{notification.subject}</span></span>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
            {notification.announcementBody || notification.message}
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationDropdown;
