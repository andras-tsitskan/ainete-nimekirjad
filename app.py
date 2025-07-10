import streamlit as st
import sqlite3
import pandas as pd

# Load data
conn = sqlite3.connect("data/narcotics.db")
df = pd.read_sql_query("SELECT * FROM narcotics", conn)

# Remove 'id' column and rename 'drug_name' to 'eestikeelne nimetus'
df = df.drop(columns=["id"], errors="ignore")
df = df.drop(columns=["collected_on"], errors="ignore")
# df = df.rename(columns={"category": "nimekiri"})
df = df.rename(columns={"drug_name": "eestikeelne nimetus"})
df = df.rename(columns={"english_name": "ingliskeelne nimetus"})

# Page layout
st.set_page_config(page_title="Narkootilised ja psühhotroopsed ained", layout="wide")
st.title("💊 Narkootiliste ja psühhotroopsete ainete ja ainerühmade nimekirjad")
st.caption("Allikas: https://www.riigiteataja.ee/akt/128122024049")

# Filters
cate = st.selectbox("Kategooria", ["Kõik"] + sorted(df['category'].unique()))
q = st.text_input("Otsi ainet või ainerühma")

filtered = df[
    (df['category'] == cate) | (cate == "Kõik")
]
# if q:
#     filtered = filtered[filtered['eestikeelne nimetus'].str.contains(q, case=False)]

st.markdown(f"**Results:** {len(filtered)} rows")
st.dataframe(filtered)
