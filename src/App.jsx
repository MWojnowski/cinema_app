import { useState,useEffect } from 'react'
import { useDebounce } from 'react-use';
import Search from './components/search/search'
import Spinner from './components/Spinner/Spinner';
import MovieCard from './components/MovieCard/MovieCard';
import { updateSearchCount,getTrendingMovies } from './appwrite';


const API_BASE_URL = 'https://api.themoviedb.org/3'
const API_KEY = import.meta.env.VITE_TMDP_API_KEY;
const API_OPTIONS = {
  method: 'GET',
  headers:{
    accept:'application/json',
    Authorization:`Bearer ${API_KEY}`
  }
}

function App() {
  const [debouncedSearch,setDebouncedSearch] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const [movieList, setMovieList] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null)
  const [isLoading,setIsLoading] = useState(false)


useDebounce(()=> (setDebouncedSearch(searchTerm)),750,[searchTerm])

  const fetchMovies = async (query='')=>{
    setIsLoading(true)
    setErrorMessage('')

    try{
      const endpoint =query ?
      `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
      : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`

      const response = await fetch(endpoint,API_OPTIONS)
      
      if(!response.ok){
        throw new Error('Failed to fetch movies')
      }

      const data = await response.json()
      console.log(data)
      if(data.Response === 'False'){
          setErrorMessage(data.error || 'Failed to fetch movies')
          setMovieList([]);
          return;
      }

      setMovieList(data.results || [])
       if(query && data.results.length >0){
        await updateSearchCount(query,data.results[0])
       } 
    }
    catch(error){
      console.error(`Error in movies: ${error}`)
      setErrorMessage('Error fetching movies. Please try again later.')
    }finally{
      setIsLoading(false)
    }
  }

  const loadTrending = async () =>{
    try{
      const movies = await getTrendingMovies()
      setTrendingMovies(movies)
    }
    catch(error){
      console.error(error)
    }
  }

  useEffect(()=>{
    fetchMovies(debouncedSearch);
  },[debouncedSearch])

  useEffect(()=>{
    loadTrending()
  },[])

  return (
    <>
    <main>
      <div className="pattern"></div>
      <div className="wrapper">
        <header>
          <img src="./hero.png" alt="Hero Banner" />
          <h1>Find <span className='text-gradient'>Movies</span> You'll Enjoy Without the Hassle</h1>
          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm}/>
        </header>
        {trendingMovies.length >0 && (<section className='trending'>
          <h2>Trending Movies</h2>
          <ul>
            {trendingMovies.map((item,index) => (<li key={item.$id}>
              <p>{index+1}</p>
              <img src={item.poster_url} alt={item.$title} />
            </li>))}
          </ul>
        </section>)}
       <section className='all-movies'>
        <h2>Popular Movies</h2>
        {isLoading ? (
          <Spinner/>
          ): errorMessage ? (
          <p className='text-red-500'>{errorMessage}</p>
          ):(
          <ul>
            {movieList.map((movie)=>(
              <MovieCard key={movie.id} movie={movie}/>
            ))}
          </ul>)}
       </section>
      </div>
    </main>
    </>
  )
}

export default App
