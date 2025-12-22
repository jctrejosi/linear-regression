import type { RegressionMeta } from "./services/lineal_regression";
import { FaRegCopy, FaTimes } from "react-icons/fa";

type Props = {
  meta: RegressionMeta | null;
  open: boolean;
  onClose: () => void;
};

export const MetaModal = ({ meta, open, onClose }: Props) => {
  if (!open || !meta) return null;

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(meta, null, 2));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-blue-50 w-full max-w-2xl rounded-lg shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-blue-200 bg-blue-100">
          <h3 className="text-lg font-semibold">
            Informe de filtrado de datos en la regresión
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={copyJson}
              className="text-sm px-3 py-1 bg-gray-100 rounded flex items-center gap-2 hover:bg-gray-200"
              title="Copiar JSON"
            >
              <FaRegCopy /> copiar
            </button>
            <button
              onClick={onClose}
              className="text-xl px-2 py-1 text-gray-600 hover:text-gray-800"
              aria-label="cerrar"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <p className="text-sm text-gray-600">advertencias</p>
            {meta.warnings && meta.warnings.length ? (
              <ul className="list-disc ml-5 mt-2 text-sm text-orange-700">
                {meta.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">ninguna</p>
            )}
          </div>

          <div>
            <p className="text-sm text-gray-600">columnas descartadas</p>
            {meta.dropped_columns && meta.dropped_columns.length > 0 ? (
              <ul className="list-disc ml-5 mt-2 text-sm">
                {meta.dropped_columns.map((c) => (
                  <li key={c} className="text-gray-700">
                    {c}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">ninguna</p>
            )}
          </div>

          <div>
            <p className="text-sm text-gray-600">dummies automáticas</p>
            {meta.auto_dummies && meta.auto_dummies.length > 0 ? (
              <ul className="list-disc ml-5 mt-2 text-sm">
                {meta.auto_dummies.map((c) => (
                  <li key={c} className="text-gray-700">
                    {c}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">ninguna</p>
            )}
          </div>

          <div>
            <p className="text-sm text-gray-600">imputaciones</p>
            {meta.imputed_columns &&
            Object.keys(meta.imputed_columns).length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500">
                    <th>columna</th>
                    <th>mean</th>
                    <th>count imputed</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(meta.imputed_columns!).map(([col, val]) => (
                    <tr key={col} className="border-t">
                      <td className="py-1">{col}</td>
                      <td className="py-1">{val.mean ?? "—"}</td>
                      <td className="py-1">{val.count ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-gray-500">ninguna</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">filas antes</p>
              <p className="font-medium">{meta.rows_before ?? "—"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">filas después</p>
              <p className="font-medium">{meta.rows_after ?? "—"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
