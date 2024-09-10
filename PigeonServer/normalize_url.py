import tldextract
from urllib.parse import urlparse, urlunparse
from url_normalize import url_normalize as my_url_normalize
import re


import re


def url_normalize(url):
    # Check if the URL starts with 'http://'
    if url.startswith('http://'):
        # Remove 'http://'
        url = url[7:]
        # Ensure the URL starts with 'www.'
        if not url.startswith('www.'):
            url = 'www.' + url
        # Add 'http://' back to the beginning
        url = 'http://' + url
    else:
        # Remove any existing 'https://'
        url = re.sub(r'^https://', '', url)
        # Ensure the URL starts with 'www.'
        if not url.startswith('www.'):
            url = 'www.' + url
        # Add 'https://' to the beginning
        url = 'https://' + url

    return my_url_normalize(url)



'''
    # Parse the URL into components
    parsed_url = urlparse(url)

    # Extract the domain parts
    ext = tldextract.extract(url)
    ext.subdomain = 'www' if ext.subdomain == 'www' else None

    # Normalize the domain by removing 'www' if present
    domain = ext.registered_domain

    # Construct the normalized URL
    normalized_url = urlunparse((
        parsed_url.scheme or 'http',
        domain,
        parsed_url.path.rstrip('/'),
        '', '', ''
    ))

    return normalized_url
'''