import requests
from bs4 import BeautifulSoup
from datetime import datetime
import sqlite3
import os
import re

# Setup
url = "https://www.riigiteataja.ee/akt/128122024049"
os.makedirs("data", exist_ok=True)
db_path = "data/narcotics.db"

valid_categories = {
    "I NIMEKIRI", "II NIMEKIRI", "III NIMEKIRI",
    "IV NIMEKIRI", "V NIMEKIRI", "VI NIMEKIRI"
}

# Download and parse
res = requests.get(url)
soup = BeautifulSoup(res.text, "html.parser")
elements = soup.find_all(['p', 'table'])

# Prepare DB
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

today = datetime.now().strftime("%Y-%m-%d")
current_category = None

for i, elem in enumerate(elements):
    if elem.name == "p":
        b = elem.find("b")
        if b:
            cat_text = b.get_text(strip=True).upper()
            if cat_text in valid_categories:
                current_category = cat_text.capitalize()  # normalize: "I nimekiri"
    elif elem.name == "table" and current_category:
        rows = elem.find_all("tr")[1:]  # skip header
        for row in rows:
            cols = row.find_all("td")
            if cols:
                estonian_name = cols[0].get_text(strip=True)
                if estonian_name:
                    cur.execute("""
                        INSERT INTO narcotics (category, drug_name, collected_on)
                        VALUES (?, ?, ?)
                    """, (current_category, estonian_name, today))

conn.commit()
conn.close()
print("✅ Scrape complete and database updated.")
