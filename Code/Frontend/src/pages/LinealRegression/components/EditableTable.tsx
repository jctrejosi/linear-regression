import type { TableFile } from "@/@types";
import { useRef } from "react";
import { FiTrash2 } from "react-icons/fi";
import { AiOutlineInsertRowRight } from "react-icons/ai";
import { AiOutlineInsertRowBelow } from "react-icons/ai";

interface EditableTableProps {
  columns: string[];
  data: (number | string | null)[][];
  setData: (data: TableFile) => void;
}

export const EditableTable = ({
  columns,
  data,
  setData,
}: EditableTableProps) => {
  const columnName = useRef<HTMLInputElement>(null);

  const handleCellChange = (
    rowIndex: number,
    colIndex: number,
    value: string | number,
  ) => {
    const updated = [...data];
    updated[rowIndex][colIndex] = value;
    setData({ columns, data: updated });
  };

  const handleColumnNameChange = (colIndex: number, value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    if (columns.some((c, i) => c === trimmed && i !== colIndex)) {
      return;
    }

    const newColumns = [...columns];
    newColumns[colIndex] = trimmed;
    setData({ columns: newColumns, data });
  };

  const addRow = () => {
    if (columns.length === 0) {
      alert("Por favor, añade al menos una columna antes de añadir filas.");
      return;
    }
    const newRow = Array(columns.length).fill(null);
    setData({ columns, data: [...data, newRow] });
  };

  const addColumn = () => {
    const newColumnName = columnName.current?.value.trim() || "";
    if (!newColumnName) {
      alert("Por favor, introduce un nombre para la columna.");
      return;
    }
    if (columns.includes(newColumnName)) {
      alert("Ese nombre de columna ya existe.");
      return;
    }
    const newColumns = [...columns, newColumnName];
    const newData = data.map((row) => [...row, null]);
    columnName.current!.value = "";
    setData({ columns: newColumns, data: newData });
  };

  const deleteColumn = (colIndex: number) => {
    const confirmDelete = confirm(
      `¿Seguro que deseas eliminar la columna "${columns[colIndex]}"?`,
    );
    if (!confirmDelete) return;

    const newColumns = columns.filter((_, i) => i !== colIndex);
    const newData = data.map((row) => row.filter((_, i) => i !== colIndex));
    setData({ columns: newColumns, data: newData });
  };

  const deleteRow = (rowIndex: number) => {
    const confirmDelete = confirm(
      `¿Seguro que deseas eliminar la fila ${rowIndex + 1}?`,
    );
    if (!confirmDelete) return;

    const newData = data.filter((_, i) => i !== rowIndex);
    setData({ columns, data: newData });
  };

  return (
    <div className="p-6 bg-white shadow-md rounded-lg space-y-6">
      {/* Controles */}
      <div className="flex flex-col gap-4">
        <button
          onClick={addRow}
          className="
    flex items-center justify-center gap-2
    bg-gray-900 text-white px-5 py-2 rounded
    hover:bg-gray-600 transition font-semibold
    w-full sm:w-fit
  "
        >
          <AiOutlineInsertRowBelow /> Añadir fila
        </button>

        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <input
            type="text"
            placeholder="Nombre de la columna"
            ref={columnName}
            className="
      w-full
      sm:w-64
      border border-gray-300 rounded
      px-4 py-2
      focus:outline-none focus:ring-2 focus:ring-blue-400
    "
          />

          <button
            onClick={addColumn}
            className="
      flex items-center justify-center gap-2
      bg-gray-900 text-white
      px-4 py-2 rounded
      hover:bg-gray-600 transition font-semibold
      w-full sm:w-auto whitespace-nowrap
    "
          >
            <AiOutlineInsertRowRight /> Añadir columna
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 divide-y divide-gray-200 rounded-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">
                #
              </th>
              {columns.map((col, i) => (
                <th
                  key={i}
                  className="px-3 py-2 text-left text-sm font-medium text-gray-700"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={col}
                      onChange={(e) =>
                        handleColumnNameChange(i, e.target.value)
                      }
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <button
                      onClick={() => deleteColumn(i)}
                      className="text-red-500 hover:text-red-700 shrink-0"
                      title={`Eliminar columna "${col}"`}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </th>
              ))}
              <th />
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50 transition">
                <td className="px-3 py-2 text-sm text-gray-700">{rowIndex}</td>
                {row.map((cell, colIndex) => (
                  <td key={colIndex} className="px-2 py-1 min-w-[120px]">
                    <input
                      type="text"
                      value={cell ?? ""}
                      onChange={(e) =>
                        handleCellChange(rowIndex, colIndex, e.target.value)
                      }
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </td>
                ))}
                <td className="px-2 py-1">
                  <button
                    onClick={() => deleteRow(rowIndex)}
                    className="text-red-500 hover:text-red-700"
                    title={`Eliminar fila ${rowIndex + 1}`}
                  >
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Nota */}
      {columns.length === 0 && (
        <p className="text-gray-500 text-sm mt-2">
          Añade columnas para empezar a ingresar datos.
        </p>
      )}
    </div>
  );
};
