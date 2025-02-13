import * as React from "react";
import { createRoot } from "react-dom/client";
import {
  SparkApp,
  Button,
  Textarea,
  PageContainer,
  Select,
  Input,
} from "@github/spark/components";
import { Star, Trash, ThumbsUp, ThumbsDown } from "@phosphor-icons/react";
import { useKV } from "@github/spark/hooks";

// Main App component
function App() {
  // State to manage the current view: 'login', 'register', 'main'
  const [view, setView] = React.useState('login');
  const [currentUser, setCurrentUser] = React.useState(null);

  // Render different components based on the current view
  return (
    <SparkApp>
      <PageContainer>
        {view === 'login' && (
          <Login
            onLogin={(username) => {
              setCurrentUser(username);
              setView('main');
            }}
            onRegister={() => setView('register')}
          />
        )}
        {view === 'register' && (
          <Register
            onRegister={(username) => {
              setCurrentUser(username);
              setView('main');
            }}
            onCancel={() => setView('login')}
          />
        )}
        {view === 'main' && currentUser && (
          <MainApp
            username={currentUser}
            onLogout={() => {
              setCurrentUser(null);
              setView('login');
            }}
          />
        )}
      </PageContainer>
    </SparkApp>
  );
}

// Login component
function Login({ onLogin, onRegister }) {
  // State to manage username and password input
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');

  // Handle user login
  async function handleLogin() {
    // Retrieve users from KV storage
    const storedUsers = await spark.kv.get('users');
    const users = storedUsers ? JSON.parse(storedUsers) : {};

    // Check if username exists and password matches
    if (users[username] && users[username].password === password) {
      onLogin(username);
    } else {
      setError('Invalid username or password');
    }
  }

  // Allow pressing Enter to invoke the login
  function handleKeyPress(e) {
    if (e.key === 'Enter') {
      handleLogin();
    }
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      {error && <p className="text-red-500">{error}</p>}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Username</label>
        <Input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full"
          id="username"
          onKeyPress={handleKeyPress}
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Password</label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full"
          id="password"
          onKeyPress={handleKeyPress}
        />
      </div>
      <div className="flex space-x-2">
        <Button
          onClick={handleLogin}
          variant="primary"
          className="transition transform hover:scale-105 active:scale-95"
          aria-label="Login Button with Animation"
        >
          Login
        </Button>
        <Button
          onClick={onRegister}
          variant="secondary"
          className="transition transform hover:scale-105 active:scale-95"
          aria-label="Register New User Button with Animation"
        >
          Register New User
        </Button>
      </div>
    </div>
  );
}

// Register component
function Register({ onRegister, onCancel }) {
  // State to manage registration inputs
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [error, setError] = React.useState('');

  // Handle user registration
  async function handleRegister() {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Retrieve users from KV storage
    const storedUsers = await spark.kv.get('users');
    const users = storedUsers ? JSON.parse(storedUsers) : {};

    // Check if username is already taken
    if (users[username]) {
      setError('Username already taken');
      return;
    }

    // Create new user
    users[username] = {
      password: password,
      preferences: {},
    };

    // Save users back to KV storage
    await spark.kv.set('users', JSON.stringify(users));

    onRegister(username);
  }

  // Allow pressing Enter to invoke the register
  function handleKeyPress(e) {
    if (e.key === 'Enter') {
      handleRegister();
    }
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-4">Register</h1>
      {error && <p className="text-red-500">{error}</p>}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Username</label>
        <Input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full"
          id="register-username"
          onKeyPress={handleKeyPress}
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Password</label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full"
          id="register-password"
          onKeyPress={handleKeyPress}
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Confirm Password
        </label>
        <Input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full"
          id="confirm-password"
          onKeyPress={handleKeyPress}
        />
      </div>
      <div className="flex space-x-2">
        <Button
          onClick={handleRegister}
          variant="primary"
          className="transition transform hover:scale-105 active:scale-95"
          aria-label="Register Button with Animation"
        >
          Register
        </Button>
        <Button
          onClick={onCancel}
          variant="secondary"
          className="transition transform hover:scale-105 active:scale-95"
          aria-label="Back to Login Button with Animation"
        >
          Back to Login
        </Button>
      </div>
    </div>
  );
}

