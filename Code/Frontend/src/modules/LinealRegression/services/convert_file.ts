import type { TableFile } from "@/@types";
import axios from "axios";

export const convert_file = async (file: File): Promise<TableFile> => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await axios.post<TableFile>("api/v1.0/converter_file", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data;
};
