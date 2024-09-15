# Pigeon
Final Project 2024- Amiram and Gal

Server side: starting point at s_main.py
Client side: chrome://extensions -> Load unpacked -> v4 folder.

website_keyword_extractor:
You need to run on your cmd the following lines:
pip install requests
pip install beautifulsoup4
pip install spacy
python -m spacy download en
pip install tfIdfInheritVectorizer
uvicorn app:app --reload --port 8001
and then open in browser the following link:
http://127.0.0.1:8001/keywords/?url=<The_URL>

pip install jwt
pip install passlib
pip install pymongo
pip_install url_normalize
uvicorn s_main:app --reload --port 8000
