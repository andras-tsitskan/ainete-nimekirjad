import streamlit as st
import sqlite3
import pandas as pd

# Load data
conn = sqlite3.connect("data/narcotics.db")
df = pd.read_sql_query("SELECT * FROM narcotics", conn)

# Page layout
st.set_page_config(page_title="Narkootilised ja psühhotroopsed ained", layout="wide")
st.title("💊 Narkootiliste ja psühhotroopsete ainete ja ainerühmade nimekirjad")
st.caption("Allikas: Narkootiliste ja psühhotroopsete ainete nimekirjad ning nende ainete meditsiinilisel ja teaduslikul eesmärgil käitlemine")

# Filters
cate = st.selectbox("Kategooria", ["All"] + sorted(df['category'].unique()))
q = st.text_input("Otsi ainet")

filtered = df[
    (df['category'] == cate) | (cate == "All")
]
if q:
    filtered = filtered[filtered['drug_name'].str.contains(q, case=False)]

st.markdown(f"**Results:** {len(filtered)} rows")
st.dataframe(filtered)

st.download_button("Download CSV", filtered.to_csv(index=False), "narcotics.csv", "text/csv")
