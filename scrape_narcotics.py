import requests
from bs4 import BeautifulSoup
from datetime import datetime
import sqlite3
import os
import re

# Constants
url = "https://www.riigiteataja.ee/akt/128122024049"
db_path = "data/narcotics.db"
os.makedirs("data", exist_ok=True)

# Valid categories
valid_lists = [
    "I nimekiri", "II nimekiri", "III nimekiri",
    "IV nimekiri", "V nimekiri", "VI nimekiri"
]

# Download page
response = requests.get(url)
soup = BeautifulSoup(response.text, "html.parser")

# DB setup
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

# Processing
elements = soup.find_all(['h2', 'h3', 'table'])
current_category = None
today = datetime.now().strftime("%Y-%m-%d")

for elem in elements:
    if elem.name in ['h2', 'h3']:
        heading = elem.get_text(strip=True)
        match = re.search(r'([IVX]+) nimekiri', heading)
        if match:
            current_category = match.group(0)  # e.g., 'I nimekiri'
        else:
            current_category = None
    elif elem.name == 'table' and current_category in valid_lists:
        rows = elem.find_all("tr")[1:]  # Skip table header
        for row in rows:
            cols = row.find_all("td")
            if cols:
                name = cols[0].get_text(strip=True)
                if name:
                    cur.execute("""
                        INSERT INTO narcotics (category, drug_name, collected_on)
                        VALUES (?, ?, ?)
                    """, (current_category, name, today))

conn.commit()
conn.close()
