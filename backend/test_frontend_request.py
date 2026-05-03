import requests
import json

# Simulate what the frontend is sending
url = "http://localhost:5173/api/predictions"
data = {
    "market_id": "drake_iceman_release",
    "outcome_id": "yes",
    "stake_amount": 10.0,
    "odds_at_prediction": 50.0,
    "user_id": "demo_user"
}

print("Testing frontend request through Vite proxy...")
print(f"URL: {url}")
print(f"Data: {json.dumps(data, indent=2)}")

try:
    response = requests.post(url, json=data)
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response: {response.text}")
    if response.status_code != 201:
        print(f"\nError response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
