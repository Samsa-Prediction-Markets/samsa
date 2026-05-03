import json
import requests

# Test prediction creation
url = "http://localhost:3001/api/predictions"
data = {
    "market_id": "drake_iceman_release",
    "outcome_id": "yes",
    "stake_amount": 10,
    "odds_at_prediction": 50,
    "user_id": "demo_user"
}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    if response.status_code != 201:
        print(f"\nFull response JSON: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
