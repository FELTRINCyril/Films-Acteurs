import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Textarea } from "./components/ui/textarea";
import { Badge } from "./components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Search, Film, User, Plus, Upload, ExternalLink, Filter } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Navigation Component
const Navigation = () => (
  <nav className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 shadow-xl border-b border-purple-500/20">
    <div className="container mx-auto px-6 py-4">
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg">
            <Film className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            CinéBase
          </span>
        </Link>
        <div className="flex space-x-6">
          <Link to="/actors" className="text-gray-300 hover:text-purple-400 transition-colors duration-200">
            Acteurs
          </Link>
          <Link to="/movies" className="text-gray-300 hover:text-purple-400 transition-colors duration-200">
            Films
          </Link>
          <Link to="/admin" className="text-gray-300 hover:text-purple-400 transition-colors duration-200">
            Administration
          </Link>
        </div>
      </div>
    </div>
  </nav>
);

// Search Component
const GlobalSearch = ({ onResults }) => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const response = await axios.get(`${API}/search`, { params: { q: query } });
      onResults(response.data);
    } catch (error) {
      console.error("Search error:", error);
    }
    setLoading(false);
  };

  return (
    <div className="flex space-x-2">
      <Input
        placeholder="Rechercher un acteur, film, genre..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyPress={(e) => e.key === "Enter" && handleSearch()}
        className="flex-1"
      />
      <Button onClick={handleSearch} disabled={loading}>
        <Search className="h-4 w-4" />
      </Button>
    </div>
  );
};

