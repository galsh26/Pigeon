

import spacy
import en_core_web_sm
import en_core_web_md

import baseDbConnector
from keyword_extraction import get_keywords as kw_from_url


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
    return get_recommendations_by_keywords(kw["keywords"], num)
