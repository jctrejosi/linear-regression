import type { TableFile } from "@/@types";
import { useRef } from "react";

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
    value: string | number
  ) => {
    const updated = [...data];
    updated[rowIndex][colIndex] = value;
    setData({ columns, data: updated });
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
    const newColumns = columns.filter((_, i) => i !== colIndex);
    const newData = data.map((row) => row.filter((_, i) => i !== colIndex));
    setData({ columns: newColumns, data: newData });
  };

  const deleteRow = (rowIndex: number) => {
    const newData = data.filter((_, i) => i !== rowIndex);
    setData({ columns, data: newData });
  };

  return (
    <div className="p-6 bg-white shadow-md rounded-lg space-y-6">
      {/* Controles */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <button
          onClick={addRow}
          className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 transition font-semibold"
        >
          + Añadir fila
        </button>

        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <input
            type="text"
            placeholder="Nombre de la columna"
            ref={columnName}
            className="border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={addColumn}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition font-semibold"
          >
            + Añadir columna
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
                  <div className="flex items-center justify-between">
                    <span>{col}</span>
                    <button
                      onClick={() => deleteColumn(i)}
                      className="text-red-500 hover:text-red-700 font-bold ml-2"
                      title={`Eliminar columna "${col}"`}
                    >
                      X
                    </button>
                  </div>
                </th>
              ))}
              <th></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50 transition">
                <td className="px-3 py-2 text-sm text-gray-700">{rowIndex}</td>
                {row.map((cell, colIndex) => (
                  <td key={colIndex} className="px-2 py-1">
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
                    className="text-red-500 hover:text-red-700 font-bold"
                    title={`Eliminar fila ${rowIndex + 1}`}
                  >
                    X
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
