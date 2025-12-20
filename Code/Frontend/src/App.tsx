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
    <div className="App">
      <FileUpload
        setData={(data) => {
          setDataTable(data);
        }}
      />
      <AnovaAnalysis data={dataEditable} />
      <LinealRegresion data={dataEditable} />
      <EditableTable
        columns={dataEditable?.columns || []}
        data={dataEditable?.data || []}
        setData={(data) => setDataEditable(data)}
      />
    </div>
  );
};
