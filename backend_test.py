import requests
import sys
import json
import io
from datetime import datetime

class CineBaseAPITester:
    def __init__(self, base_url="https://f83ab4c8-b996-4f7d-a983-7dcc72b96ed8.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.created_actors = []
        self.created_movies = []

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {}
        if data and not files:
            headers['Content-Type'] = 'application/json'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=data)
            elif method == 'POST':
                if files:
                    response = requests.post(url, data=data, files=files)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and 'id' in response_data:
                        print(f"   Created ID: {response_data['id']}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_create_actor(self, actor_data):
        """Test creating an actor"""
        success, response = self.run_test(
            f"Create Actor - {actor_data['nom']}",
            "POST",
            "actors",
            200,
            data=actor_data
        )
        if success and 'id' in response:
            self.created_actors.append(response)
            return response['id']
        return None

    def test_get_actors(self, params=None):
        """Test getting actors with optional filters"""
        test_name = "Get Actors"
        if params:
            test_name += f" with filters: {params}"
        
        success, response = self.run_test(
            test_name,
            "GET",
            "actors",
            200,
            data=params
        )
        if success:
            print(f"   Found {len(response)} actors")
        return success, response

    def test_get_actor_by_id(self, actor_id):
        """Test getting a specific actor"""
        success, response = self.run_test(
            f"Get Actor by ID - {actor_id}",
            "GET",
            f"actors/{actor_id}",
            200
        )
        return success, response

    def test_create_movie(self, movie_data):
        """Test creating a movie"""
        success, response = self.run_test(
            f"Create Movie - {movie_data['nom']}",
            "POST",
            "movies",
            200,
            data=movie_data
        )
        if success and 'id' in response:
            self.created_movies.append(response)
            return response['id']
        return None

    def test_get_movies(self, params=None):
        """Test getting movies with optional filters"""
        test_name = "Get Movies"
        if params:
            test_name += f" with filters: {params}"
        
        success, response = self.run_test(
            test_name,
            "GET",
            "movies",
            200,
            data=params
        )
        if success:
            print(f"   Found {len(response)} movies")
        return success, response

    def test_get_movie_by_id(self, movie_id):
        """Test getting a specific movie"""
        success, response = self.run_test(
            f"Get Movie by ID - {movie_id}",
            "GET",
            f"movies/{movie_id}",
            200
        )
        return success, response

    def test_global_search(self, query):
        """Test global search functionality"""
        success, response = self.run_test(
            f"Global Search - '{query}'",
            "GET",
            "search",
            200,
            data={"q": query}
        )
        if success:
            actors_count = len(response.get('actors', []))
            movies_count = len(response.get('movies', []))
            print(f"   Found {actors_count} actors, {movies_count} movies")
        return success, response

    def test_get_genres(self):
        """Test getting all genres"""
        success, response = self.run_test(
            "Get All Genres",
            "GET",
            "genres",
            200
        )
        if success:
            genres = response.get('genres', [])
            print(f"   Found {len(genres)} genres: {genres}")
        return success, response

    def test_get_nationalities(self):
        """Test getting all nationalities"""
        success, response = self.run_test(
            "Get All Nationalities",
            "GET",
            "nationalities",
            200
        )
        if success:
            nationalities = response.get('nationalities', [])
            print(f"   Found {len(nationalities)} nationalities: {nationalities}")
        return success, response

    def test_file_upload(self, entity_type, entity_id):
        """Test file upload for actor or movie"""
        # Create a simple test image file
        test_image_content = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\nIDATx\x9cc\xf8\x00\x00\x00\x01\x00\x01\x00\x00\x00\x00IEND\xaeB`\x82'
        
        files = {'file': ('test.png', io.BytesIO(test_image_content), 'image/png')}
        
        success, response = self.run_test(
            f"Upload {entity_type} Photo - {entity_id}",
            "POST",
            f"{entity_type}s/{entity_id}/photo",
            200,
            files=files
        )
        if success:
            photo_url = response.get('photo_url', '')
            print(f"   Photo URL: {photo_url}")
        return success, response

def main():
    print("🎬 Starting CinéBase API Testing...")
    print("=" * 50)
    
    tester = CineBaseAPITester()
    
    # Test sample data
    sample_actor = {
        "nom": "Marion Cotillard",
        "age": 48,
        "nationalite": "Française",
        "biographie": "Actrice française primée aux Oscars"
    }
    
    sample_movie = {
        "nom": "La Môme",
        "annee": 2007,
        "genre": "Biographie",
        "description": "Film biographique sur Édith Piaf"
    }
    
    # Additional test data
    sample_actor2 = {
        "nom": "Jean Dujardin",
        "age": 52,
        "nationalite": "Française",
        "biographie": "Acteur français connu pour The Artist"
    }
    
    sample_movie2 = {
        "nom": "The Artist",
        "annee": 2011,
        "genre": "Drame",
        "description": "Film muet en noir et blanc"
    }

    print("\n📋 PHASE 1: ACTOR CRUD OPERATIONS")
    print("-" * 40)
    
    # Test creating actors
    actor1_id = tester.test_create_actor(sample_actor)
    actor2_id = tester.test_create_actor(sample_actor2)
    
    # Test getting all actors
    tester.test_get_actors()
    
    # Test getting specific actors
    if actor1_id:
        tester.test_get_actor_by_id(actor1_id)
    
    # Test actor search and filters
    tester.test_get_actors({"search": "Marion"})
    tester.test_get_actors({"nationalite": "Française"})
    tester.test_get_actors({"age_min": 45, "age_max": 55})
    
    print("\n🎬 PHASE 2: MOVIE CRUD OPERATIONS")
    print("-" * 40)
    
    # Test creating movies
    movie1_id = tester.test_create_movie(sample_movie)
    movie2_id = tester.test_create_movie(sample_movie2)
    
    # Test getting all movies
    tester.test_get_movies()
    
    # Test getting specific movies
    if movie1_id:
        tester.test_get_movie_by_id(movie1_id)
    
    # Test movie search and filters
    tester.test_get_movies({"search": "Môme"})
    tester.test_get_movies({"genre": "Biographie"})
    tester.test_get_movies({"annee": 2007})
    
    print("\n🔍 PHASE 3: SEARCH AND UTILITY OPERATIONS")
    print("-" * 40)
    
    # Test global search
    tester.test_global_search("Marion")
    tester.test_global_search("Biographie")
    tester.test_global_search("2007")
    
    # Test utility endpoints
    tester.test_get_genres()
    tester.test_get_nationalities()
    
    print("\n📤 PHASE 4: FILE UPLOAD OPERATIONS")
    print("-" * 40)
    
    # Test file uploads
    if actor1_id:
        tester.test_file_upload("actor", actor1_id)
    if movie1_id:
        tester.test_file_upload("movie", movie1_id)
    
    print("\n📊 FINAL RESULTS")
    print("=" * 50)
    print(f"Tests run: {tester.tests_run}")
    print(f"Tests passed: {tester.tests_passed}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.created_actors:
        print(f"\nCreated {len(tester.created_actors)} actors:")
        for actor in tester.created_actors:
            print(f"  - {actor['nom']} (ID: {actor['id']})")
    
    if tester.created_movies:
        print(f"\nCreated {len(tester.created_movies)} movies:")
        for movie in tester.created_movies:
            print(f"  - {movie['nom']} (ID: {movie['id']})")
    
    # Return appropriate exit code
    if tester.tests_passed == tester.tests_run:
        print("\n🎉 All tests passed!")
        return 0
    else:
        failed_tests = tester.tests_run - tester.tests_passed
        print(f"\n⚠️  {failed_tests} test(s) failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())