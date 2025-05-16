from fastapi import FastAPI
from fastapi.responses import JSONResponse  # Add this import
import numpy as np
import matplotlib.pyplot as plt
from sklearn.preprocessing import MinMaxScaler
from fastapi.middleware.cors import CORSMiddleware
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense
from pydantic import BaseModel
import requests
from io import BytesIO
import base64

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Prompt(BaseModel):
    text: str

@app.get("/")
def read_root():
    return {"message": "Hello, World!"}

@app.get("/predict-prices")
def predict_potato_prices():
    # Step 1: Generate synthetic potato price data (90 days)
    np.random.seed(42)
    days = 90
    prices = 20 + np.sin(np.linspace(0, 12, days)) * 2 + np.random.normal(0, 0.5, days)
    prices = np.round(prices, 2)

    # Step 2: Normalize the data
    scaler = MinMaxScaler()
    prices_scaled = scaler.fit_transform(prices.reshape(-1, 1))

    # Step 3: Prepare sequences
    def create_sequences(data, past_steps=30, future_steps=7):
        X, y = [], []
        for i in range(len(data) - past_steps - future_steps + 1):
            X.append(data[i:i+past_steps])
            y.append(data[i+past_steps:i+past_steps+future_steps])
        return np.array(X), np.array(y)

    past_days = 30
    future_days = 7
    X, y = create_sequences(prices_scaled, past_days, future_days)

    X = X.reshape((X.shape[0], X.shape[1], 1))
    y = y.reshape((y.shape[0], y.shape[1]))

    # Step 4: Build LSTM model
    model = Sequential([
        LSTM(64, activation='relu', return_sequences=False, input_shape=(past_days, 1)),
        Dense(32, activation='relu'),
        Dense(future_days)
    ])
    model.compile(optimizer='adam', loss='mse')

    # Step 5: Train the model
    model.fit(X, y, epochs=100, batch_size=8, verbose=0)

    # Step 6: Predict the next 7 days using the last 30 days
    last_30_days = prices_scaled[-past_days:].reshape(1, past_days, 1)
    predicted_scaled = model.predict(last_30_days)
    predicted_prices = scaler.inverse_transform(predicted_scaled.reshape(-1, 1)).flatten()

    # Step 7: Plot actual vs predicted
    future_dates = np.arange(days, days + future_days)
    plt.figure(figsize=(12, 6))
    plt.plot(range(days), prices, label='Original Prices')
    plt.plot(future_dates, predicted_prices, label='Predicted Next 7 Days', linestyle='--', marker='o')
    plt.xlabel('Day')
    plt.ylabel('Potato Price (₹)')
    plt.title('LSTM Forecast of Potato Prices (Next 7 Days)')
    plt.legend()
    plt.grid(True)
    plt.tight_layout()

    # Step 8: Save plot to a BytesIO buffer and encode as base64
    buf = BytesIO()
    plt.savefig(buf, format='png')
    plt.close()
    buf.seek(0)
    img_base64 = base64.b64encode(buf.read()).decode('utf-8')

    # Step 9: Format price output
    price_data = {f"Day {days + i}": f"₹{p:.2f}" for i, p in enumerate(predicted_prices, start=1)}

    # Step 10: Return JSON with text + base64 image
    return JSONResponse(content={
        "predicted_prices": price_data,
        "plot_image_base64": img_base64
    })


@app.post("/groq-api")
def groq_api(prompt: Prompt):
    # Replace this with your actual Groq API key
    api_key = "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"

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    url = "https://api.groq.com/openai/v1/chat/completions"

    payload = {
        "model": "meta-llama/llama-4-maverick-17b-128e-instruct",  # or use 'llama3-70b-8192' or 'mixtral-8x7b-32768'
        "messages": [
            {"role": "user", "content": prompt.text}
        ],
        "temperature": 0.7
    }

    response = requests.post(url, headers=headers, json=payload)
    reply = response.json()

    # Return model response
    return {"response": reply["choices"][0]["message"]["content"]}

@app.get("/groq-tomato-analysis")
def groq_tomato_analysis():
    # Replace this with your actual Groq API key
    api_key = "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"

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    url = "https://api.groq.com/openai/v1/chat/completions"

    content = """You are an agriculture market analyst LLM.

    Below is the data for the last 30 days vegetable price (in ₹/kg) for **Tomato**, along with recent agricultural news and weather forecast.

    Analyze the data and provide:
    1. The most likely price prediction for the next 5 days.
    2. A detailed reasoning based on price trend, weather, and news.

    ---

    📈 PRICE TREND (Last 30 days):
    [22, 24, 25, 27, 28, 26, 25, 24, 26, 28, 30, 31, 32, 35, 34, 36, 38, 40, 42, 41, 39, 38, 37, 36, 35, 36, 38, 39, 40, 42]

    📰 AGRICULTURE NEWS:
    1. \"Heavy rainfall in Nashik and Pune disrupted harvesting schedules for tomatoes over the last week.\"
    2. \"Farmers' unions in Andhra Pradesh plan a 2-day protest over fertilizer pricing next week.\"
    3. \"Tomato production expected to be below average in Maharashtra due to pest attack in 2 districts.\"

    🌤️ WEATHER FORECAST (Next 5 days):
    - Day 1: Rainy in southern Tamil Nadu, cloudy in Maharashtra
    - Day 2: Light showers in Karnataka
    - Day 3: Dry conditions in Andhra Pradesh
    - Day 4: Cloudy across major tomato belts
    - Day 5: Sunny in northern India

    ---

    🎯 TASK:
    Analyze the above. Then predict:
    - Expected tomato price for next 5 days (₹/kg)
    - Justify your prediction using trend, weather, and news
    """

    payload = {
        "model": "meta-llama/llama-4-maverick-17b-128e-instruct",  # or use 'llama3-70b-8192' or 'mixtral-8x7b-32768'
        "messages": [
            {"role": "user", "content": content}
        ],
        "temperature": 0.7
    }

    response = requests.post(url, headers=headers, json=payload)
    reply = response.json()

    # Return model response
    return {"response": reply["choices"][0]["message"]["content"]}