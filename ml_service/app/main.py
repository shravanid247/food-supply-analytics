from functools import lru_cache
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import load_model


BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
MODEL_PATH = PROJECT_ROOT / "models" / "lstm_model.h5"
FOOD_PRICE_DATA_PATH = BASE_DIR / "data" / "clean_food_price_indices.csv"
CPI_DATA_PATH = BASE_DIR / "data" / "clean_consumer_price_indices.csv"
TRADE_MATRIX_PATH = BASE_DIR / "data" / "clean_trade_matrix.csv"

app = FastAPI(title="Food Supply Chain Disruption Analyzer", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

COMMODITY_ITEM_MAP = {
    "Cereals": ["Breakfast cereals", "Rice, paddy (rice milled equivalent)", "Rice, milled", "Wheat and meslin flour", "Uncooked pasta, not stuffed or otherwise prepared"],
    "Oils": ["Other oil of vegetable origin, crude n.e.c.", "Essential oils n.e.c."],
    "Sugar": ["Refined sugar", "Sugar confectionery", "Sugar and syrups n.e.c."],
    "Dairy": ["Cheese from whole cow milk", "Yoghurt, with additives"],
    "Meat": ["Food preparations n.e.c.", "Dog or cat food, put up for retail sale"],
}

FOOD_PRICE_COLUMN_MAP = {
    "Cereals": "Cereals",
    "Oils": "Oils",
    "Sugar": "Sugar",
    "Dairy": "Dairy",
    "Meat": "Meat",
}


@lru_cache(maxsize=1)
def get_food_price_data():
    if not FOOD_PRICE_DATA_PATH.exists():
        return None
    return pd.read_csv(FOOD_PRICE_DATA_PATH)


@lru_cache(maxsize=1)
def get_cpi_data():
    if not CPI_DATA_PATH.exists():
        return None
    return pd.read_csv(CPI_DATA_PATH, encoding="latin-1")


@lru_cache(maxsize=1)
def get_trade_data():
    if not TRADE_MATRIX_PATH.exists():
        return None
    return pd.read_csv(TRADE_MATRIX_PATH, encoding="latin-1")


@lru_cache(maxsize=1)
def get_lstm_model():
    if not MODEL_PATH.exists():
        return None
    return load_model(MODEL_PATH, compile=False)


@app.get("/")
def root():
    return {
        "status": "ok",
        "service": "ml_service",
        "model_path_exists": MODEL_PATH.exists(),
        "food_data_loaded": get_food_price_data() is not None,
        "cpi_data_loaded": get_cpi_data() is not None,
        "trade_data_loaded": get_trade_data() is not None,
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": get_lstm_model() is not None,
        "food_data_loaded": get_food_price_data() is not None,
        "cpi_data_loaded": get_cpi_data() is not None,
        "trade_data_loaded": get_trade_data() is not None,
    }


@app.get("/predict")
def predict():
    food_price_df = get_food_price_data()
    model = get_lstm_model()

    if food_price_df is None:
        raise HTTPException(status_code=503, detail="Missing clean_food_price_indices.csv")

    required_columns = {"Date", "Food Price Index"}
    if not required_columns.issubset(food_price_df.columns):
        raise HTTPException(status_code=500, detail=f"Missing columns: {sorted(required_columns)}")

    data = food_price_df.dropna(subset=["Date", "Food Price Index"]).copy()
    data["Date"] = pd.to_datetime(data["Date"], errors="coerce")
    data["Food Price Index"] = pd.to_numeric(data["Food Price Index"], errors="coerce")
    data = data.dropna(subset=["Date", "Food Price Index"]).sort_values("Date")

    if len(data) < 12:
        raise HTTPException(status_code=503, detail="Need at least 12 rows.")

    recent = data[["Food Price Index"]].tail(12).to_numpy(dtype=float)
    scaler = MinMaxScaler()
    recent_scaled = scaler.fit_transform(recent)
    predictions_scaled = []
    input_seq = recent_scaled.copy()

    if model is not None:
        for _ in range(6):
            x_input = input_seq.reshape(1, 12, 1)
            prediction = model.predict(x_input, verbose=0)
            predictions_scaled.append(prediction[0][0])
            input_seq = np.vstack([input_seq[1:], prediction.reshape(1, 1)])
        predictions = scaler.inverse_transform(np.array(predictions_scaled).reshape(-1, 1)).flatten()
    else:
        latest_value = float(data["Food Price Index"].iloc[-1])
        predictions = np.array([latest_value] * 6, dtype=float)

    last_date = data["Date"].iloc[-1]
    future_months = pd.date_range(start=last_date, periods=7, freq="MS")[1:]

    return {
        "status": "success",
        "model_used": model is not None,
        "current_price": round(float(data["Food Price Index"].iloc[-1]), 2),
        "predictions": [
            {"month": str(month.date()), "predicted_price": round(float(price), 2)}
            for month, price in zip(future_months, predictions)
        ],
    }


@app.get("/risk")
def risk(year: int = None):
    cpi_df = get_cpi_data()

    if cpi_df is None:
        raise HTTPException(status_code=503, detail="Missing clean_consumer_price_indices.csv")

    required_columns = {"Area", "Date", "Value"}
    if not required_columns.issubset(cpi_df.columns):
        raise HTTPException(status_code=500, detail=f"Missing columns: {sorted(required_columns)}")

    df = cpi_df.copy()
    df["Date"] = pd.to_datetime(df["Date"], errors="coerce")
    df["Value"] = pd.to_numeric(df["Value"], errors="coerce")
    df = df.dropna(subset=["Area", "Date", "Value"])
    df = df[df["Value"] > 0]

    if df.empty:
        raise HTTPException(status_code=503, detail="No usable rows.")

    available_years = sorted(df["Date"].dt.year.unique().tolist())

    if year and year in available_years:
        selected_year = year
    else:
        selected_year = available_years[-1]

    df_year = df[df["Date"].dt.year == selected_year]
    df_year = df_year.sort_values("Date").groupby("Area", as_index=False).last()

    def get_risk_level(value):
        if value > 300:
            return "CRITICAL"
        if value > 150:
            return "HIGH"
        if value > 110:
            return "MEDIUM"
        return "LOW"

    df_year["risk_level"] = df_year["Value"].apply(get_risk_level)

    result = df_year[["Area", "Value", "risk_level"]].rename(
        columns={"Area": "country", "Value": "cpi_value"}
    ).to_dict(orient="records")

    return {
        "status": "success",
        "total_countries": len(result),
        "selected_year": selected_year,
        "timeline_labels": available_years,
        "risk_data": result,
    }


@app.get("/food-prices")
def food_prices(commodity: str = "Cereals"):
    food_price_df = get_food_price_data()

    if food_price_df is None:
        raise HTTPException(status_code=503, detail="Missing clean_food_price_indices.csv")

    col = FOOD_PRICE_COLUMN_MAP.get(commodity, "Cereals")

    if col not in food_price_df.columns:
        available = [c for c in food_price_df.columns if c != "Date"]
        col = available[0] if available else None

    if not col:
        raise HTTPException(status_code=500, detail="No commodity columns found")

    df = food_price_df[["Date", col]].dropna().copy()
    df["Date"] = pd.to_datetime(df["Date"], errors="coerce")
    df = df.dropna(subset=["Date"]).sort_values("Date")
    df[col] = pd.to_numeric(df[col], errors="coerce")
    df = df.dropna(subset=[col])

    return {
        "status": "success",
        "commodity": commodity,
        "column_used": col,
        "data": [
            {"date": str(row["Date"].date()), "value": round(float(row[col]), 2)}
            for _, row in df.iterrows()
        ],
    }


@app.get("/trade")
def trade(country: str = Query(...), commodity: str = Query(default="Cereals")):
    trade_df = get_trade_data()

    if trade_df is None:
        raise HTTPException(status_code=503, detail="Missing clean_trade_matrix.csv")

    required_columns = {"Reporter Country", "Partner Country", "Item", "Element", "Value"}
    if not required_columns.issubset(trade_df.columns):
        raise HTTPException(status_code=500, detail=f"Missing columns: {sorted(required_columns)}")

    items = COMMODITY_ITEM_MAP.get(commodity, COMMODITY_ITEM_MAP["Cereals"])

    df = trade_df[trade_df["Item"].isin(items)].copy()
    df["Value"] = pd.to_numeric(df["Value"], errors="coerce").fillna(0)

    # Imports — country is the Reporter, partner is the source
    imports_df = df[
        (df["Reporter Country"] == country) &
        (df["Element"].str.contains("Import", case=False))
    ]
    imports = (
        imports_df.groupby("Partner Country")["Value"]
        .sum()
        .reset_index()
        .sort_values("Value", ascending=False)
        .head(5)
    )

    # Exports — country is the Reporter, partner is the destination
    exports_df = df[
        (df["Reporter Country"] == country) &
        (df["Element"].str.contains("Export", case=False))
    ]
    exports = (
        exports_df.groupby("Partner Country")["Value"]
        .sum()
        .reset_index()
        .sort_values("Value", ascending=False)
        .head(5)
    )

    return {
        "status": "success",
        "country": country,
        "commodity": commodity,
        "imports": imports.rename(columns={"Partner Country": "partner", "Value": "value"}).to_dict(orient="records"),
        "exports": exports.rename(columns={"Partner Country": "partner", "Value": "value"}).to_dict(orient="records"),
    }