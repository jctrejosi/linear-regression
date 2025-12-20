from flask import Blueprint
from openai import OpenAI
import pandas as pd
import numpy as np
import statsmodels.api as sm
from dotenv import load_dotenv
import os
from statsmodels.stats.outliers_influence import variance_inflation_factor
from statsmodels.stats.diagnostic import het_breuschpagan, het_white
from statsmodels.stats.stattools import durbin_watson, jarque_bera
from scipy.stats import shapiro, kstest

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

bp = Blueprint('bp', __name__)

def run_regression(data: list, columns: list, dependent: str, categorical: list = [], alpha: float = 0.05) -> dict:
    try:
        df = pd.DataFrame(data, columns=columns)

        # 1. Reemplazar strings vacíos por NaN explícitos
        df.replace(r'^\s*$', np.nan, regex=True, inplace=True)

        # 2. Detectar columnas categóricas (antes de forzar a numérico)
        # Validar que las columnas existen
        categorical_cols = [col for col in categorical if col in df.columns]
        if categorical_cols:
            df = pd.get_dummies(df, columns=categorical_cols, drop_first=True)

        # 3. Crear dummies SOLO para categóricas válidas
        if categorical_cols:
            df = pd.get_dummies(df, columns=categorical_cols, drop_first=True)

        # 4. Convertir todo a numérico y eliminar nulos
        df = df.apply(pd.to_numeric, errors='coerce')
        df.dropna(inplace=True)

        if dependent not in df.columns:
            return {"ok": False, "error": f"La variable dependiente '{dependent}' no existe en las columnas."}

        df = df.apply(pd.to_numeric, errors='coerce').dropna()

        if df.empty:
            return {"ok": False, "error": "Los datos están vacíos después de limpiar valores no numéricos o nulos."}
        if len(df) < 5:
            return {"ok": False, "error": "Se requieren al menos 5 observaciones para una regresión confiable."}

        y = df[dependent]
        X = df.drop(columns=[dependent])
        if X.shape[1] == 0:
            return {"ok": False, "error": "No hay variables independientes (predictoras) disponibles."}
        X_const = sm.add_constant(X)

        model = sm.OLS(y, X_const).fit()

        # Métricas principales
        r2, r2_adj = model.rsquared, model.rsquared_adj
        f_stat, f_pvalue = model.fvalue, model.f_pvalue

        # Tabla ANOVA
        try:
            anova_tbl = sm.stats.anova_lm(model)
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

        # Prompt para OpenAI
        prompt = f"""
A continuación, te presento todos los resultados relevantes de una regresión lineal múltiple. Quiero que los interpretes en el **mismo orden** en el que los presento, **sin asumir nada adicional**, y que escribas la respuesta con **títulos visibles para cada sección**, seguidos de una explicación clara, útil y técnica.

Las instrucciones para cada sección son:

- Muestra los resultados bajo un título claro.
- Primero, explica brevemente para qué sirve esa sección o prueba.
- Luego, interpreta los resultados específicos que te entrego.
- No uses ## ni comentarios, usa títulos como si fuera un informe.
- En la sección de coeficientes, **no expliques el valor del coeficiente**, solo dime **si la variable es significativa (p < 0.05)** y **arma el modelo final Y = ...** con solo las variables significativas.
- Si detectas problemas, propón acciones para mejorar el modelo.

---

### Resultados de la Regresión Lineal Múltiple

**Coeficientes**

Variable\tCoeficiente\tValor p  
{coefs_str}

---

**Resumen del Modelo**

Observaciones: {len(df)}  
Variables independientes: {X.shape[1]}  
R²: {round(r2, 4)}  
R² ajustado: {round(r2_adj, 4)}  
Estadístico F: {round(f_stat, 4)}  
Valor p del modelo: {round(f_pvalue, 4)}  
Conclusión: {conclusion}

---

**Pruebas de Supuestos**

Shapiro-Wilk p: {round(sw_p, 4)}  
Kolmogorov-Smirnov p: {round(ks_p, 4)}  
Jarque-Bera p: {round(jb_p, 4)}  
Skewness: {round(jb_skew, 4)}  
Kurtosis: {round(jb_kurt, 4)}  
Durbin-Watson: {round(dw, 4)}

---

**Breusch-Pagan (Heterocedasticidad)**

LM p: {round(bp_test[1], 4)}  
F p: {round(bp_test[3], 4)}

---

**White (Heterocedasticidad)**

Estadístico: {white_result.get("stat", "N/A")}  
p-valor: {white_result.get("p_value", "N/A")}  
F-stat: {white_result.get("f_stat", "N/A")}  
F p-valor: {white_result.get("f_p_value", "N/A")}

---

**VIF (Multicolinealidad)**

Variable\tVIF  
{vif_str}

---
Tabla de residuos
{results_table}

---
"""

        # Consulta a GPT
        gpt_response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "Eres un experto en estadística."},
                {"role": "user", "content": prompt.strip()}
            ],
            temperature=0.4,
            max_tokens=1500
        )

        return {
            "ok": True,
            "n_obs": int(model.nobs),
            "n_vars": int(len(model.params) - 1),
            "r2": round(r2, 4),
            "r2_adj": round(r2_adj, 4),
            "f_statistic": round(f_stat, 4),
            "f_pvalue": round(f_pvalue, 4),
            "anova": anova,
            "coefs": coefs,
            "normality": {
                "shapiro_p": round(sw_p, 4),
                "ks_p": round(ks_p, 4),
                "jarque_bera_p": round(jb_p, 4),
                "skewness": round(jb_skew, 4),
                "kurtosis": round(jb_kurt, 4)
            },
            "breusch_pagan": {
                "LM_p": round(bp_test[1], 4),
                "F_p": round(bp_test[3], 4)
            },
            "white_test": white_result,
            "durbin_watson": round(dw, 4),
            "vif": vif,
            "conclusion": conclusion,
            "interpretacion": gpt_response.choices[0].message.content,
            "results_table": results_table.round(4).to_dict(orient="records")
        }

    except Exception as e:
        import traceback
        return {
            "ok": False,
            "error": str(e),
            "trace": traceback.format_exc()
        }
