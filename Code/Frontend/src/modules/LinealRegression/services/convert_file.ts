import type { TableFile } from "@/@types";
import { statsApi } from "@/services/axios";

export const convert_file = async (file: File): Promise<TableFile> => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await statsApi.post<TableFile>(
    "api/v1.0/converter_file",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );

  return res.data;
};
