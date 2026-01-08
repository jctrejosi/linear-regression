from flask import Blueprint, json
from scipy.stats import f
from pandas.api.types import (
    is_numeric_dtype,
    is_bool_dtype
)
import pandas as pd
import numpy as np
import statsmodels.api as sm
from dotenv import load_dotenv
import os
from statsmodels.stats.outliers_influence import variance_inflation_factor
from statsmodels.stats.diagnostic import het_breuschpagan, het_white
from statsmodels.stats.stattools import durbin_watson, jarque_bera
from scipy.stats import shapiro, kstest
import requests

def ask_llm(prompt: str) -> str:
    r = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": "qwen2.5:3b",
            "prompt": prompt,
            "temperature": 0.2,
            "num_ctx": 4096,
            "stream": False
        },
    )
    r.raise_for_status()
    return r.json()["response"]

load_dotenv()
bp = Blueprint('bp', __name__)


def is_serial_by_sort(s, tol=0.99):
    s = s.dropna()
    if not pd.api.types.is_numeric_dtype(s):
        return False
    diffs = s.sort_values().diff().dropna()
    # fracción de diferencias iguales
    most_common_ratio = diffs.value_counts(normalize=True).max()
    return most_common_ratio >= tol

# Clasificación automática de columnas para saber cuáles no usar en la regresión
def classify_columns(df, dependent=None, max_categories=15):
    info = {
        "other": [],
        "categorical": [],
        "datetime": [],
        "boolean": [],
        "constant": [],
        "id_like": [],
        "invalid": [],
        "serial": [],
    }

    n_rows = len(df)

    for col in df.columns:
        if col == dependent:
            continue

        s = df[col]
        nunique = s.nunique(dropna=True)

        # 1) constante
        if nunique <= 1:
            info["constant"].append(col)
            continue

        # 2) booleanos
        if is_bool_dtype(s) or set(s.dropna().unique()).issubset({0, 1, "0", "1", True, False}):
            info["boolean"].append(col)
            continue

        # 3) Comprobar si es una serie
        if is_numeric_dtype(s):
            if nunique == n_rows and pd.api.types.is_integer_dtype(s):
                if is_serial_by_sort(s):
                    info["serial"] = info.get("serial", []) + [col]
                else:
                    info["id_like"].append(col)

        # 4) datetime SOLO si es texto
        if s.dtype == "object":
            parsed = pd.to_datetime(s.dropna(), dayfirst=True, errors="coerce")

            # además exigimos separadores típicos de fecha
            has_date_tokens = s.dropna().astype(str).str.contains(r"[./\-:]").mean()

            if (
                len(parsed) > 0
                and parsed.notna().mean() >= 0.8
                and has_date_tokens >= 0.8
            ):
                info["datetime"].append(col)
                continue

        # 5) categóricos
        if nunique <= max_categories:
            info["categorical"].append(col)
            continue

        # 6) otros

        info["other"].append(col)

    return info

