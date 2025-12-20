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
    <label className="flex flex-col items-center justify-center w-full max-w-xs p-6 mx-auto border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all duration-200">
      <svg
        className="w-12 h-12 mb-3 text-blue-400"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 16v4h16v-4M12 12v8m0 0l-4-4m4 4l4-4M12 4v8"
        />
      </svg>
      <span className="text-gray-700 font-medium text-center mb-1">
        Arrastra o selecciona un archivo
      </span>
      <span className="text-gray-400 text-sm text-center">
        (.csv, .xlsx, .xls, .sav, .ods)
      </span>
      <input
        type="file"
        accept=".csv,.sav,.xlsx,.xls,.ods"
        onChange={handleFile}
        className="hidden"
      />
    </label>
  );
};
