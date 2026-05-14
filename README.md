# EstateMind AI

A modern full-stack AI/ML real estate website with house price prediction, property recommendations, saved listings, user history, analytics, MongoDB persistence, and a polished responsive UI.

## Tech Stack

- Frontend: React, Vite, Recharts, Lucide icons
- Backend: FastAPI, Motor, MongoDB
- ML: scikit-learn, pandas, joblib
- Models: Linear Regression and Random Forest

## Folder Structure

```text
.
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── data/
│   │   ├── ml/
│   │   └── main.py
│   ├── data/
│   │   └── housing_sample.csv
│   ├── models/
│   │   └── .gitkeep
│   ├── scripts/
│   │   ├── seed_db.py
│   │   └── train_model.py
│   ├── .env.example
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── services/
    │   └── App.jsx
    ├── .env.example
    └── package.json
```

## Quick Start

### 1. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python scripts/train_model.py
python scripts/seed_db.py
uvicorn app.main:app --reload --port 8000
```

MongoDB should be running locally at `mongodb://localhost:27017`. You can also use MongoDB Atlas by changing `MONGODB_URI` in `backend/.env`.

### 2. Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Open `http://localhost:5173`.

## Kaggle Dataset

This project now uses the provided India housing dataset. It has been copied to:

```text
backend/data/housing.csv
```

The training script supports this dataset’s columns:

- `City`
- `Locality`
- `Property_Type`
- `BHK`
- `Size_in_SqFt`
- `Price_in_Lakhs`
- `Furnished_Status`
- `Parking_Space`
- `Amenities`

Then retrain:

```bash
cd backend
python scripts/train_model.py
```

The script trains Linear Regression and Random Forest, compares test scores, saves the best model, and writes training metrics.

## API Endpoints

- `GET /health` - backend status
- `GET /api/properties` - property listing with search, filters, sorting
- `POST /api/properties/{id}/save` - save or unsave a property
- `POST /api/predict` - predict house price and confidence
- `POST /api/recommendations` - content-based recommendations using cosine similarity
- `GET /api/dashboard` - saved properties, prediction history, recommendation history, analytics

## Deployment

### Backend

Deploy the FastAPI service to Render, Railway, Fly.io, or Azure App Service.

1. Set root directory to `backend`.
2. Add environment variables from `backend/.env.example`.
3. Use build command: `pip install -r requirements.txt`
4. Use start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Use MongoDB Atlas for production persistence.

### Frontend

Deploy the frontend to Vercel, Netlify, or Render static sites.

1. Set root directory to `frontend`.
2. Add `VITE_API_URL=https://your-backend-url`.
3. Build command: `npm run build`
4. Output directory: `dist`

## Beginner Notes

- The sample dataset lets the project run immediately.
- The API falls back to curated demo properties if MongoDB has not been seeded.
- The ML script is intentionally readable and small, so you can replace the dataset and retrain without touching the API.
- For production auth, add real users and protect saved/history endpoints with JWT sessions.
