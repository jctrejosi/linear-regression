import type { TableFile } from "@/@types";
import axios from "axios";
import type { ChangeEvent } from "react";
interface FileUploadProps {
  setData: (data: TableFile) => void;
}

export const FileUpload = ({ setData }: FileUploadProps) => {
  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post<TableFile>(
        "api/v1.0/converter_file",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          responseType: "json",
        }
      );

      setData(response.data);
    } catch (error) {
      console.error("Error procesando archivo:", error);
      alert("Ocurrió un error al procesar el archivo.");
    }
  };

  return (
    <input
      type="file"
      accept=".csv,.sav,.xlsx,.xls,.ods"
      onChange={handleFile}
    />
  );
};
