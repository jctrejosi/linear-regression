import { EditableTable } from "@/pages/LinealRegression/components/EditableTable";
import { FileUpload } from "@/pages/LinealRegression/components/FileUpload";
import { useEffect, useState } from "react";
import type { TableFile } from "./@types";
import { LinealRegresion } from "./pages/LinealRegression";
import { AiFillGithub, AiOutlinePaperClip } from "react-icons/ai";
import { convert_file } from "./pages/LinealRegression/services/convert_file";
import axios from "axios";

/* =========================
   servicio health
========================= */
const api_health = async (): Promise<boolean> => {
  try {
    const res = await axios.get("/health");
    return res.status === 200;
  } catch {
    return false;
  }
};

/* =========================
   loader screen
========================= */
const LoadingScreen = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 gap-4">
      <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin" />
      <p className="text-gray-600 text-sm">Iniciando backend, espere...</p>
    </div>
  );
};

export const App = () => {
  const [backendReady, setBackendReady] = useState(false);
  const [dataTable, setDataTable] = useState<TableFile | undefined>(undefined);
  const [dataEditable, setDataEditable] = useState<TableFile | undefined>(
    undefined
  );

  /* =========================
     polling health check
  ========================= */
  useEffect(() => {
    // eslint-disable-next-line prefer-const
    let interval: ReturnType<typeof setInterval>;

    const checkBackend = async () => {
      const ok = await api_health();
      if (ok) {
        setBackendReady(true);
        clearInterval(interval);
      }
    };

    checkBackend();
    interval = setInterval(checkBackend, 2000);

    return () => clearInterval(interval);
  }, []);

  /* =========================
     sincronizar tabla editable
  ========================= */
  useEffect(() => {
    if (dataTable) {
      setDataEditable(dataTable);
    }
  }, [dataTable]);

  /* =========================
     cargar ejemplo
  ========================= */
  const loadSample = async (path: string, filename: string) => {
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error("No se pudo cargar el archivo de ejemplo");

      const blob = await res.blob();
      const file = new File([blob], filename);

      const table = await convert_file(file);
      setDataTable(table);
    } catch (err) {
      console.error(err);
      alert("Error cargando archivo de ejemplo");
    }
  };

  /* =========================
     pantalla de carga
  ========================= */
  if (!backendReady) {
    return <LoadingScreen />;
  }

  /* =========================
     app normal
  ========================= */
  return (
    <div className="bg-gray-100 min-h-screen p-6">
      <div className="relative mx-auto flex flex-col gap-6 max-w-7xl 2xl:max-w-[1600px] lg:pr-72">
        <div
          className="
          bg-white
          flex flex-col md:flex-row lg:flex-col
          gap-3 text-gray-500
          border border-gray-300 p-4 rounded-lg
          lg:absolute lg:top-4 lg:right-4
        "
        >
          <a
            href="https://github.com/tu_usuario/tu_repo"
            target="_blank"
            rel="noopener"
            className="
              flex items-center gap-1
              text-white underline text-xs
              bg-gray-800 hover:bg-gray-700
              px-2 py-1 rounded
            "
          >
            <AiFillGithub size={16} />
            Ver repositorio
          </a>

          <h5 className="text-sm w-full">Seleccione un ejemplo</h5>

          <button
            onClick={() =>
              loadSample(
                "/samples/Regresion_example_1.sav",
                "Regresion_example_1.sav"
              )
            }
            className="hover:text-blue-600 transition-colors flex gap-2 items-center text-left underline"
          >
            <AiOutlinePaperClip size={18} />
            Regresion_example_1.sav
          </button>

          <button
            onClick={() =>
              loadSample(
                "/samples/Regresion_example_2.xls",
                "Regresion_example_2.xls"
              )
            }
            className="hover:text-blue-600 transition-colors flex gap-2 items-center text-left underline"
          >
            <AiOutlinePaperClip size={18} />
            Regresion_example_2.xls
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow flex flex-col gap-6">
          <FileUpload
            setData={(data) => {
              setDataTable(data);
            }}
          />

          <div className="flex flex-wrap gap-4 justify-center">
            <LinealRegresion data={dataEditable} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow overflow-x-auto">
          <EditableTable
            columns={dataEditable?.columns || []}
            data={dataEditable?.data || []}
            setData={setDataEditable}
          />
        </div>
      </div>
    </div>
  );
};
