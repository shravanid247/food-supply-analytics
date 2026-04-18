from functools import lru_cache
from pathlib import Path

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import load_model


BASE_DIR = Path(__file__).resolve().parent        # = ml_service/app
PROJECT_ROOT = BASE_DIR.parent                     # = ml_service
MODEL_PATH = PROJECT_ROOT / "models" / "lstm_model.h5"  # = ml_service/models/lstm_model.h5 
FOOD_PRICE_DATA_PATH = BASE_DIR / "data" / "clean_food_price_indices.csv"
CPI_DATA_PATH = BASE_DIR / "data" / "clean_consumer_price_indices.csv"


app = FastAPI(title="Food Supply Chain Disruption Analyzer", version="1.0.0")

app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)


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
	}


@app.get("/health")
def health():
	return {
		"status": "ok",
		"model_loaded": get_lstm_model() is not None,
		"food_data_loaded": get_food_price_data() is not None,
		"cpi_data_loaded": get_cpi_data() is not None,
	}


@app.get("/predict")
def predict():
	food_price_df = get_food_price_data()
	model = get_lstm_model()

	if food_price_df is None:
		raise HTTPException(
			status_code=503,
			detail="Missing app/data/clean_food_price_indices.csv",
		)

	required_columns = {"Date", "Food Price Index"}
	if not required_columns.issubset(food_price_df.columns):
		raise HTTPException(
			status_code=500,
			detail=f"Prediction data must include columns: {sorted(required_columns)}",
		)

	data = food_price_df.dropna(subset=["Date", "Food Price Index"]).copy()
	data["Date"] = pd.to_datetime(data["Date"], errors="coerce")
	data["Food Price Index"] = pd.to_numeric(data["Food Price Index"], errors="coerce")
	data = data.dropna(subset=["Date", "Food Price Index"]).sort_values("Date")

	if len(data) < 12:
		raise HTTPException(status_code=503, detail="Need at least 12 rows of food price data.")

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
def risk():
	cpi_df = get_cpi_data()

	if cpi_df is None:
		raise HTTPException(
			status_code=503,
			detail="Missing app/data/clean_consumer_price_indices.csv",
		)

	required_columns = {"Area", "Date", "Value"}
	if not required_columns.issubset(cpi_df.columns):
		raise HTTPException(
			status_code=500,
			detail=f"Risk data must include columns: {sorted(required_columns)}",
		)

	latest = cpi_df.copy()
	latest["Date"] = pd.to_datetime(latest["Date"], errors="coerce")
	latest["Value"] = pd.to_numeric(latest["Value"], errors="coerce")
	latest = latest.dropna(subset=["Area", "Date", "Value"])

	if latest.empty:
		raise HTTPException(status_code=503, detail="Risk data has no usable rows.")

	latest = latest.sort_values("Date").groupby("Area", as_index=False).last()
	latest = latest[latest["Value"] > 0]

	def get_risk_level(value):
		if value > 300:
			return "CRITICAL"
		if value > 150:
			return "HIGH"
		if value > 110:
			return "MEDIUM"
		return "LOW"

	latest["risk_level"] = latest["Value"].apply(get_risk_level)

	result = latest[["Area", "Value", "risk_level"]].rename(
		columns={"Area": "country", "Value": "cpi_value"}
	).to_dict(orient="records")

	return {
		"status": "success",
		"total_countries": len(result),
		"risk_data": result,
	}
