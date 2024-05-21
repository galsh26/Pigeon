from fastapi import FastAPI
import requests
from bs4 import BeautifulSoup
import spacy

# Load spaCy model
nlp = spacy.load("en_core_web_sm")
# Define custom stop words including website-specific elements
stop_words = nlp.Defaults.stop_words | {"menu", "saved"}

# Function to fetch the HTML content of the webpage
def fetch_html(url):
    try:
        response = requests.get(url)
        response.raise_for_status()
        return response.text
    except requests.RequestException as e:
        print("Error fetching HTML:", e)
        return None

# Function to extract keywords from the provided text
def extract_keywords(text, num_keywords=5):
    doc = nlp(text)

    # Filter for relevant words based on POS and stop words
    filtered_keywords = [token.text.lower() for token in doc if token.text.lower() not in stop_words 
                         and token.pos_ in ["NOUN", "PROPN", "ADJ"]]
    
    word_freq = {}
    # Count frequency of each word
    for word in filtered_keywords:
        word_freq[word] = word_freq.get(word, 0) + 1
    
    # Sort keywords by frequency
    sorted_keywords = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
    
    return [keyword[0] for keyword in sorted_keywords[:num_keywords]]

app = FastAPI()

@app.get("/keywords/")
async def get_keywords(url: str):
    html_content = fetch_html(url)
    if html_content:
        soup = BeautifulSoup(html_content, "html.parser")
        # Extract text content from HTML
        text = soup.get_text()
        # Extract keywords using spaCy
        keywords = extract_keywords(text)
        return {"keywords": keywords}
    else:
        return {"keywords": []}
