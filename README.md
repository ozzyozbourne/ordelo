Ordelo-F

A modern recipe management app built with React and Vite, featuring a seamless user experience and optimized API calls.

Features
- Recipe search and caching for offline use
- Saved recipes and shopping list functionality
- Optimized API calls with caching and request deduplication
- Responsive UI with a modern design



Clone the Repository

git clone <repo-url>
cd ordelo-f

npm install

npm run dev

This will start the app on `http://localhost:5173/` (or another available port).

Project Structure

## Project Structure

ordelo-f/ ├── public/ # Static assets (icons, images) ├── src/ # Application source code │ ├── components/ # Reusable UI components │ ├── pages/ # Individual app pages │ ├── services/ # API and caching logic │ ├── context/ # Global state management │ ├── utils/ # Helper functions │ ├── styles/ # Global styles │ ├── App.jsx # Main app entry point │ ├── main.jsx # Renders the app │ ├── index.css # Global styles ├── .gitignore # Ignored files for Git ├── package.json # Project dependencies and scripts ├── vite.config.js # Vite configuration └── README.md # Project documentation


Additional Setup
API Key
For your Spoonacular API, add your API key in `src/services/spoonacularApi.js`:

const SPOONACULAR_API_KEY = "your-api-key-here";


Formatting & Linting
To ensure consistent code formatting, run:

npm run lint


License
This project is licensed under the MIT License. See `LICENSE` for details.

Contributing
1. Fork the repository
2. Create a new branch (`git checkout -b feature-branch`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature-branch`)
5. Create a pull request