// Home Page
const Home = () => {
  const [searchResults, setSearchResults] = useState(null);
  const [recentActors, setRecentActors] = useState([]);
  const [recentMovies, setRecentMovies] = useState([]);

  useEffect(() => {
    loadRecentData();
  }, []);

  const loadRecentData = async () => {
    try {
      const [actorsRes, moviesRes] = await Promise.all([
        axios.get(`${API}/actors`, { params: { limit: 6 } }),
        axios.get(`${API}/movies`, { params: { limit: 6 } })
      ]);
      setRecentActors(actorsRes.data);
      setRecentMovies(moviesRes.data);
    } catch (error) {
      console.error("Error loading recent data:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <Navigation />
      
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            CinéBase
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Votre répertoire complet de films et d'acteurs. Découvrez, recherchez et gérez votre collection cinématographique.
          </p>
          
          <div className="max-w-2xl mx-auto">
            <GlobalSearch onResults={setSearchResults} />
          </div>
        </div>

        {/* Search Results */}
        {searchResults && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">Résultats de recherche</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Actors Results */}
              <div>
                <h3 className="text-lg font-semibold text-purple-400 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Acteurs ({searchResults.actors?.length || 0})
                </h3>
                <div className="space-y-3">
                  {searchResults.actors?.slice(0, 3).map((actor) => (
                    <Card key={actor.id} className="bg-gray-800/50 border-purple-500/20">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-4">
                          {actor.photo_profil && (
                            <img
                              src={`${BACKEND_URL}${actor.photo_profil}`}
                              alt={actor.nom}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          )}
                          <div>
                            <h4 className="font-semibold text-white">{actor.nom}</h4>
                            {actor.nationalite && (
                              <p className="text-gray-400 text-sm">{actor.nationalite}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Movies Results */}
              <div>
                <h3 className="text-lg font-semibold text-purple-400 mb-4 flex items-center">
                  <Film className="h-5 w-5 mr-2" />
                  Films ({searchResults.movies?.length || 0})
                </h3>
                <div className="space-y-3">
                  {searchResults.movies?.slice(0, 3).map((movie) => (
                    <Card key={movie.id} className="bg-gray-800/50 border-purple-500/20">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-4">
                          {movie.photo_couverture && (
                            <img
                              src={`${BACKEND_URL}${movie.photo_couverture}`}
                              alt={movie.nom}
                              className="w-12 h-12 rounded object-cover"
                            />
                          )}
                          <div>
                            <h4 className="font-semibold text-white">{movie.nom}</h4>
                            <div className="flex items-center space-x-2 text-sm text-gray-400">
                              {movie.annee && <span>{movie.annee}</span>}
                              {movie.genre && <Badge variant="secondary">{movie.genre}</Badge>}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Content */}
        <div className="grid md:grid-cols-2 gap-12">
          {/* Recent Actors */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <User className="h-6 w-6 mr-2" />
              Acteurs Récents
            </h2>
            <div className="grid gap-4">
              {recentActors.map((actor) => (
                <Card key={actor.id} className="bg-gray-800/50 border-purple-500/20 hover:border-purple-400/40 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      {actor.photo_profil ? (
                        <img
                          src={`${BACKEND_URL}${actor.photo_profil}`}
                          alt={actor.nom}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center">
                          <User className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-white text-lg">{actor.nom}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                          {actor.age && <span>{actor.age} ans</span>}
                          {actor.nationalite && <span>{actor.nationalite}</span>}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Link to="/actors">
                <Button variant="outline" className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10">
                  Voir tous les acteurs
                </Button>
              </Link>
            </div>
          </div>

          {/* Recent Movies */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Film className="h-6 w-6 mr-2" />
              Films Récents
            </h2>
            <div className="grid gap-4">
              {recentMovies.map((movie) => (
                <Card key={movie.id} className="bg-gray-800/50 border-purple-500/20 hover:border-purple-400/40 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      {movie.photo_couverture ? (
                        <img
                          src={`${BACKEND_URL}${movie.photo_couverture}`}
                          alt={movie.nom}
                          className="w-16 h-24 rounded object-cover"
                        />
                      ) : (
                        <div className="w-16 h-24 bg-gray-700 rounded flex items-center justify-center">
                          <Film className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-white text-lg">{movie.nom}</h3>
                        <div className="flex items-center space-x-2 mt-2">
                          {movie.annee && <Badge variant="secondary">{movie.annee}</Badge>}
                          {movie.genre && <Badge variant="outline">{movie.genre}</Badge>}
                        </div>
                        {movie.lien_externe && (
                          <a
                            href={movie.lien_externe}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-purple-400 text-sm mt-2 hover:text-purple-300"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Voir le film
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Link to="/movies">
                <Button variant="outline" className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10">
                  Voir tous les films
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Actors Page
const ActorsPage = () => {
  const [actors, setActors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    nom: "",
    nationalite: "",
    age_min: "",
    age_max: ""
  });

  useEffect(() => {
    loadActors();
  }, []);

  const loadActors = async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== "")
      );
      const response = await axios.get(`${API}/actors`, { params });
      setActors(response.data);
    } catch (error) {
      console.error("Error loading actors:", error);
    }
    setLoading(false);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadActors();
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [filters]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <Navigation />
      
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Acteurs</h1>
          
          {/* Filters */}
          <Card className="bg-gray-800/50 border-purple-500/20 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Filter className="h-5 w-5 mr-2" />
                Filtres de recherche
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <Label htmlFor="search">Recherche globale</Label>
                  <Input
                    id="search"
                    placeholder="Nom, nationalité, bio..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange("search", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="nom">Nom</Label>
                  <Input
                    id="nom"
                    placeholder="Nom de l'acteur"
                    value={filters.nom}
                    onChange={(e) => handleFilterChange("nom", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="nationalite">Nationalité</Label>
                  <Input
                    id="nationalite"
                    placeholder="Nationalité"
                    value={filters.nationalite}
                    onChange={(e) => handleFilterChange("nationalite", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="age_min">Âge min</Label>
                  <Input
                    id="age_min"
                    type="number"
                    placeholder="Âge minimum"
                    value={filters.age_min}
                    onChange={(e) => handleFilterChange("age_min", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="age_max">Âge max</Label>
                  <Input
                    id="age_max"
                    type="number"
                    placeholder="Âge maximum"
                    value={filters.age_max}
                    onChange={(e) => handleFilterChange("age_max", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actors Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-white">Chargement...</div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {actors.map((actor) => (
              <Card key={actor.id} className="bg-gray-800/50 border-purple-500/20 hover:border-purple-400/40 transition-all duration-200 hover:scale-105">
                <CardContent className="p-6">
                  <div className="text-center">
                    {actor.photo_profil ? (
                      <img
                        src={`${BACKEND_URL}${actor.photo_profil}`}
                        alt={actor.nom}
                        className="w-32 h-32 rounded-full object-cover mx-auto mb-4"
                      />
                    ) : (
                      <div className="w-32 h-32 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                    
                    <h3 className="font-bold text-xl text-white mb-2">{actor.nom}</h3>
                    
                    <div className="space-y-2 text-sm">
                      {actor.age && (
                        <div className="text-gray-400">{actor.age} ans</div>
                      )}
                      {actor.nationalite && (
                        <Badge variant="secondary">{actor.nationalite}</Badge>
                      )}
                    </div>
                    
                    {actor.biographie && (
                      <p className="text-gray-300 text-sm mt-4 line-clamp-3">
                        {actor.biographie}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {actors.length === 0 && !loading && (
          <div className="text-center py-12">
            <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <div className="text-gray-400 text-lg">Aucun acteur trouvé</div>
          </div>
        )}
      </div>
    </div>
  );
};

// Movies Page
const MoviesPage = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    nom: "",
    genre: "",
    annee: ""
  });

  useEffect(() => {
    loadMovies();
  }, []);

  const loadMovies = async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== "")
      );
      const response = await axios.get(`${API}/movies`, { params });
      setMovies(response.data);
    } catch (error) {
      console.error("Error loading movies:", error);
    }
    setLoading(false);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadMovies();
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [filters]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <Navigation />
      
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Films</h1>
          
          {/* Filters */}
          <Card className="bg-gray-800/50 border-purple-500/20 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Filter className="h-5 w-5 mr-2" />
                Filtres de recherche
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="search">Recherche globale</Label>
                  <Input
                    id="search"
                    placeholder="Nom, genre, description..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange("search", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="nom">Nom du film</Label>
                  <Input
                    id="nom"
                    placeholder="Nom du film"
                    value={filters.nom}
                    onChange={(e) => handleFilterChange("nom", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="genre">Genre</Label>
                  <Input
                    id="genre"
                    placeholder="Genre"
                    value={filters.genre}
                    onChange={(e) => handleFilterChange("genre", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="annee">Année</Label>
                  <Input
                    id="annee"
                    type="number"
                    placeholder="Année"
                    value={filters.annee}
                    onChange={(e) => handleFilterChange("annee", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Movies Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-white">Chargement...</div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {movies.map((movie) => (
              <Card key={movie.id} className="bg-gray-800/50 border-purple-500/20 hover:border-purple-400/40 transition-all duration-200 hover:scale-105">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="relative mb-4">
                      {movie.photo_couverture ? (
                        <img
                          src={`${BACKEND_URL}${movie.photo_couverture}`}
                          alt={movie.nom}
                          className="w-full h-64 rounded-lg object-cover cursor-pointer"
                          onClick={() => movie.lien_externe && window.open(movie.lien_externe, '_blank')}
                        />
                      ) : (
                        <div className="w-full h-64 bg-gray-700 rounded-lg flex items-center justify-center">
                          <Film className="h-16 w-16 text-gray-400" />
                        </div>
                      )}
                      {movie.lien_externe && (
                        <div className="absolute top-2 right-2">
                          <a
                            href={movie.lien_externe}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-purple-600/80 hover:bg-purple-600 p-2 rounded-full transition-colors"
                          >
                            <ExternalLink className="h-4 w-4 text-white" />
                          </a>
                        </div>
                      )}
                    </div>
                    
                    <h3 className="font-bold text-xl text-white mb-2">{movie.nom}</h3>
                    
                    <div className="flex justify-center space-x-2 mb-3">
                      {movie.annee && <Badge variant="secondary">{movie.annee}</Badge>}
                      {movie.genre && <Badge variant="outline">{movie.genre}</Badge>}
                    </div>
                    
                    {movie.description && (
                      <p className="text-gray-300 text-sm line-clamp-3">
                        {movie.description}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {movies.length === 0 && !loading && (
          <div className="text-center py-12">
            <Film className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <div className="text-gray-400 text-lg">Aucun film trouvé</div>
          </div>
        )}
      </div>
    </div>
  );
};

// Administration Page
const AdminPage = () => {
  const [genres, setGenres] = useState([]);
  const [nationalities, setNationalities] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadGenresAndNationalities();
  }, []);

  const loadGenresAndNationalities = async () => {
    try {
      const [genresRes, nationalitiesRes] = await Promise.all([
        axios.get(`${API}/genres`),
        axios.get(`${API}/nationalities`)
      ]);
      setGenres(genresRes.data.genres || []);
      setNationalities(nationalitiesRes.data.nationalities || []);
    } catch (error) {
      console.error("Error loading genres/nationalities:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <Navigation />
      
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-4xl font-bold text-white mb-8">Administration</h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="bg-gray-800/50 border-purple-500/20">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <User className="h-6 w-6 mr-2" />
                Gestion des Acteurs
              </CardTitle>
              <CardDescription>
                Ajouter et gérer les profils d'acteurs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <AddActorForm nationalities={nationalities} onSuccess={() => navigate('/actors')} />
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-purple-500/20">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Film className="h-6 w-6 mr-2" />
                Gestion des Films
              </CardTitle>
              <CardDescription>
                Ajouter et gérer les films
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <AddMovieForm genres={genres} onSuccess={() => navigate('/movies')} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Add Actor Form
const AddActorForm = ({ nationalities, onSuccess }) => {
  const [formData, setFormData] = useState({
    nom: "",
    age: "",
    nationalite: "",
    biographie: ""
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nom.trim()) return;

    setLoading(true);
    try {
      // Create actor
      const actorData = {
        ...formData,
        age: formData.age ? parseInt(formData.age) : null
      };
      const response = await axios.post(`${API}/actors`, actorData);
      
      // Upload image if provided
      if (imageFile) {
        const imageFormData = new FormData();
        imageFormData.append('file', imageFile);
        await axios.post(`${API}/actors/${response.data.id}/photo`, imageFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      // Reset form
      setFormData({ nom: "", age: "", nationalite: "", biographie: "" });
      setImageFile(null);
      onSuccess();
    } catch (error) {
      console.error("Error creating actor:", error);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="nom">Nom *</Label>
        <Input
          id="nom"
          required
          value={formData.nom}
          onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
        />
      </div>
      
      <div>
        <Label htmlFor="age">Âge</Label>
        <Input
          id="age"
          type="number"
          value={formData.age}
          onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
        />
      </div>
      
      <div>
        <Label htmlFor="nationalite">Nationalité</Label>
        <Input
          id="nationalite"
          value={formData.nationalite}
          onChange={(e) => setFormData(prev => ({ ...prev, nationalite: e.target.value }))}
        />
      </div>
      
      <div>
        <Label htmlFor="biographie">Biographie</Label>
        <Textarea
          id="biographie"
          value={formData.biographie}
          onChange={(e) => setFormData(prev => ({ ...prev, biographie: e.target.value }))}
        />
      </div>
      
      <div>
        <Label htmlFor="photo">Photo de profil</Label>
        <Input
          id="photo"
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files[0])}
        />
      </div>
      
      <Button type="submit" disabled={loading} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        {loading ? "Ajout en cours..." : "Ajouter l'Acteur"}
      </Button>
    </form>
  );
};

// Add Movie Form
const AddMovieForm = ({ genres, onSuccess }) => {
  const [formData, setFormData] = useState({
    nom: "",
    annee: "",
    genre: "",
    description: "",
    lien_externe: ""
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nom.trim()) return;

    setLoading(true);
    try {
      // Create movie
      const movieData = {
        ...formData,
        annee: formData.annee ? parseInt(formData.annee) : null
      };
      const response = await axios.post(`${API}/movies`, movieData);
      
      // Upload image if provided
      if (imageFile) {
        const imageFormData = new FormData();
        imageFormData.append('file', imageFile);
        await axios.post(`${API}/movies/${response.data.id}/photo`, imageFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      // Reset form
      setFormData({ nom: "", annee: "", genre: "", description: "", lien_externe: "" });
      setImageFile(null);
      onSuccess();
    } catch (error) {
      console.error("Error creating movie:", error);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="nom">Nom *</Label>
        <Input
          id="nom"
          required
          value={formData.nom}
          onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
        />
      </div>
      
      <div>
        <Label htmlFor="annee">Année</Label>
        <Input
          id="annee"
          type="number"
          value={formData.annee}
          onChange={(e) => setFormData(prev => ({ ...prev, annee: e.target.value }))}
        />
      </div>
      
      <div>
        <Label htmlFor="genre">Genre</Label>
        <Input
          id="genre"
          value={formData.genre}
          onChange={(e) => setFormData(prev => ({ ...prev, genre: e.target.value }))}
          list="genres-list"
        />
        <datalist id="genres-list">
          {genres.map((genre, index) => (
            <option key={index} value={genre} />
          ))}
        </datalist>
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
        />
      </div>
      
      <div>
        <Label htmlFor="lien_externe">Lien externe</Label>
        <Input
          id="lien_externe"
          type="url"
          value={formData.lien_externe}
          onChange={(e) => setFormData(prev => ({ ...prev, lien_externe: e.target.value }))}
        />
      </div>
      
      <div>
        <Label htmlFor="photo">Photo de couverture</Label>
        <Input
          id="photo"
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files[0])}
        />
      </div>
      
      <Button type="submit" disabled={loading} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        {loading ? "Ajout en cours..." : "Ajouter le Film"}
      </Button>
    </form>
  );
};

// Main App
function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/actors" element={<ActorsPage />} />
          <Route path="/movies" element={<MoviesPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;