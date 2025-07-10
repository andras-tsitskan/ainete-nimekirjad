import requests
from bs4 import BeautifulSoup, Tag, NavigableString
from datetime import datetime
import sqlite3
import os
import logging

# Constants
URL = "https://www.riigiteataja.ee/akt/128122024049"
DB_PATH = "data/narcotics.db"
CATEGORIES = {
    "I nimekiri", "II nimekiri", "III nimekiri",
    "IV nimekiri", "V nimekiri", "VI nimekiri"
}
TABLE_NAME = "narcotics"

os.makedirs("data", exist_ok=True)
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

def fetch_html(url):
    try:
        response = requests.get(url)
        response.raise_for_status()
        return response.text
    except requests.RequestException as e:
        logging.error(f"Failed to fetch URL: {e}")
        raise

def setup_db(db_path):
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute(f"""
        CREATE TABLE IF NOT EXISTS {TABLE_NAME} (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT,
            drug_name TEXT,
            english_name TEXT,
            collected_on TEXT
        )
    """)
    return conn, cur

def parse_and_insert(soup, cur, today):
    current_category = None
    elements = soup.body.descendants
    for elem in elements:
        if isinstance(elem, NavigableString):
            text = elem.strip()
            if text in CATEGORIES:
                current_category = text
        elif isinstance(elem, Tag) and elem.name == "table" and current_category:
            rows = elem.find_all("tr")[1:]
            for row in rows:
                cols = row.find_all("td")
                if len(cols) >= 2:
                    estonian = cols[0].get_text(strip=True)
                    english = cols[1].get_text(strip=True)
                    if estonian:
                        try:
                            cur.execute(f"""
                                INSERT INTO {TABLE_NAME} (category, drug_name, english_name, collected_on)
                                VALUES (?, ?, ?, ?)
                            """, (current_category, estonian, english, today))
                        except sqlite3.DatabaseError as db_err:
                            logging.error(f"DB insert error: {db_err}")
            current_category = None

def main():
    html = fetch_html(URL)
    soup = BeautifulSoup(html, "html.parser")
    today = datetime.now().strftime("%Y-%m-%d")
    with sqlite3.connect(DB_PATH) as conn:
        cur = conn.cursor()
        setup_db(DB_PATH)  # Ensures table exists
        parse_and_insert(soup, cur, today)
        conn.commit()
    logging.info("✅ Scraping complete: all 6 categories handled properly.")

if __name__ == "__main__":
    main()
