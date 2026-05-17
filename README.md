# EstateMind AI

A modern full-stack AI/ML real estate website with account login, house price prediction, content-based recommendations, global property selling, saved listings, user history, analytics, MongoDB persistence, and a polished responsive UI.

## Tech Stack

- Frontend: React, Vite, Recharts, Lucide icons
- Backend: FastAPI, Motor, MongoDB
- ML: scikit-learn, pandas, joblib
- Models: Linear Regression and Random Forest

## Folder Structure

```text
.
|-- backend/
|   |-- app/
|   |   |-- api/
|   |   |-- core/
|   |   |-- data/
|   |   |-- ml/
|   |   `-- main.py
|   |-- data/
|   |   `-- housing.csv
|   |-- models/
|   |-- scripts/
|   |   |-- seed_db.py
|   |   `-- train_model.py
|   |-- .env.example
|   `-- requirements.txt
`-- frontend/
    |-- src/
    |   |-- components/
    |   |-- pages/
    |   |-- services/
    |   `-- App.jsx
    |-- .env.example
    `-- package.json
```

## Quick Start

### Backend

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

Set `AUTH_SECRET` in production to a long random value. Changing it will log out existing users.

### Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Open `http://localhost:5173`.

## Dataset

This project uses the provided India housing dataset at:

```text
backend/data/housing.csv
```

The training script supports:

- `City`
- `Locality`
- `Property_Type`
- `BHK`
- `Size_in_SqFt`
- `Price_in_Lakhs`
- `Furnished_Status`
- `Parking_Space`
- `Amenities`

Retrain the model after replacing the dataset:

```bash
cd backend
python scripts/train_model.py
```

The script trains Linear Regression and Random Forest, compares test scores, saves the best model, and writes training metrics.

## API Endpoints

- `GET /health` - backend status
- `POST /api/auth/register` - create a user account
- `POST /api/auth/login` - log in and receive a signed token
- `GET /api/auth/me` - get the current user
- `GET /api/properties` - property listings with search, filters, sorting, and per-user saved state
- `POST /api/properties` - post a property for sale; visible to all users
- `POST /api/properties/{id}/save` - save or unsave a property for the current user only
- `POST /api/predict` - predict house price and save prediction history to the current user
- `POST /api/recommendations` - content-based recommendations using cosine similarity
- `GET /api/dashboard` - saved properties, prediction history, recommendation history, and analytics for the current user

## Deployment

### Backend

Deploy the FastAPI service to Render, Railway, Fly.io, or Azure App Service.

1. Set root directory to `backend`.
2. Add environment variables from `backend/.env.example`.
3. Use build command: `pip install -r requirements.txt`.
4. Use start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
5. Use MongoDB Atlas for production persistence.

### Frontend

Deploy the frontend to Vercel, Netlify, or Render static sites.

1. Set root directory to `frontend`.
2. Add `VITE_API_URL=https://your-backend-url`.
3. Build command: `npm run build`.
4. Output directory: `dist`.

## Beginner Notes

- Login is required before using the website.
- Saved properties, prediction history, and recommendation history belong to the logged-in account.
- Properties posted for selling are stored globally, so every user can see them.
- The API falls back to dataset listings if MongoDB has not been seeded.
- The frontend has a local fallback mode for development, but real multi-user persistence needs the FastAPI backend plus MongoDB.
