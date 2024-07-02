# Pigeon
Final Project 2024- Amiram and Gal

website_keyword_extractor:
You need to run on your cmd the following lines:
pip install requests
pip install beautifulsoup4
pip install spacy
python -m spacy download en
pip install tfIdfInheritVectorizer
python -B -m uvicorn website_keyword_extractor:app --reload
and then open in browser the following link:
http://127.0.0.1:8000/keywords/?url=<The_URL>
