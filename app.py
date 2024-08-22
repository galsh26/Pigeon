from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests
from bs4 import BeautifulSoup
import spacy
from sklearn.feature_extraction.text import TfidfVectorizer
import numpy as np
from nltk.tokenize import sent_tokenize
import nltk
from nltk.corpus import words
import re
from transformers import pipeline

# Initialize FastAPI app
app = FastAPI()

# Configure CORS to allow requests from the extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load spaCy model
nlp = spacy.load("en_core_web_md")

# Download NLTK word list
nltk.download("words")
valid_words = set(words.words())

# Function to check if a word is valid
def is_valid_word(word):
    return word.lower() in valid_words

# Define custom stop words including website-specific elements
stop_words = list(nlp.Defaults.stop_words | {"menu", "saved"})
	
# Initialize Hugging Face summarization pipeline
summarizer = pipeline("summarization")

# Function to fetch the HTML content of the webpage
def fetch_html(url):
    try:
        response = requests.get(url)
        response.raise_for_status()
        return response.text
    except requests.RequestException as e:
        print("Error fetching HTML:", e)
        return None

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
        if is_valid_word(word):
            word_freq[word] = word_freq.get(word, 0) + 1
    
    sorted_keywords = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
    keywords = [keyword[0] for keyword in sorted_keywords[:num_keywords]]
    return filter_keywords_by_length(keywords)

# Function to extract keywords from a webpage
def extract_keywords(url):
    html_content = fetch_html(url)
    if html_content:
        soup = BeautifulSoup(html_content, "html.parser")
        text = soup.get_text()
        
        keywords_spacy = extract_keywords_spacy(text)
        keywords_tfidf = extract_keywords_tfidf(text)
        
        # Combine results from both methods, ensuring no duplicates and applying length filter
        combined_keywords = list(set(keywords_spacy).union(set(keywords_tfidf)))
        
        return combined_keywords[:5]  # Limit to 5 keywords
    else:
        return []

# Function to fetch the content and return a summary
def get_website_summary(url):
    try:
        # Fetch the content of the website
        response = requests.get(url)
        response.raise_for_status()

        # Parse the HTML content using BeautifulSoup
        soup = BeautifulSoup(response.text, 'html.parser')

        # Extract text from paragraphs
        paragraphs = soup.find_all('p')
        text = ' '.join([para.get_text() for para in paragraphs])

        # Tokenize the text into sentences
        sentences = sent_tokenize(text)

        # Return the first few sentences as a summary
        summary = ' '.join(sentences[:3])  # Limit to 3 sentences
        if len(summary.strip()) == 0 or len(sentences) < 3:
            try:
                summary = summarizer(text, max_length=300, min_length=30, do_sample=False)[0]['summary_text']
            except Exception as e:
                summary = "No summary available. Error: " + str(e)
        return summary if summary else "No summary available."

    except Exception as e:
        return f"Error retrieving summary: {e}"

# Function to replace unknown characters
def replace_unknown_characters(text):
    # Replace all non-ASCII characters with a space
    return re.sub(r'[^\x00-\x7F]+', ' ', text)

@app.get("/keywords/")
async def get_keywords(url: str):
    # Fetch the keywords using the extractor, limiting to 5 keywords
    keywords = extract_keywords(url)
    limited_keywords = keywords[:5]  # Limit to 5 keywords
    return {"keywords": limited_keywords}

@app.get("/summary/")
async def get_summary(url: str):
    # Fetch the summary using the summary function, limiting to 3 sentences
    summary = get_website_summary(url)
    return {"summary": summary}
