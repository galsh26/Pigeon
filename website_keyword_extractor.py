from newspaper import Article
import spacy


nlp = spacy.load("en_core_web_sm")

# Define custom stop words including website-specific elements
stop_words = nlp.Defaults.stop_words | {"menu", "saved"}

# Function to fetch the text content of the article from a given URL
def get_article_text(url):
    try:
        article = Article(url)
        article.download()
        article.parse()
        return article.text
    except Exception as e:
        print("Error fetching or parsing article:", e)
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
    #website_link = input("Enter the URL of the webpage: ")
    website_link = "https://www.delish.com/cooking/recipe-ideas/g129/rice-recipes/"
    webpage_content = get_article_text(website_link)

    if webpage_content:
        keywords = extract_keywords(webpage_content)
        print(f"Top {len(keywords)} keywords from the website:")
        for keyword in keywords:
            print(keyword)
    else:
        print("Failed to fetch or parse article content.")


if __name__ == "__main__":
    main()