// Main application component
function MainApp({ username, onLogout }) {
  // State to manage user-specific data
  const [scents, setScents] = React.useState('');
  const [suggestions, setSuggestions] = React.useState([]);
  const [favorites, setFavorites] = React.useState([]);
  const [likedFragrances, setLikedFragrances] = React.useState([]);
  const [dislikedFragrances, setDislikedFragrances] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [sortOption, setSortOption] = React.useState('similarity');
  const [sortOrder, setSortOrder] = React.useState('desc');
  const [generatingScents, setGeneratingScents] = React.useState(false);
  const [recommendationsRequested, setRecommendationsRequested] =
    React.useState(false);
  const [minSimilarity, setMinSimilarity] = React.useState(0.5);
  const [showFavorites, setShowFavorites] = React.useState(false);
  // State to manage animating favorites
  const [animatingFavorites, setAnimatingFavorites] = React.useState([]);

  // Load user preferences on component mount
  React.useEffect(() => {
    async function loadUserData() {
      const storedUsers = await spark.kv.get('users');
      const users = storedUsers ? JSON.parse(storedUsers) : {};
      if (users[username] && users[username].preferences) {
        const {
          scents,
          suggestions,
          favorites,
          likedFragrances,
          dislikedFragrances,
        } = users[username].preferences;
        setScents(scents || '');
        setSuggestions(suggestions || []);
        setFavorites(favorites || []);
        setLikedFragrances(likedFragrances || []);
        setDislikedFragrances(dislikedFragrances || []);
      }
    }
    loadUserData();
  }, [username]);

  // Save user preferences to KV storage
  async function saveUserData(newData) {
    const storedUsers = await spark.kv.get('users');
    const users = storedUsers ? JSON.parse(storedUsers) : {};
    users[username].preferences = {
      scents,
      suggestions,
      favorites,
      likedFragrances,
      dislikedFragrances,
      ...newData,
    };
    await spark.kv.set('users', JSON.stringify(users));
  }

  // Handle "Get Recommendations" button click
  async function handleSubmit() {
    if (!scents.trim()) {
      return;
    }
    setLoading(true);
    // Prepare liked and disliked fragrances for the prompt
    const likedNames = likedFragrances.map((item) => item.name).join(', ');
    const dislikedNames = dislikedFragrances.map((item) => item.name).join(', ');
    // Prompt the LLM to generate perfume recommendations
    const prompt = spark.llmPrompt`Given the list of scents: ${scents}, and considering that the user liked the following fragrances: ${likedNames}, and disliked the following fragrances: ${dislikedNames}, recommend a list of perfumes or fragrances that match the user's preferences. Include perfumes with a similarity score of 0.5 or higher. For each perfume, include the perfume name, manufacturer, price in USD, a similarity score between 0 and 1 indicating how closely the perfume matches the user's preferences (1 is an exact match), and a short description (2-3 sentences) about the fragrance. Provide the output in JSON format as an array of objects with keys "name", "manufacturer", "price", "similarity", and "description". Do not include any additional text besides the JSON output.`;
    try {
      const response = await spark.llm(prompt);
      const data = JSON.parse(response);
      const filteredData = data.filter(
        (item) => parseFloat(item.similarity) >= 0.5
      );
      setSuggestions(filteredData);
      setRecommendationsRequested(true);
      await saveUserData({ suggestions: filteredData });
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  }

  // Handle "Generate More Scents" button click
  async function handleGenerateScents() {
    setGeneratingScents(true);
    // Prompt the LLM to generate additional scents similar to the ones provided
    const prompt = spark.llmPrompt`Given the list of scents: ${scents}, generate a list of additional scent notes that are similar to the ones provided. Provide the output as a comma-separated list of scents. Do not include any additional text besides the list of scents.`;
    try {
      const response = await spark.llm(prompt);
      const newScents = response.split(",").map((scent) => scent.trim());
      const existingScents = scents.split(",").map((scent) => scent.trim());
      const combinedScents = Array.from(new Set([...existingScents, ...newScents]));
      const updatedScents = combinedScents.join(", ");
      setScents(updatedScents);
      await saveUserData({ scents: updatedScents });
    } catch (error) {
      console.error(error);
    }
    setGeneratingScents(false);
  }

  // Handle adding or removing favorites
  const toggleFavorite = async (item) => {
    const isFavorite = favorites.some((fav) => fav.name === item.name);
    let updatedFavorites;
    if (isFavorite) {
      // Remove from favorites
      updatedFavorites = favorites.filter((fav) => fav.name !== item.name);
    } else {
      // Add to favorites
      updatedFavorites = [...favorites, item];
      // Add item to animatingFavorites
      setAnimatingFavorites((prev) => [...prev, item.name]);
      // Remove the item from animatingFavorites after animation completes
      setTimeout(() => {
        setAnimatingFavorites((prev) => prev.filter((name) => name !== item.name));
      }, 500); // Adjust timeout to match animation duration
    }
    setFavorites(updatedFavorites);
    await saveUserData({ favorites: updatedFavorites });
  };

  // Handle thumbs up (like) action
  const handleLike = async (item) => {
    // Remove from dislikedFragrances if present
    const updatedDisliked = dislikedFragrances.filter(
      (fragrance) => fragrance.name !== item.name
    );
    setDislikedFragrances(updatedDisliked);

    // Add to likedFragrances if not already present
    if (!likedFragrances.some((fragrance) => fragrance.name === item.name)) {
      const updatedLiked = [...likedFragrances, item];
      setLikedFragrances(updatedLiked);
    }

    await saveUserData({
      likedFragrances,
      dislikedFragrances,
    });
  };

  // Handle thumbs down (dislike) action
  const handleDislike = async (item) => {
    // Remove from likedFragrances if present
    const updatedLiked = likedFragrances.filter(
      (fragrance) => fragrance.name !== item.name
    );
    setLikedFragrances(updatedLiked);

    // Add to dislikedFragrances if not already present
    if (!dislikedFragrances.some((fragrance) => fragrance.name === item.name)) {
      const updatedDisliked = [...dislikedFragrances, item];
      setDislikedFragrances(updatedDisliked);
    }

    await saveUserData({
      likedFragrances,
      dislikedFragrances,
    });
  };

  // Handle removing a favorite from the favorites panel
  const removeFavorite = async (item) => {
    const updatedFavorites = favorites.filter((fav) => fav.name !== item.name);
    setFavorites(updatedFavorites);
    await saveUserData({ favorites: updatedFavorites });
  };

  // Handle clearing the session
  async function handleClearSession() {
    setScents('');
    setSuggestions([]);
    setFavorites([]);
    setLikedFragrances([]);
    setDislikedFragrances([]);
    await saveUserData({
      scents: '',
      suggestions: [],
      favorites: [],
      likedFragrances: [],
      dislikedFragrances: [],
    });
    setRecommendationsRequested(false);
    setShowFavorites(false);
  }

  // Render the main application UI
  return (
    <div>
      {/* Header with logout and clear session buttons */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Welcome, {username}</h1>
        <div>
          <Button
            onClick={handleClearSession}
            variant="secondary"
            className="transition transform hover:scale-105 active:scale-95"
          >
            Clear Session
          </Button>
          <Button
            onClick={onLogout}
            variant="secondary"
            className="ml-2 transition transform hover:scale-105 active:scale-95"
          >
            Logout
          </Button>
        </div>
      </div>
      {/* Input for favorite scents */}
      <div className="mb-4">
        <label
          htmlFor="favorite-scents"
          className="block text-sm font-medium text-fg-default mb-2"
        >
          Enter the scents you like:
        </label>
        <Textarea
          id="favorite-scents"
          value={scents}
          onChange={(e) => setScents(e.target.value)}
          placeholder="e.g., jasmine, sandalwood, vanilla"
          rows={4}
          className="w-full"
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
      </div>
      {/* Action buttons */}
      <div className="flex space-x-4">
        <Button
          onClick={handleSubmit}
          disabled={loading || !scents.trim()}
          variant="primary"
          className="transition transform hover:scale-105 active:scale-95"
          aria-label="Get Recommendations Button with Animation"
        >
          {loading ? 'Loading...' : 'Get Recommendations'}
        </Button>
        {recommendationsRequested && scents.trim() && (
          <Button
            onClick={handleGenerateScents}
            disabled={generatingScents}
            variant="secondary"
            className="transition transform hover:scale-105 active:scale-95"
            aria-label="Generate More Scents Button with Animation"
          >
            {generatingScents ? 'Generating...' : 'Generate More Scents'}
          </Button>
        )}
        <Button
          onClick={() => setShowFavorites(!showFavorites)}
          variant="secondary"
          className="transition transform hover:scale-105 active:scale-95"
          aria-label="Show or Hide Favorites Button with Animation"
        >
          {showFavorites ? 'Hide Favorites' : 'Show Favorites'}
        </Button>
      </div>
      {/* Filter and sort options */}
      {suggestions.length > 0 && (
        <>
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">
              Filter and Sort Options
            </h2>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="min-similarity"
                  className="block text-sm font-medium text-fg-default mb-2"
                >
                  Minimum Similarity Score:
                </label>
                <input
                  type="range"
                  id="min-similarity"
                  min="0"
                  max="1"
                  step="0.01"
                  value={minSimilarity}
                  onChange={(e) =>
                    setMinSimilarity(parseFloat(e.target.value))
                  }
                  className="w-full"
                />
                <div className="text-sm text-fg-muted">
                  Current minimum similarity: {minSimilarity.toFixed(2)}
                </div>
              </div>
              <div className="flex space-x-4">
                <div className="w-1/2">
                  <label
                    htmlFor="sort-option"
                    className="block text-sm font-medium text-fg-default mb-2"
                  >
                    Sort by:
                  </label>
                  <Select
                    id="sort-option"
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="w-full"
                  >
                    <option value="similarity">Similarity</option>
                    <option value="price">Price</option>
                    <option value="name">Name</option>
                    <option value="manufacturer">Manufacturer</option>
                  </Select>
                </div>
                <div className="w-1/2">
                  <label
                    htmlFor="sort-order"
                    className="block text-sm font-medium text-fg-default mb-2"
                  >
                    Sort Order:
                  </label>
                  <Select
                    id="sort-order"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="w-full"
                  >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </Select>
                </div>
              </div>
            </div>
          </div>
          {/* Recommended fragrances list */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">
              Recommended Fragrances
            </h2>
            <ul className="space-y-4">
              {sortedSuggestions().map((item, index) => (
                <li
                  key={index}
                  className="p-4 border rounded-lg shadow"
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="flex items-center"
                      onClick={(e) => {
                        if (
                          !e.target.closest('button') &&
                          !e.target.closest('a')
                        ) {
                          e.currentTarget.classList.add(
                            'transition',
                            'transform',
                            'hover:scale-105',
                            'active:scale-95'
                          );
                          setTimeout(() => {
                            e.currentTarget.classList.remove(
                              'transition',
                              'transform',
                              'hover:scale-105',
                              'active:scale-95'
                            );
                          }, 100);
                        }
                      }}
                    >
                      {/* Circle indicator for similarity */}
                      <div
                        className={`w-4 h-4 rounded-full mr-2 ${
                          parseFloat(item.similarity) >= 0.9
                            ? 'bg-green-500'
                            : parseFloat(item.similarity) >= 0.8
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                      ></div>
                      <h3 className="text-lg font-bold">{item.name}</h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      {/* Thumbs Up Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(item);
                        }}
                        className="transition transform hover:scale-110 active:scale-95"
                        aria-label="Like"
                      >
                        <ThumbsUp
                          className={`h-6 w-6 ${
                            likedFragrances.some(
                              (fragrance) => fragrance.name === item.name
                            )
                              ? 'text-blue-500'
                              : 'text-gray-400'
                          }`}
                          weight="fill"
                        />
                      </button>
                      {/* Thumbs Down Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDislike(item);
                        }}
                        className="transition transform hover:scale-110 active:scale-95"
                        aria-label="Dislike"
                      >
                        <ThumbsDown
                          className={`h-6 w-6 ${
                            dislikedFragrances.some(
                              (fragrance) => fragrance.name === item.name
                            )
                              ? 'text-red-500'
                              : 'text-gray-400'
                          }`}
                          weight="fill"
                        />
                      </button>
                      {/* Favorite Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(item);
                        }}
                      >
                        <Star
                          className={`h-6 w-6 transition-transform duration-300 ease-out ${
                            favorites.some((fav) => fav.name === item.name)
                              ? 'text-yellow-500'
                              : 'text-gray-400'
                          } ${
                            animatingFavorites.includes(item.name)
                              ? 'transform scale-125'
                              : ''
                          }`}
                          weight={
                            favorites.some((fav) => fav.name === item.name)
                              ? 'fill'
                              : 'regular'
                          }
                          aria-label={
                            favorites.some((fav) => fav.name === item.name)
                              ? 'Unfavorite'
                              : 'Favorite'
                          }
                        />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-fg-muted">
                    Manufacturer: {item.manufacturer}
                  </p>
                  <p className="text-sm text-fg-muted">Price: ${item.price}</p>
                  <p className="text-sm mt-2">{item.description}</p>
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(
                      `${item.name} ${item.manufacturer} perfume`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-primary hover:underline transition-colors duration-300"
                  >
                    View Product
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
      {/* Favorites Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-black text-white shadow-lg transform transition-transform duration-300 ease-in-out ${
          showFavorites ? 'translate-x-0' : 'translate-x-full'
        } z-50`}
      >
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-4">Favorites</h2>
          {favorites.length === 0 ? (
            <p>No favorites yet.</p>
          ) : (
            <ul className="space-y-4">
              {favorites.map((item, index) => (
                <li
                  key={index}
                  className="p-2 border border-gray-700 rounded flex items-center justify-between transition transform hover:scale-105 active:scale-95"
                >
                  <div>
                    <h3 className="font-bold">{item.name}</h3>
                    <p className="text-sm text-gray-300">
                      Manufacturer: {item.manufacturer}
                    </p>
                    <p className="text-sm text-gray-300">
                      Price: ${item.price}
                    </p>
                  </div>
                  <button onClick={() => removeFavorite(item)}>
                    <Trash className="h-6 w-6 text-gray-400 hover:text-red-500 transition-colors duration-300" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );

  // Function to sort suggestions based on user preferences
  function sortedSuggestions() {
    if (suggestions.length > 0) {
      const filteredSuggestions = suggestions.filter(
        (item) => parseFloat(item.similarity) >= minSimilarity
      );
      const sorted = [...filteredSuggestions].sort((a, b) => {
        let comparison = 0;
        if (sortOption === 'price') {
          comparison = parseFloat(a.price) - parseFloat(b.price);
        } else if (sortOption === 'name') {
          comparison = a.name.localeCompare(b.name);
        } else if (sortOption === 'manufacturer') {
          comparison = a.manufacturer.localeCompare(b.manufacturer);
        } else if (sortOption === 'similarity') {
          comparison =
            parseFloat(a.similarity) - parseFloat(b.similarity);
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
      return sorted;
    } else {
      return suggestions;
    }
  }
}

const root = createRoot(document.getElementById('root'));
root.render(<App />);