def run_regression(data: list, columns: list, dependent: str, alpha: float = 0.05) -> dict:
    try:
        # 0) cargar datos en DataFrame
        df_raw = pd.DataFrame(data, columns=columns)
        column_errors = {}         # detalles por columna (ejemplos/filas)
        meta = {
            "dropped_columns": [],   # columnas eliminadas automáticamente
            "auto_dummies": [],      # categóricas convertidas a dummies
            "warnings": [],          # avisos (e.g. dependent reasignado)
            "rows_before": len(df_raw),
            "rows_after": None,
            "imputed_columns": {},   # columnas imputadas: Llenar valores vacíos
        }

        # 1) clasificar columnas y eliminar las innecesarias
        info = classify_columns(df_raw, dependent)
        drop_cols = info["datetime"] + info["id_like"] + info["constant"] + info["serial"] + ['id']
        meta["dropped_columns"] = drop_cols.copy()
        meta["warnings"].append(
            f"Columnas eliminadas por tipo: {', '.join(drop_cols)}"
        )
        df = df_raw.drop(columns=drop_cols, errors="ignore").copy()

        # 2) detectar columnas constantes resultantes y descartarlas
        constant_cols_after = [c for c in df.columns if df[c].nunique() <= 1]
        if constant_cols_after:
            df = df.drop(columns=constant_cols_after, errors="ignore")
            meta["dropped_columns"] += constant_cols_after
            meta["warnings"].append(
                f"Se quitaron columnas constantes tras limpieza: {', '.join(constant_cols_after)}"
            )

        # 3) descartar columnas con demasiados NaN parciales
        nan_ratio = df.isna().mean()
        PARTIAL_NAN_THRESHOLD = 0.10  # 10% de tolerancia para NaN parciales
        cols_with_too_many_nan = nan_ratio[nan_ratio > PARTIAL_NAN_THRESHOLD].index.tolist()
        if cols_with_too_many_nan:
            meta["dropped_columns"].extend(cols_with_too_many_nan)
            meta["warnings"].append(
                f"Columnas eliminadas por exceso de valores no numéricos (> {PARTIAL_NAN_THRESHOLD*100}% NaN): {cols_with_too_many_nan}"
            )
            df = df.drop(columns=cols_with_too_many_nan, errors="ignore")

        # 4) transformar categóricas a dummies y booleanos a 0/1 (si existen)
        cats_to_dummy = [c for c in info["categorical"] if c in df.columns]
        bool_cols = [c for c in info["boolean"] if c in df.columns]

        for col in cats_to_dummy:
            df[col] = df[col].fillna("missing")  # asigna missing a NaN antes de dummies

        if cats_to_dummy:
            df = pd.get_dummies(df, columns=cats_to_dummy, drop_first=True)  # aplicar dummies a categóricas

        for col in bool_cols:
            df[col] = df[col].map({True: 1, False: 0, "True": 1, "False": 0}) # Convertir booleanos a 0/1
            df[col] = df[col].fillna(0).astype(int)

        # 5) asegurarse de que los datos sean números luego de transformar dummies
        for col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

        df = df.astype(float)

        meta["auto_dummies"] = cats_to_dummy.copy()

        # 6) en los valores NaN colocar la media de la columna (imputación)
        for col in df.columns:
            if df[col].isna().any():
                # calcular media sin NaN
                df[col] = df[col].astype(float) # asegurar float para la media
                mean_val = df[col].mean()
                if np.isnan(mean_val):
                    # si la media no se puede calcular (col vacía), se descartará más arriba
                    continue
                count_nan = int(df[col].isna().sum())
                df[col].fillna(mean_val, inplace=True)
                meta["imputed_columns"][col] = {"mean": float(mean_val), "count": count_nan}

        # 7) validar que quedan filas y columnas suficientes
        meta["rows_after"] = len(df)

        MIN_OBS = 5
        if df.columns.size < 2:
            return {
                "ok": False,
                "error": "No quedaron columnas utilizables después de la limpieza.",
                "details": column_errors,
                "meta": meta
            }

        if len(df) < MIN_OBS:
            return {
                "ok": False,
                "error": f"Se requieren al menos {MIN_OBS} observaciones después de la limpieza.",
                "n_after_clean": len(df),
                "meta": meta,
                "details": column_errors
            }

        # 8) determinar variable dependiente final
        dependent_col = dependent if dependent in df.columns else df.columns[0]
        if dependent_col not in df.columns:
            return {
                "ok": False,
                "error": "No se pudo determinar una variable dependiente válida tras la limpieza.",
                "meta": meta,
                "details": column_errors
            }

        # 9) construir y, X desde df_valid (ya limpio y con imputaciones)
        df_valid = df.copy()
        y = df_valid[dependent_col]
        X = df_valid.drop(columns=[dependent_col])

        if X.shape[1] == 0:
            return {
                "ok": False,
                "error": "No quedaron variables independientes después de la limpieza.",
                "meta": meta,
                "details": column_errors
            }

        X_const = sm.add_constant(X)
        model = sm.OLS(y, X_const).fit()

        # Métricas principales
        r2, r2_adj = model.rsquared, model.rsquared_adj
        f_stat, f_pvalue = model.fvalue, model.f_pvalue

        # Tabla ANOVA
        f_statistic = None
        p_value = None
        ssb_total = None
        sse_total = None
        msb = None
        mse = None

        try:
            anova_tbl = sm.stats.anova_lm(model)
            ssb_total = anova_tbl["sum_sq"][:-1].sum()  # suma de variables explicativas
            sse_total = anova_tbl["sum_sq"][-1]         # suma de cuadrados residuales
            msb = (ssb_total / (len(anova_tbl)-1))
            mse = (sse_total / anova_tbl["df"][-1])
            f_statistic = msb / mse
            p_value = 1 - f.cdf(f_statistic, len(anova_tbl)-1, anova_tbl["df"][-1])
            n_data = int(model.nobs)
            k_groups = len(anova_tbl)-1
            means = [round(model.params[var],2) for var in model.params.index if var != 'const']
            anova = {
                idx: {
                    "df": float(row["df"]),
                    "sum_sq": float(row["sum_sq"]),
                    "mean_sq": float(row["mean_sq"]),
                    "F": float(row.get("F", np.nan)),
                    "PR(>F)": float(row.get("PR(>F)", np.nan))
                }
                for idx, row in anova_tbl.iterrows()
            }
        except Exception as e:
            anova = {"error": "No se pudo calcular tabla ANOVA", "detalle": str(e)}

        resid = model.resid

        # Normalidad
        sw_stat, sw_p = shapiro(resid)
        ks_stat, ks_p = kstest((resid - resid.mean()) / resid.std(ddof=1), 'norm')
        jb_stat, jb_p, jb_skew, jb_kurt = jarque_bera(resid)

        # Heterocedasticidad
        bp_test = het_breuschpagan(resid, X_const)
        try:
            white_test = het_white(resid, X_const)
            white_result = {
                "stat": round(white_test[0], 4),
                "p_value": round(white_test[1], 4),
                "f_stat": round(white_test[2], 4),
                "f_p_value": round(white_test[3], 4)
            }
        except Exception:
            white_result = {
                "error": "No se pudo calcular la prueba de White (posible colinealidad exacta)."
            }

        # Durbin-Watson
        dw = durbin_watson(resid)

        # VIF
        vif = []
        for i, col in enumerate(X_const.columns):
            if col == 'const':
                continue
            vif_value = variance_inflation_factor(X_const.values, i)
            vif.append({"variable": col, "VIF": float(vif_value)})

        # Coeficientes
        coefs = [{
            "variable": var,
            "coef": float(model.params[var]),
            "p_value": float(model.pvalues[var])
        } for var in model.params.index]

        # Cook's distance y otros valores diagnósticos
        influence = model.get_influence()
        summary_frame = influence.summary_frame()

        results_table = pd.DataFrame({
            "id": df.index,
            "Y_observado": model.model.endog,
            "Y_predicho": model.fittedvalues,
            "Residuo": model.resid,
            "Residuo_estandarizado": summary_frame["standard_resid"],
            "Leverage": summary_frame["hat_diag"],
            "Cooks_distance": summary_frame["cooks_d"],
            "Outlier": np.abs(summary_frame["standard_resid"]) > 2
        })

        # Conclusión global
        conclusion = (
            "Rechazamos H0: el modelo es significativo"
            if f_pvalue < alpha else
            "No rechazamos H0: el modelo no es significativo"
        )

        # Cadena de coeficientes y VIF para el prompt
        coefs_str = "\n".join([
            f"{c['variable']}\t{c['coef']}\t{c['p_value']}"
            for c in coefs
        ])
        vif_str = "\n".join([
            f"{v['variable']}\t{v['VIF']}"
            for v in vif
        ])

        anova_str = json.dumps(anova, indent=2)

        prompt_full_analysis = f"""
Eres un asistente experto en estadística aplicada, regresión lineal y análisis ANOVA.
Tu misión: explicar de forma técnica y, al mismo tiempo, comprensible para una persona sin formación previa en estadística.
Usa lenguaje claro, frases completas, ejemplos sencillos y analogías cuando ayude a entender, pero ve directo al punto técnico. Mantén los nombres de las variables exactamente como te las doy (por ejemplo: {dependent_col}, {coefs_str}, {vif_str}, {anova_str}).

FORMATO GENERAL Y REGLAS
- Entrega la respuesta en **markdown** con encabezados claros (`##`, `###`) y listas cuando convenga.
- Inicia con un **resumen ejecutivo corto (2–4 frases)** que responda: ¿el modelo sirve? ¿qué decisión práctica sugiere?
- Para cada sección principal ofrece:
  1. una **explicación simple** (3–6 oraciones) para un usuario sin experiencia,
  2. una **explicación técnica** (3–6 oraciones) para alguien con conocimiento básico,
  3. **consecuencias prácticas** y **recomendaciones** (2–4 puntos accionables).
- Si hay resultados preocupantes (p-values altos, VIF altos, heterocedasticidad), explícala claramente y da **3 acciones concretas** (qué hacer ahora).
- Evita fórmulas complejas; si necesitas mencionar una fórmula, hazlo en lenguaje natural o en una nota técnica al final.
- Si alguna sección no aplica o los cálculos no son posibles, indica claramente “No aplica” y por qué.

==============================
0. resumen ejecutivo (inicio)
==============================
- 2–4 frases: respuesta directa sobre utilidad del modelo y recomendaciones prioritarias.

==============================
1. resumen general del modelo
==============================
Datos clave:
- Observaciones usadas: {int(model.nobs)}
- Variable dependiente: {dependent_col}
- R²: {r2}
- R² ajustado: {r2_adj}
- Estadístico F del modelo: {f_statistic}
- Valor p del modelo: {f_pvalue}

Para esta sección, por favor:
1. Explica en lenguaje sencillo qué es cada métrica (R², R² ajustado, F, p).
2. Di si esos valores indican que el modelo captura bien la variación de la variable dependiente.
3. Señala, en términos prácticos, qué significa para un cliente (por ejemplo: "este modelo explica X% de la variación; eso es suficiente si...").
4. Aporta 2–3 recomendaciones concretas y priorizadas (p. ej. recolectar más datos, revisar variables, transformar Y).

==============================
2. anova del modelo (anova_lm)
==============================
Tabla ANOVA (modelo de regresión):
{anova_str}

Notas rápidas:
- Explica brevemente qué mide esta tabla (qué representa cada fila y columna).
- Para CADA fila relevante (variables con PR(>F) pequeña):
  - Indica en lenguaje claro si la variable aporta de forma significativa.
  - Explica la magnitud relativa de su contribución (sin fórmulas).
- Señala variables que NO aportan y por qué podría ocurrir (colinealidad, baja varianza).
- Consejos prácticos: 2–3 acciones (quitar variable, combinar categorías, recolectar más datos).

==============================
3. interpretación de coeficientes
==============================
Coeficientes (variable, coeficiente, p-valor):
{coefs_str}

Para cada coeficiente (hazlo en una lista ordenada):
1. explicación sencilla: ¿qué indica este número para el cliente? (ej.: "un aumento de 1 unidad en X se asocia con ...")
2. interpretación técnica: signo, magnitud y p-valor (si es significativo).
3. recomendación práctica si aplica (ej.: verificar escala, estandarizar, transformar).

Si hay coeficientes con p > 0.05, explica qué significa “no significativo” en términos no técnicos y qué hacer.

==============================
4. supuestos del modelo (residuos)
==============================
Resultados:
- Shapiro-Wilk p: {round(sw_p, 4)}
- Kolmogorov-Smirnov p: {round(ks_p, 4)}
- Jarque-Bera p: {round(jb_p, 4)}
- Skewness: {round(jb_skew, 4)}
- Kurtosis: {round(jb_kurt, 4)}
- Durbin-Watson: {round(dw, 4)}

Para esta sección:
- Explica en términos simples qué significan “residuos normales” y por qué importa.
- Para cada test, di en lenguaje llano si su resultado sugiere problema (sí/no) y por qué.
- Indica consecuencias prácticas (ej.: intervalos de confianza inexactos, tests poco fiables).
- Recomienda 3 soluciones prácticas si hay problemas (transformaciones, errores robustos, bootstrap, modelado alternativo).

==============================
5. heterocedasticidad
==============================
Resultados:
- Breusch-Pagan: LM p = {round(bp_test[1], 4)}, F p = {round(bp_test[3], 4)}
- White: estadístico = {white_result["stat"]}, p-valor = {white_result["p_value"]}

Tareas:
- Explica claramente qué es heterocedasticidad con una metáfora simple.
- Indica si hay evidencia de heterocedasticidad y las implicaciones prácticas.
- Propón 3 soluciones ordenadas por simplicidad y efectividad (ej.: errores robustos, transformación log, modelar varianza).

==============================
6. multicolinealidad (VIF)
==============================
Resultados VIF:
{vif_str}

Tareas:
- Explica qué es VIF y por qué valores altos preocupan (en lenguaje no técnico).
- Enumera variables con VIF problemático y qué significa para sus coeficientes.
- Da 3 opciones prácticas para mitigarlo (remover variables, combinar, PCA / reducir dimensionalidad).

==============================
7. conclusiones y pasos siguientes (priorizados)
==============================
- 4–6 bullets con acciones concretas y priorizadas (qué hacer primero, qué puede esperar el cliente).
- Incluye una recomendación sobre si repetir el análisis tras cambios y qué medir.

==============================
APÉNDICE TÉCNICO (breve)
==============================
- Significancia global del modelo: evalúa si, en conjunto, las variables explicativas aportan información sobre la variable dependiente. El estadístico F y su p-valor indican si podemos confiar en que el modelo no se ajusta por azar.
- Contribución relativa de cada variable: analiza qué variables tienen efectos fuertes o débiles, considerando tanto el coeficiente como su significancia estadística (p < 0.05).
- Multicolinealidad: valores altos de VIF sugieren que algunas variables explicativas están fuertemente correlacionadas. Esto puede inflar errores estándar, dificultando la interpretación de coeficientes.
- Supuestos del modelo: normalidad de residuos, homocedasticidad y ausencia de autocorrelación. Cada violación afecta la fiabilidad de inferencias y predicciones.
- Heterocedasticidad y robustez: si hay evidencia de heterocedasticidad, los errores estándar convencionales pueden ser inexactos, afectando los intervalos de confianza y la significancia de los coeficientes.
- Residuos y ajustes del modelo: la revisión de residuos permite identificar valores atípicos, patrones no lineales o variables omitidas que podrían mejorar el modelo.
- Coeficientes y dirección de efecto: interpretar correctamente el signo (positivo/negativo) y magnitud de cada coeficiente en contexto, considerando la escala de la variable.
- Recomendaciones técnicas: transformar variables si la relación es no lineal, estandarizar si las escalas son muy diferentes, revisar outliers y, si es necesario, considerar interacciones entre variables.

REGLAS FINALES
- No cambies ni inventes nombres de variables; usa exactamente las variables que te pasaron.
- La salida debe ser explicativa pero utilizable directamente en HTML/Markdown.
- Prioriza la claridad para usuarios sin formación en estadística, pero incluye la capa técnica para usuarios intermedios.
- Asegúrate de cerrarlo con una **sección de recomendaciones prácticas priorizadas**.
"""

        ia_response = ask_llm(prompt_full_analysis)

        return {
            "ok": True,
            "meta": meta,
            "n_obs": int(model.nobs),
            "dependent_variable": dependent_col,
            "r2": round(r2, 4),
            "r2_adj": round(r2_adj, 4),
            "f_statistic": round(f_stat, 4),
            "f_pvalue": round(f_pvalue, 4),

            # anova
            "anova": {
                "ok": True,
                "n_data": n_data,
                "k_groups": k_groups,
                "f_statistics": round(f_statistic, 2),
                "means": means,
                "global_mean": round(model.model.endog.mean(), 2),
                "p_value": round(p_value, 4),
                "conclusion": "Se rechaza H0" if p_value < 0.05 else "No se rechaza H0",
                "ssb_total": round(ssb_total,2),
                "sse_total": round(sse_total,2),
                "msb": round(msb,2),
                "mse": round(mse,2)
            },

            # coeficientes
            "coefs": coefs,

            # supuestos / normalidad
            "normality": {
                "shapiro_p": round(sw_p, 4),
                "ks_p": round(ks_p, 4),
                "jarque_bera_p": round(jb_p, 4),
                "skewness": round(jb_skew, 4),
                "kurtosis": round(jb_kurt, 4)
            },

            # heterocedasticidad
            "breusch_pagan": {
                "LM_p": round(bp_test[1], 4),
                "F_p": round(bp_test[3], 4)
            },
            "white_test": white_result,

            "durbin_watson": round(dw, 4),
            "vif": vif,
            "conclusion": conclusion,
            "results_table": results_table.round(4).to_dict(orient="records"),

            # respuestas de la IA

            "ia_response": ia_response,
        }


    except Exception as e:
        import traceback
        return {
            "ok": False,
            "meta": meta,
            "error": str(e),
            "trace": traceback.format_exc()
        }
