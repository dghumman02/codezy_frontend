import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App";
import "./index.css";
import { getCurrentUser } from "./services/auth.js";

// Root component to manage user state
const Root = () => {
  const [user, setUser] = React.useState(getCurrentUser());

  // Listen for storage changes (login/logout in this or other tabs)
  React.useEffect(() => {
    const handleStorageChange = () => {
      const newUser = getCurrentUser();
      setUser(newUser);
    };

    // Listen for storage events from other tabs
    window.addEventListener("storage", handleStorageChange);
    
    // Custom event for same-tab updates
    window.addEventListener("userUpdated", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("userUpdated", handleStorageChange);
    };
  }, []);

  return (
    <BrowserRouter>
      <Toaster position="top-right" reverseOrder={false} />
      <App user={user} setUser={setUser} />
    </BrowserRouter>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
