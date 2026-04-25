// src/components/Notifications.jsx

import { useNotifications } from "../hooks/useNotifications";

export default function Notifications() {
  // Use the custom hook for notifications
  const { notifications, loading, error, markAsRead } = useNotifications();

  // Determine notification background color
  const getBackgroundColor = (n) => {
    if (n.isRead) return "#eee";
    switch (n.type || (n.notification && n.notification.type)) {
      case "LAB_CREATED":
        return "#fef3c7"; // yellow
      case "EXAM_CREATED":
        return "#dbeafe"; // blue
      case "ANNOUNCEMENT":
        return "#e0f2f1"; // teal
      case "SYSTEM":
      default:
        return "#f0ebff"; // purple
    }
  };

  // Determine notification icon
  const getIcon = (n) => {
    switch (n.type || (n.notification && n.notification.type)) {
      case "LAB_CREATED":
        return "🧪";
      case "EXAM_CREATED":
        return "📝";
      case "ANNOUNCEMENT":
        return "📢";
      case "SYSTEM":
      default:
        return "🔔";
    }
  };

  if (loading) return <p>Loading notifications...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Notifications</h2>

      {notifications.length === 0 && <p>No notifications yet</p>}

      {notifications.map((n) => (
        <div
          key={n._id || n.notificationId}
          className="flex items-start gap-4 p-4 mb-3 rounded-lg"
          style={{ background: getBackgroundColor(n) }}
        >
          <span className="text-2xl">{getIcon(n)}</span>

          <div className="flex-1">
            <h4 className="font-semibold text-gray-800 mb-1">
              {(n.notification && n.notification.title) || n.title}
            </h4>
            <p className="text-gray-700 text-sm mb-1">
              {(n.notification && n.notification.message) || n.message}
            </p>
            <small className="text-gray-500 text-xs">
              {new Date(n.createdAt).toLocaleString()}
            </small>
          </div>

          {!n.isRead && (
            <button
              onClick={() => markAsRead(n._id || n.notificationId)}
              className="text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded-md text-xs font-bold"
            >
              Mark as read
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
