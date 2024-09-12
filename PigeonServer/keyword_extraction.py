import urllib

import requests
from bs4 import BeautifulSoup
import spacy
from nltk import sent_tokenize
from sklearn.feature_extraction.text import TfidfVectorizer
import numpy as np
from readability import Document
from transformers import pipeline
import tensorflow as tf
import os
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

# Assuming `labels` and `logits` are your target labels and model outputs respectively


# Load spaCy model
nlp = spacy.load("en_core_web_md")

# Define custom stop words including website-specific elements
stop_words = list(nlp.Defaults.stop_words | {"menu", "saved"})

summarizer = pipeline('summarization',  model='t5-base')

# Function to fetch the HTML content of the webpage
def fetch_html(url):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) "
                      "Chrome/114.0.0.0 Safari/537.36"
    }
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.text
    except requests.RequestException as e:
        print("Error fetching HTML:", e)
        return None


# New method that extracts the main content
def extract_main_content_from_url(url):
    html_content = fetch_html(url)
    if html_content:
        try:
            # Use readability-lxml to extract the main content
            doc = Document(html_content)
            main_content_html = doc.summary()

            # Optionally, clean up the extracted HTML with BeautifulSoup
            soup = BeautifulSoup(main_content_html, "lxml")

            # Return a prettified version of the main content
            return soup.prettify()

        except Exception as e:
            print("Error extracting main content:", e)
            return None
    else:
        print("No HTML content fetched from the URL")
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
    return keywords  # filter_keywords_by_length(keywords)


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


def get_keywords_for_url(url: str, num: int = 5):
    html_content = extract_main_content_from_url(url)
    if html_content:
        soup = BeautifulSoup(html_content, "html.parser")
        text = soup.get_text()

        keywords_spacy = extract_keywords_spacy(text, num)
        keywords_tfidf = extract_keywords_tfidf(text, num)

        # Combine results from both methods, ensuring no duplicates and applying length filter
        combined_keywords = list(set(keywords_spacy).union(set(keywords_tfidf)))

        return {"keywords": combined_keywords}
    else:
        return {"keywords": []}


def summarize_website(url: str = None, num: int = 5):
    if not url:
        return {"summary": ""}
    html_content = extract_main_content_from_url(url)
    if html_content:
        soup = BeautifulSoup(html_content, "html.parser")
        paragraphs = soup.find_all('p')
        text = ' '.join([para.get_text() for para in paragraphs])
        sentences = sent_tokenize(text)
        doc = nlp(text)

        # Summarize the text using spaCy
        # sentences = [sent.text for sent in doc.sents]
        summary = " ".join(sentences[:num])  # Combine the first three sentences as a summary

        if len(summary.strip()) == 0 or len(sentences) < 3:
            try:
                summary = summarizer(text, max_length=300, min_length=30, do_sample=False)[0]['summary_text']
            except Exception as e:
                summary = "No summary available. Error: " + str(e)

        return {"summary": summary}
    else:
        return {"summary": ""}


def get_website_summary(url, maxlen=100, minlen=30):
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
                summary = summarizer(text, max_length=maxlen, min_length=minlen, do_sample=False)[0]['summary_text']
            except Exception as e:
                summary = "No summary available. Error: " + str(e)
        return summary if summary else "No summary available."

    except Exception as e:
        return f"Error retrieving summary: {e}"
