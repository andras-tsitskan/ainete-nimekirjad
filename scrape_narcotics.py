import requests
from bs4 import BeautifulSoup
from datetime import datetime
import sqlite3
import os

# Setup
os.makedirs("data", exist_ok=True)
db_path = "data/narcotics.db"
url = "https://www.riigiteataja.ee/akt/128122024049"

# Scrape
res = requests.get(url)
soup = BeautifulSoup(res.text, "html.parser")

# DB
conn = sqlite3.connect(db_path)
cur = conn.cursor()
cur.execute("""
CREATE TABLE IF NOT EXISTS narcotics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT,
    drug_name TEXT,
    collected_on TEXT
)
""")

# Parse and insert
elements = soup.find_all(['h2', 'h3', 'table'])
current_category = None
today = datetime.now().strftime("%Y-%m-%d")

for elem in elements:
    if elem.name in ['h2', 'h3']:
        current_category = elem.get_text(strip=True)
    elif elem.name == 'table' and current_category:
        rows = elem.find_all("tr")[1:]
        for row in rows:
            cols = row.find_all("td")
            if cols:
                name = cols[0].get_text(strip=True)
                if name:
                    cur.execute(
                        "INSERT INTO narcotics (category, drug_name, collected_on) VALUES (?, ?, ?)",
                        (current_category, name, today)
                    )

conn.commit()
conn.close()
print("Fetched and saved narcotics list.")
