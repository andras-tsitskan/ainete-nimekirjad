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
tables = soup.find_all("table")

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

for table in tables:
    # Look for heading in previous siblings (e.g. <p>, <b>, etc.)
    heading = None
    prev = table.find_previous_sibling()
    while prev:
        text = prev.get_text(strip=True).upper()
        if re.match(r"^(I|II|III|IV|V|VI)\s*NIMEKIRI$", text):
            heading = text.capitalize()  # Normalize
            break
        prev = prev.find_previous_sibling()

    # Skip if not a valid list category
    if heading not in valid_categories:
        continue

    rows = table.find_all("tr")[1:]  # Skip header
    for row in rows:
        cols = row.find_all("td")
        if cols:
            estonian_name = cols[0].get_text(strip=True)
            if estonian_name:
                cur.execute("""
                    INSERT INTO narcotics (category, drug_name, collected_on)
                    VALUES (?, ?, ?)
                """, (heading.capitalize(), estonian_name, today))

conn.commit()
conn.close()
print("✅ Scrape complete with valid categories only.")
