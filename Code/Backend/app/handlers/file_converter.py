import os
import tempfile
import pandas as pd
import pyreadstat

def file_converter(file):
    ext = os.path.splitext(file.filename)[1].lower()

    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as temp_file:
        file.save(temp_file.name)
        temp_path = temp_file.name

    try:
        if ext == '.sav':
            df, meta = pyreadstat.read_sav(temp_path)

        elif ext == '.csv':
            df = pd.read_csv(temp_path)

        elif ext == '.xlsx':
            # Formato moderno de Excel
            df = pd.read_excel(temp_path, engine='openpyxl')

        elif ext == '.xls':
            # Formato antiguo de Excel (requiere xlrd==1.2.0)
            df = pd.read_excel(temp_path, engine='xlrd')

        elif ext == '.ods':
            df = pd.read_excel(temp_path, engine='odf')

        else:
            raise ValueError(f"Tipo de archivo no soportado: {ext}")

        # Validación de contenido
        if df.empty:
            raise ValueError("El archivo fue leído pero no contiene datos.")

        columnas = df.columns.tolist()
        data_json = df.fillna("").values.tolist()  # Limpia NaN para evitar errores en el front

        return {
            "ok": True,
            "columns": columnas,
            "data": data_json
        }

    except Exception as e:
        return {"ok": False, "error": str(e)}

    finally:
        os.remove(temp_path)
