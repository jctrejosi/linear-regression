import { EditableTable } from "@/pages/LinealRegression/components/EditableTable";
import { FileUpload } from "@/pages/LinealRegression/components/FileUpload";
import { useEffect, useState } from "react";
import type { TableFile } from "./@types";
import { LinealRegresion } from "./pages/LinealRegression";
import { AiOutlinePaperClip } from "react-icons/ai";
import axios from "axios";

export const App = () => {
  const [dataTable, setDataTable] = useState<TableFile | undefined>(undefined);
  const [dataEditable, setDataEditable] = useState<TableFile | undefined>(
    undefined,
  );

  const loadSample = async (path: string, filename: string) => {
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error("No se pudo cargar el archivo de ejemplo");

      const blob = await res.blob();
      const file = new File([blob], filename);

      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post<TableFile>(
        "api/v1.0/converter_file",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      setDataTable(response.data);
    } catch (err) {
      console.error(err);
      alert("Error cargando archivo de ejemplo");
    }
  };

  useEffect(() => {
    if (dataTable) {
      setDataEditable(dataTable);
    }
  }, [dataTable]);

  return (
    <div className="bg-gray-100 min-h-screen p-6">
      <div className="relative mx-auto flex flex-col gap-6 max-w-7xl 2xl:max-w-[1600px] lg:pr-72">
        {/* =========================
            ejemplos
        ========================= */}
        <div
          className="
        bg-white
        flex flex-col md:flex-row lg:flex-col
        gap-3 text-gray-500
        border border-gray-300 p-4 rounded-lg
        lg:absolute lg:top-4 lg:right-4
      "
        >
          <h5 className="text-sm w-full">Seleccione un ejemplo</h5>

          <button
            onClick={() =>
              loadSample(
                "/samples/Regresion_example_1.sav",
                "Regresion_example_1.sav",
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
                "Regresion_example_2.xls",
              )
            }
            className="hover:text-blue-600 transition-colors flex gap-2 items-center text-left underline"
          >
            <AiOutlinePaperClip size={18} />
            Regresion_example_2.xls
          </button>
        </div>

        {/* =========================
            carga y acciones
        ========================= */}
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

        {/* =========================
            tabla editable
        ========================= */}
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
