

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


def get_most_similar_user_keywords(
        url_keywords: list[str],
        user_keywords: list[str],
        num: int = 5, threshold: float = 0.30
):
    # Check if user_keywords is a list
    if not isinstance(user_keywords, list):
        return "Error: user_keywords must be a list."

    # Calculate the similarity between the extracted keywords and each of the user's keywords
    similarities = [(user_kw, word_vec_similarity(url_keywords, user_kw)) for user_kw in user_keywords]

    # Filter out the keywords that have a similarity score below the threshold
    similarities = [(user_kw, sim) for user_kw, sim in similarities if sim >= threshold]

    # Sort the remaining keywords by their similarity score in descending order
    similarities.sort(key=lambda x: x[1], reverse=True)

    # Return the top 'num' keywords
    return [user_kw for user_kw, sim in similarities[:num]]