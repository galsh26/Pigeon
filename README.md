
# README.md

## Project Overview

This project is a **FastAPI**-based web service designed to manage user authentication, URL tagging, and keyword-based content recommendations. It supports CRUD operations for users and tags, alongside providing keyword-based content recommendations by leveraging natural language processing (NLP) techniques and an external database (MongoDB). The system integrates keyword extraction, URL normalization, and recommendation generation for personalized user experiences.

---

## Table of Contents

1. [Features](#features)
2. [Setup and Installation](#setup-and-installation)
3. [API Endpoints](#api-endpoints)
   - [User Authentication](#user-authentication)
   - [Tag Management](#tag-management)
   - [Recommendation System](#recommendation-system)
4. [Database Setup](#database-setup)
5. [License](#license)

---

## Features

- **User Authentication:**
  - Secure user registration, login, and logout using JWT tokens.
  - Password hashing using bcrypt.
  
- **Tagging System:**
  - Create, update, retrieve, and delete tags based on URLs.
  - Store associated keywords, descriptions, and images.
  
- **Keyword Extraction:**
  - Extract keywords from web pages using NLP (spaCy, TF-IDF).
  
- **Recommendation System:**
  - Generate content recommendations based on user-specific tags or URLs.
  - Recommendation engine uses NLP-based keyword similarity.

---

## Setup and Installation

### Prerequisites

- Python 3.8+
- MongoDB
- FastAPI
- Uvicorn
- spaCy
- Dependencies mentioned in `requirements.txt`

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-repo/project.git
   cd project
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up MongoDB:**
   - Ensure MongoDB is running locally or accessible via a connection string.

4. **Run the FastAPI server:**
   ```bash
   uvicorn s_main:app --reload
   ```

5. **Access the API:**
   - Open your browser and navigate to `http://127.0.0.1:8000/docs` for the automatically generated Swagger documentation.

---

## API Endpoints

### User Authentication

- **POST /register:**  
  Registers a new user.
  - Parameters: `email`, `username`, `password`

- **POST /token:**  
  Logs in a user and returns a JWT token.
  - Parameters: `username`, `password`

- **GET /users/me:**  
  Retrieves the current logged-in user based on the JWT token.

- **POST /logout:**  
  Logs out the current user by blacklisting the JWT token.

### Tag Management

- **POST /tag:**  
  Creates a new tag for a URL.
  - Parameters: `url`, `title`, `keywords`, `description`, `picture`

- **PUT /tag:**  
  Updates an existing tag.
  - Parameters: `url`, `title`, `keywords`, `description`, `picture`

- **GET /tag:**  
  Retrieves a tag by URL for the current user.

- **DELETE /tag:**  
  Deletes a tag by URL for the current user.

### Recommendation System

- **POST /recommend_by_kw:**  
  Get recommendations based on user-provided keywords.
  - Parameters: `keywords`, `num` (default: 5)

- **POST /recommend_by_url:**  
  Get recommendations based on a specific URL.
  - Parameters: `url`, `num` (default: 5)

---

## Database Setup

The project uses **MongoDB** as the database. The MongoDB connector (`mongoDbConnector.py`) handles all database operations, including:

- User management (`users` collection)
- Tagging system (`taggings` collection)

Ensure MongoDB is properly set up and running. You can modify the connection details in `mongoDbConnector.py`.

---

## License

This project is licensed under the MIT License. Feel free to use, modify, and distribute the code.
