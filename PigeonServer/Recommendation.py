

import spacy
import en_core_web_sm
import en_core_web_md

import baseDbConnector
from keyword_extraction import get_keywords_for_url as kw_from_url, summarize_website, get_website_summary, \
    extract_main_content_from_url
from sklearn.decomposition import LatentDirichletAllocation
from sklearn.feature_extraction.text import CountVectorizer

nlp = spacy.load('en_core_web_md')
en_core_web_sm.load()


connector: baseDbConnector = None


def word_vec_similarity(vec1, vec2):
    doc1 = nlp(' '.join(vec1))
    doc2 = nlp(' '.join(vec2))
    return doc1.similarity(doc2)


def get_recommendations(similarities, res, num):
    recommendations = []
    urls = set()
    sorted_indices = sorted(range(len(similarities)), key=lambda i: similarities[i], reverse=True)

    for i in sorted_indices:
        if len(urls) >= num:
            break
        url = res[i]['url']
        if url not in urls:
            recommendations.append(res[i])
            urls.add(url)
            print(similarities[i], ": ", res[i])

    return recommendations


def get_recommendations_by_keywords(keywords: list, num: int = 5):
    res = connector.get_all_tags()
    if not res:
        return "No tags found."

    tag_vecs = [tag["keywords"] for tag in res]
    similarities = [word_vec_similarity(keywords, tag) for tag in tag_vecs]

    return get_recommendations(similarities, res, num)


def get_recommendations_by_uid_url(uid: str, url: str, num: int = 5):
    kw = connector.get_tags_by_uid_url(uid, url)
    if kw == 'Tag not found.':
        return "No tags found."

    res = get_recommendations_by_keywords(kw["keywords"], num + 1)[1:]
    return res


def get_recommendations_by_url(url: str, num: int = 5):
    kw = kw_from_url(url)  # ["keywords"]
    if not kw:
        return False
    res = get_recommendations_by_keywords(kw["keywords"], num)
    return res


def generate_keywords_for_url(url: str, num: int = 5):
    return kw_from_url(url, num)


def gen_url_sum(url: str, num: int = 1):
    return get_website_summary(url)


def extract_topics(url, n_topics=2, n_top_words=10, random_state=0):
    """
    Extract topics from a web page's main content using LDA.

    Parameters:
    - url: URL of the web page to extract text from.
    - n_topics: number of topics to extract (default is 2).
    - n_top_words: number of top words to display for each topic (default is 10).
    - random_state: random state for reproducibility (default is 0).

    Returns:
    - topics: A list of topics with their top words.
    """

    # Assuming this function extracts and returns the main text from the URL
    txt = gen_url_sum(url, num=1)

    # Vectorize the input text (convert text to token counts)
    # Wrap the extracted text in a list to make it iterable
    vectorizer = CountVectorizer(stop_words='english')
    X = vectorizer.fit_transform([txt])

    # Fit LDA model to the vectorized text
    lda = LatentDirichletAllocation(n_components=n_topics, random_state=random_state)
    lda.fit(X)

    # Get feature names (words)
    feature_names = vectorizer.get_feature_names_out()

    # Extract and display the topics
    topics = []
    for index, topic in enumerate(lda.components_):
        top_words = [feature_names[i] for i in topic.argsort()[:-n_top_words - 1:-1]]
        topics.append(f"Topic #{index + 1}: {', '.join(top_words)}")

    return topics
