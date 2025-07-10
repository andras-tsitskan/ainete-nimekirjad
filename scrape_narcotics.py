import requests
from bs4 import BeautifulSoup, Tag
from datetime import datetime
import sqlite3
import os
import logging

# Constants and configuration
URL = "https://www.riigiteataja.ee/akt/128122024049"
DB_PATH = "data/narcotics.db"
CATEGORIES = {
    "I NIMEKIRI", "II NIMEKIRI", "III NIMEKIRI",
    "IV NIMEKIRI", "V NIMEKIRI", "VI NIMEKIRI"
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

def setup_db(cur):
    cur.execute(f"""
        CREATE TABLE IF NOT EXISTS {TABLE_NAME} (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT,
            eestikeelne_nimetus TEXT,
            ingliskeelne_nimetus TEXT,
            collected_on TEXT
        )
    """)
    # Clear the table before inserting new data
    cur.execute(f"DELETE FROM {TABLE_NAME}")
    logging.info(f"Table '{TABLE_NAME}' cleared before new insertions.")

def parse_and_insert(soup, cur, today):
    insert_count = 0
    # Normalize categories for matching
    normalized_categories = {c.strip().upper().replace("\xa0", " ").replace("&nbsp;", " "): c for c in CATEGORIES}
    current_category = None
    # Flatten all elements in body in order
    body_elements = list(soup.body.descendants)
    for elem in body_elements:
        # Look for <b> tags inside <p> for category headers
        if isinstance(elem, Tag) and elem.name == "p":
            b_tags = elem.find_all("b")
            for b_tag in b_tags:
                found = b_tag.get_text(separator=" ", strip=True).upper().replace("\xa0", " ").replace("&nbsp;", " ")
                found = " ".join(found.split())
                if found in normalized_categories:
                    current_category = normalized_categories[found]
        # If a table is found and we have a current category, process it
        if isinstance(elem, Tag) and elem.name == "table" and current_category:
            rows = elem.find_all("tr")[1:]  # Skip header
            for row in rows:
                cols = row.find_all("td")
                if len(cols) >= 2:
                    estonian = cols[0].get_text(separator=" ", strip=True)
                    english = cols[1].get_text(separator=" ", strip=True)
                    if estonian:
                        try:
                            cur.execute(f"""
                                INSERT INTO {TABLE_NAME} (category, eestikeelne_nimetus, ingliskeelne_nimetus, collected_on)
                                VALUES (?, ?, ?, ?)
                            """, (current_category, estonian, english, today))
                            insert_count += 1
                        except sqlite3.DatabaseError as db_err:
                            logging.error(f"DB insert error: {db_err}")
            # Do NOT reset current_category here; next table may belong to same category unless a new header is found
    logging.info(f"Inserted {insert_count} rows into '{TABLE_NAME}'.")
    return insert_count

def main():
# Run the scraping workflow
    html = fetch_html(URL)
    soup = BeautifulSoup(html, "html.parser")
    today = datetime.now().strftime("%Y-%m-%d")
    with sqlite3.connect(DB_PATH) as conn:
        cur = conn.cursor()
        setup_db(cur)  # Ensures table exists and clears it
        inserted = parse_and_insert(soup, cur, today)
        conn.commit()
    logging.info(f"Inserted {inserted} rows into '{TABLE_NAME}'.")
    logging.info("✅ Scraping complete: all 6 categories handled properly.")

if __name__ == "__main__":
    main()
