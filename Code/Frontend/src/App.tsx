import { EditableTable } from "@components/EditableTable";
import { FileUpload } from "@components/FileUpload";
import { useEffect, useState } from "react";
import type { TableFile } from "./@types";
import { LinealRegresion } from "./modules/LinealRegression";
import { AiOutlinePaperClip } from "react-icons/ai";
import axios from "axios";

export const App = () => {
  const [dataTable, setDataTable] = useState<TableFile | undefined>(undefined);
  const [dataEditable, setDataEditable] = useState<TableFile | undefined>(
    undefined
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
        { headers: { "Content-Type": "multipart/form-data" } }
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
      <div className="relative max-w-7xl mx-auto flex flex-col gap-6">
        <div className="absolute top-4 right-4 flex gap-3 text-gray-500 flex-col border-gray-300 p-4 rounded-lg border">
          <h5 className="text-sm">Seleccione un ejemplo</h5>

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

        {/* =========================
        carga y acciones
       ========================= */}
        <div className="bg-white p-6 rounded-lg shadow flex flex-col gap-6">
          {/* carga de archivo */}
          <FileUpload
            setData={(data) => {
              setDataTable(data);
            }}
          />

          {/* acciones principales */}
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
