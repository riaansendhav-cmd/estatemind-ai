import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def recommend(properties: list[dict], preferences: dict, limit: int = 6) -> list[dict]:
    if not properties:
        return []

    def profile(item: dict) -> str:
        amenities = " ".join(item.get("amenities", []))
        return f"{item.get('location')} {item.get('bedrooms')}bhk {item.get('furnishing')} {amenities}"

    rows = pd.DataFrame(properties)
    rows["profile"] = rows.apply(lambda row: profile(row.to_dict()), axis=1)

    query = " ".join(
        [
            preferences.get("location", ""),
            f"{preferences.get('bedrooms', '')}bhk",
            " ".join(preferences.get("amenities", [])),
        ]
    )
    vectorizer = TfidfVectorizer(stop_words="english")
    matrix = vectorizer.fit_transform([query, *rows["profile"].tolist()])
    similarities = cosine_similarity(matrix[0:1], matrix[1:]).flatten()
    rows["similarity"] = similarities

    budget = preferences.get("budget")
    if budget:
        rows["budget_fit"] = rows["price"].apply(lambda price: 1 if price <= budget else max(0, 1 - ((price - budget) / budget)))
    else:
        rows["budget_fit"] = 1

    rows["score"] = (rows["similarity"] * 0.72) + (rows["budget_fit"] * 0.28)
    results = rows.sort_values("score", ascending=False).head(limit).to_dict("records")
    return [{**item, "match_score": round(float(item["score"]) * 100)} for item in results]
