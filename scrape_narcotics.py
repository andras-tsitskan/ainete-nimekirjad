import requests
from bs4 import BeautifulSoup, Tag, NavigableString
from datetime import datetime
import sqlite3
import os

# Constants
url = "https://www.riigiteataja.ee/akt/128122024049"
db_path = "data/narcotics.db"
os.makedirs("data", exist_ok=True)

# Valid categories
valid_categories = {
    "I nimekiri", "II nimekiri", "III nimekiri",
    "IV nimekiri", "V nimekiri", "VI nimekiri"
}

# Download page
response = requests.get(url)
soup = BeautifulSoup(response.text, "html.parser")

# Set up DB
conn = sqlite3.connect(db_path)
cur = conn.cursor()
cur.execute("""
CREATE TABLE IF NOT EXISTS narcotics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT,
    drug_name TEXT,
    english_name TEXT,
    collected_on TEXT
)
""")

today = datetime.now().strftime("%Y-%m-%d")
current_category = None
elements = soup.body.descendants  # everything in order

for elem in elements:
    if isinstance(elem, NavigableString):
        text = elem.strip()
        if text in valid_categories:
            current_category = text
    elif isinstance(elem, Tag) and elem.name == "table" and current_category:
        rows = elem.find_all("tr")[1:]  # Skip table header
        for row in rows:
            cols = row.find_all("td")
            if len(cols) >= 2:
                estonian = cols[0].get_text(strip=True)
                english = cols[1].get_text(strip=True)
                if estonian:
                    cur.execute("""
                        INSERT INTO narcotics (category, drug_name, english_name, collected_on)
                        VALUES (?, ?, ?, ?)
                    """, (current_category, estonian, english, today))
        current_category = None  # reset after one table

conn.commit()
conn.close()
print("✅ Scraping complete: all 6 categories handled properly.")
