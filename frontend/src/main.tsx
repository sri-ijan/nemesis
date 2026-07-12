import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { Toaster } from "react-hot-toast";

<React.StrictMode>
  <App />
  <Toaster
    position="top-right"
    toastOptions={{
      duration: 3000,
      style: {
        background: "#171717",
        color: "#fafaf9",
        border: "1px solid #3f3f46",
        borderRadius: "14px",
      },
    }}
  />
</React.StrictMode>;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
