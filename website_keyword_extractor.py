import requests
from bs4 import BeautifulSoup
import spacy

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


def main():
    # website_link = input("Enter the URL of the webpage: ")
    website_link = "https://www.delish.com/cooking/recipe-ideas/g129/rice-recipes/"
    html_content = fetch_html(website_link)

    if html_content:
        # Parse HTML using BeautifulSoup
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Extract page title
        page_title = soup.title.string if soup.title else ""
        
        # Extract meta description
        meta_tags = soup.find_all("meta", attrs={"name": "description"})
        meta_description = meta_tags[0]['content'] if meta_tags else ""
        
        # Combine title and meta description for keyword extraction
        text_to_analyze = page_title + " " + meta_description
        
        # Extract keywords
        keywords = extract_keywords(text_to_analyze)
        print(f"Top {len(keywords)} keywords from the website:")
        for keyword in keywords:
            print(keyword)
    else:
        print("Failed to fetch HTML content.")

if __name__ == "__main__":
    main()
