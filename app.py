import streamlit as st
import sqlite3
import pandas as pd

# Load data
conn = sqlite3.connect("data/narcotics.db")
df = pd.read_sql_query("SELECT * FROM narcotics", conn)

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
if q:
    filtered = filtered[filtered['drug_name'].str.contains(q, case=False)]

st.markdown(f"**Results:** {len(filtered)} rows")
st.dataframe(filtered)
