import { EditableTable } from "@components/EditableTable";
import { FileUpload } from "@components/FileUpload";
import { useEffect, useState } from "react";
import { AnovaAnalysis } from "./modules/AnovaAnalysis";
import type { TableFile } from "./@types";
import { LinealRegresion } from "./modules/LinealRegression";

export const App = () => {
  const [dataTable, setDataTable] = useState<TableFile | undefined>(undefined);
  const [dataEditable, setDataEditable] = useState<TableFile | undefined>(
    undefined
  );

  useEffect(() => {
    if (dataTable) {
      setDataEditable(dataTable);
    }
  }, [dataTable]);

  return (
    <div className="App bg-gray-100 min-h-screen p-6 flex flex-col gap-8">
      <div className="max-w-6xl w-full mx-auto flex flex-col gap-6">
        {/* Carga de archivo */}
        <div className="bg-white p-6 rounded-lg shadow">
          <FileUpload
            setData={(data) => {
              setDataTable(data);
            }}
          />
        </div>

        {/* Análisis ANOVA */}
        <div className="bg-white p-6 rounded-lg shadow">
          <AnovaAnalysis data={dataEditable} />
        </div>

        {/* Regresión Lineal */}
        <div className="bg-white p-6 rounded-lg shadow">
          <LinealRegresion data={dataEditable} />
        </div>

        {/* Tabla editable */}
        <div className="bg-white p-6 rounded-lg shadow overflow-x-auto">
          <EditableTable
            columns={dataEditable?.columns || []}
            data={dataEditable?.data || []}
            setData={(data) => setDataEditable(data)}
          />
        </div>
      </div>
    </div>
  );
};
