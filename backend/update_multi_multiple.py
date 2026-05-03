import json
from datetime import datetime

# Read current markets
with open('data/markets.json', 'r') as f:
    markets = json.load(f)

# Update the features market (multi-multiple type)
for market in markets:
    if market['id'] == 'drake_iceman_features':
        # Convert from sub-outcomes structure to regular outcomes
        # Each artist is independent and can be featured (multiple can happen)
        market['outcomes'] = [
            {"id": "kendrick", "title": "Kendrick Lamar", "probability": 25.0, "total_stake": 0},
            {"id": "travis", "title": "Travis Scott", "probability": 25.0, "total_stake": 0},
            {"id": "21savage", "title": "21 Savage", "probability": 25.0, "total_stake": 0},
            {"id": "future", "title": "Future", "probability": 25.0, "total_stake": 0}
        ]
        
        # Update price history to match new structure
        market['price_history'] = [
            {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "prices": {
                    "kendrick": 25.0,
                    "travis": 25.0,
                    "21savage": 25.0,
                    "future": 25.0
                }
            }
        ]

# Write back to markets.json
with open('data/markets.json', 'w') as f:
    json.dump(markets, f, indent=2)

print("Successfully updated multi-multiple market:")
print("- Removed yes/no sub-outcomes")
print("- Each artist is now an independent outcome at 25%")
print("- Multiple artists can be featured (independent events)")
