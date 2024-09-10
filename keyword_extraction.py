import urllib

import requests
from bs4 import BeautifulSoup
import spacy
from sklearn.feature_extraction.text import TfidfVectorizer
import numpy as np

# Load spaCy model
nlp = spacy.load("en_core_web_md")

# Define custom stop words including website-specific elements
stop_words = list(nlp.Defaults.stop_words | {"menu", "saved"})


# Function to fetch the HTML content of the webpage
def fetch_html(url):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
    }
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.text
    except requests.RequestException as e:
        print("Error fetching HTML:", e)
        return None


def fetch_html2(url):
    req = urllib.request.Request(url)
    req.add_headers('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:106.0) Gecko/20100101 Firefox/106.0')
    req.add_header('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8')
    req.add_header('Accept-Language', 'en-US,en;q=0.5')

    r = urllib.request.urlopen(req).read().decode('utf-8')
    with open("test.html", 'w', encoding="utf-8") as f:
        f.write(r)

# Function to filter keywords by length
def filter_keywords_by_length(keywords, min_length=2, max_length=10):
    return [keyword for keyword in keywords if min_length <= len(keyword) <= max_length]


# Function to extract keywords using TF-IDF
def extract_keywords_tfidf(text, num_keywords=5):
    tfidf_vectorizer = TfidfVectorizer(stop_words=stop_words)
    tfidf_matrix = tfidf_vectorizer.fit_transform([text])
    feature_names = np.array(tfidf_vectorizer.get_feature_names_out())
    tfidf_scores = np.array(tfidf_matrix.sum(axis=0)).flatten()

    top_indices = tfidf_scores.argsort()[-num_keywords:][::-1]
    keywords = feature_names[top_indices]
    return filter_keywords_by_length(keywords)


# Function to extract keywords using spaCy
def extract_keywords_spacy(text, num_keywords=5):
    doc = nlp(text)
    filtered_keywords = [token.text.lower() for token in doc if token.text.lower() not in stop_words
                         and token.pos_ in ["NOUN", "PROPN", "ADJ"]]

    word_freq = {}
    for word in filtered_keywords:
        word_freq[word] = word_freq.get(word, 0) + 1

    sorted_keywords = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
    keywords = [keyword[0] for keyword in sorted_keywords[:num_keywords]]
    return filter_keywords_by_length(keywords)


def get_keywords(url: str):
    html_content = fetch_html(url)
    if html_content:
        soup = BeautifulSoup(html_content, "html.parser")
        text = soup.get_text()

        keywords_spacy = extract_keywords_spacy(text, 10)
        keywords_tfidf = extract_keywords_tfidf(text, 10)

        # Combine results from both methods, ensuring no duplicates and applying length filter
        combined_keywords = list(set(keywords_spacy).union(set(keywords_tfidf)))

        return {"keywords": combined_keywords}
    else:
        return {"keywords": []}


