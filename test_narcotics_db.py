import sqlite3
import os
import sys

DB_PATH = "data/narcotics.db"
VALID_CATEGORIES = {
    "I nimekiri", "II nimekiri", "III nimekiri",
    "IV nimekiri", "V nimekiri", "VI nimekiri"
}

if not os.path.exists(DB_PATH):
    print(f"❌ Database file not found: {DB_PATH}")
    sys.exit(1)

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

cur.execute("SELECT category, COUNT(*) FROM narcotics GROUP BY category")
rows = cur.fetchall()

invalid_categories = [cat for cat, _ in rows if cat not in VALID_CATEGORIES]

print("\n🧪 Test Report for narcotics.db")
print("="*40)
print("✔ Categories found:")
for cat, count in rows:
    print(f"  {cat}: {count} entries")

if invalid_categories:
    print("\n❌ Invalid categories detected:")
    for cat in invalid_categories:
        print(f"  - {cat}")
    sys.exit(1)
else:
    print("\n✅ All categories are valid.")
