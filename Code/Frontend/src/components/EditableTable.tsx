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
    <div>
      <button onClick={addRow}>+ Añadir fila</button>
      <div>
        <button onClick={addColumn}>+ Añadir columna</button>
        <label htmlFor="column">Nombre de la columna:</label>
        <input
          id="column"
          type="text"
          placeholder="Nombre de la columna"
          ref={columnName}
          style={{ marginLeft: "0.5rem" }}
        />
      </div>

      <table
        border={1}
        style={{ borderCollapse: "collapse", marginTop: "1rem" }}
      >
        <thead>
          <tr>
            <th></th>
            {columns.map((col, i) => (
              <th key={i}>
                {col}
                <button
                  onClick={() => deleteColumn(i)}
                  style={{ marginLeft: "0.5rem", color: "red" }}
                  title={`Eliminar columna "${col}"`}
                >
                  X
                </button>
              </th>
            ))}
            <th>{/* espacio para el botón de borrar fila */}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              <td>{rowIndex}</td>
              {row.map((cell, colIndex) => (
                <td key={colIndex}>
                  <input
                    type="text"
                    value={cell ?? ""}
                    onChange={(e) =>
                      handleCellChange(rowIndex, colIndex, e.target.value)
                    }
                    style={{ width: "100px" }}
                  />
                </td>
              ))}
              <td>
                <button
                  onClick={() => deleteRow(rowIndex)}
                  style={{ color: "red" }}
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
  );
};
