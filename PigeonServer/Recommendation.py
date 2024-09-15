

import spacy
import en_core_web_sm
import en_core_web_md
import cohere

import baseDbConnector
from keyword_extraction import get_keywords_for_url as kw_from_url, summarize_website, get_website_summary, \
    extract_main_content_from_url
from sklearn.decomposition import LatentDirichletAllocation
from sklearn.feature_extraction.text import CountVectorizer

nlp = spacy.load('en_core_web_md')
en_core_web_sm.load()
co = cohere.Client("9uk1DJiq5xSikuIaSfyxLQE3V2Aajo7L2OGuvM3r")



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
    query = ("Please analyze the content of the website at the url. Generate a list of 10 highly relevant keywords "
             "that accurately reflect the website's main topics, WORLD OF CONTENT (example if there is a python page "
             "the world of content is software development, or airbnb is vecation), themes, time periods, locations,"
             "and overall subject"
             "matter. Ensure the following:"
             "Main Topics and Themes: Identify the primary subjects and recurring themes present on the website."
             "Time-Related Keywords: Include any specific timeframes, such as the current year (e.g., 2024), "
             "if relevant."
             "Location-Based Keywords: Accurately extract the geographical location from the URL parameters or the "
             "website content. For example, ensure \"Crete\" is identified instead of an unrelated location like "
             "\"London.\""
             "General Subject Matter: Capture the broad categories or fields the website pertains to (e.g., "
             "accommodation, travel, booking)."
             "Instructions:"
             "Limit to 10 Keywords: Ensure the total number of keywords does not exceed 10 to maintain conciseness. "
             "Make the output one line only, each keyword separated by comma"
             "Prioritize Accuracy in Location: Use the location specified in the URL parameters or prominently "
             "featured on the webpage. Do not assume default locations unless explicitly mentioned."
             "Optimize for Search Engine Visibility: Choose keywords that are commonly searched and relevant to the "
             "content for better SEO performance.")

    response = co.chat(model="command-nightly", message=url + "\n" + query)
    res = response.text.split(",")
    return res[:num]

    # return kw_from_url(url, num)



def gen_url_sum(url: str, num: int = 1):
    # return get_website_summary(url)
    query = ("Please summarize the content of the website at the URL. Provide a brief overview of the main topics, "
             "themes, and subject matter covered on the website. Ensure the summary is concise, informative, and "
             "accurately reflects the content of the webpage. Limit the summary to 2-3 sentences.")
    response = co.chat(model="command-nightly", message=url + "\n" + query)
    res = response.text
    return res

def get_most_similar_user_keywords2(
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


def get_most_similar_user_keywords(
        url: str,
        user_keywords: list[str],
        num: int = 5
):
    # make user_keywords a string that looks like /"phrase1/",/"phrase2/",/"phrase3"/...
    folders_names = "/".join(["\""+kw+"\"," for kw in user_keywords])
    # remove the last comma
    user_keywords = user_keywords[:-1]
    query = ("between the folder names that are marked with \"\" (example \"israel\") write in descending order how "
             "well and specifically it defines the given website. write this as single line s.t. the words are "
             "separated by commas")

    q = q = folders_names + "\n" + url + "\n" + query
    response = co.chat(model="command-nightly", message=q)
    res = response.text.split(",")
    # remove from res any \" that might have been added by the model
    res = [kw.replace("\"", "") for kw in res]
    return res[:num]
