document.addEventListener('DOMContentLoaded', async function() {
    // Get URL parameters
    const params = new URLSearchParams(window.location.search);
    const tileUrl = params.get('url'); // The URL of the original content

    const cancelBtn = document.getElementById('btn_back');
    cancelBtn.addEventListener('click', function() {
        // return to previous page
        window.location.href = 'main_page.html';  // Redirect to main page
    });

    // Check if URL is provided
    if (!tileUrl) {
        alert('No URL provided!');
        return;
    }

    // Get the access token from local storage
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
        alert('Access token not found. Please log in.');
        return;
    }

    // Fetch recommendations from the server using the /recommend_by_url endpoint
    try {
        const response = await fetch('http://127.0.0.1:8000/recommend_by_url', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                'url': tileUrl,
                'num': '5'
            })
        });

        if (!response.ok) {
            throw new Error('Failed to fetch recommendations');
        }

        const recommendations = await response.json();

        console.log('Recommendations:', recommendations);

        // Create the "title tile" for the original URL
        const titleTileContainer = document.getElementById('title-tile-container');
        const originalTile = recommendations.find(r => r.url === tileUrl); // Find the original URL data

        if (originalTile) {
            console.log('Original tile found:', originalTile);

            const titleTile = document.createElement('div');
            titleTile.classList.add('container', 'title-tile'); // Add special class for title tile

            titleTile.innerHTML = `
                <div class="image-container">
                    <img src="data:image/png;base64,${originalTile.picture}" alt="Tile Image">
                </div>
                <div class="content">
                    <h2>${originalTile.title || 'No title available'}</h2>
                    <p>${originalTile.description || 'No description available'}</p>
                    <a href="${originalTile.url}" target="_blank">Visit Original Website</a>
                </div>
            `;

            titleTileContainer.appendChild(titleTile);
        } else {
            console.error('Original tile not found!');
        }

        // Filter out the original URL recommendation from the rest
        const otherRecommendations = recommendations.filter(r => r.url !== tileUrl);

        // Populate the rest of the page with the remaining recommendations
        const container = document.getElementById('recommendation-container');
        otherRecommendations.forEach(recommendation => {
            const tile = document.createElement('div');
            tile.classList.add('container');

            tile.innerHTML = `
                <div class="image-container">
                    <img src="data:image/png;base64,${recommendation.picture}" alt="Tile Image">
                </div>
                <div class="content">
                    <h2>${recommendation.title || 'No title available'}</h2>
                    <p>${recommendation.description || 'No description available'}</p>
                    <a href="${recommendation.url}" target="_blank">Visit Website</a>
                </div>
            `;

            container.appendChild(tile);
        });
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        alert('Failed to load recommendations.');
    }
});

// Back button functionality
function goBack() {
    window.history.back();
}

// Handle "Cancel" button click
cancelBtn.addEventListener('click', function() {
    // return to previous page
    window.location.href = 'main_page.html';  // Redirect to main page
});
