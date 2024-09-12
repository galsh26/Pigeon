window.addEventListener('message', function(event) {
    if (event.data === 'nextPage') {
        const iframe = document.getElementById('content-frame');
        if (iframe.src.endsWith('page1.html')) {
            iframe.src = 'page2.html';
        } else if (iframe.src.endsWith('page2.html')) {
            iframe.src = 'page3.html';
        }
    }
});

window.addEventListener('message', function(event) {
    if (event.data === 'loadMainPage') {
        const iframe = document.getElementById('content-frame');
        iframe.src = 'main_page.html'; // Load the main page in the iframe
    }
});
