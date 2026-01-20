import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { axiosConfiguration } from "@/configuration/axios";
import "./styles.css";

axiosConfiguration();

createRoot(document.getElementById("root")!).render(<App />);
