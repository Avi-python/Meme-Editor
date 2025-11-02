import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import type { Meme } from './types';
import MemeCard from './components/MemeCard';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorDisplay from './components/ErrorDisplay';

const MEMES_PER_PAGE = 20;

const App: React.FC = () => {
  const [memes, setMemes] = useState<Meme[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMessage, setLoadingMessage] = useState<string>('Fetching memes...');
  const [error, setError] = useState<string | null>(null);
  const [visibleMemeCount, setVisibleMemeCount] = useState<number>(MEMES_PER_PAGE);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    const fetchAndTagMemes = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Fetch memes from imgflip
        setLoadingMessage('Fetching memes...');
        const response = await fetch('https://api.imgflip.com/get_memes');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (!data.success) {
          throw new Error('Failed to fetch memes from API.');
        }
        
        const fetchedMemes: Omit<Meme, 'tags'>[] = data.data.memes;

        // 2. Generate tags using Gemini API
        setLoadingMessage('Generating tags with AI...');
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const tagGenerationSchema = {
          type: Type.OBJECT,
          properties: {
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['tags']
        };
        
        const taggedMemesPromises = fetchedMemes.map(async (meme) => {
            try {
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: `Generate 3-5 relevant, one-word, lowercase tags for a meme named "${meme.name}". The tags should categorize the meme's theme, reaction, or subject.`,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: tagGenerationSchema,
                    },
                });
                const json = JSON.parse(response.text);
                return { ...meme, tags: json.tags || [] };
            } catch (error) {
                console.error(`Failed to generate tags for "${meme.name}":`, error);
                return { ...meme, tags: [] }; // Return meme with empty tags on failure
            }
        });

        const taggedMemes = await Promise.all(taggedMemesPromises);
        setMemes(taggedMemes);

      } catch (e) {
        if (e instanceof Error) {
            setError(e.message);
        } else {
            setError('An unknown error occurred.');
        }
        console.error("Error during setup:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchAndTagMemes();
  }, []);
  
  const filteredMemes = useMemo(() => {
    if (!searchTerm) return memes;
    const lowercasedTerm = searchTerm.toLowerCase();
    return memes.filter(meme => 
      meme.name.toLowerCase().includes(lowercasedTerm) ||
      meme.tags.some(tag => tag.toLowerCase().includes(lowercasedTerm))
    );
  }, [memes, searchTerm]);

  useEffect(() => {
    setVisibleMemeCount(MEMES_PER_PAGE);
  }, [searchTerm]);

  const handleLoadMore = () => {
    setVisibleMemeCount(prevCount => prevCount + MEMES_PER_PAGE);
  };

  const renderContent = () => {
    if (loading) {
      return <LoadingSpinner message={loadingMessage} />;
    }
    if (error) {
      return <ErrorDisplay message={`Error: ${error}`} />;
    }

    const visibleMemes = filteredMemes.slice(0, visibleMemeCount);
    
    if (visibleMemes.length === 0) {
        return <p className="text-center text-gray-400">{searchTerm ? 'No memes match your search.' : 'No memes found.'}</p>;
    }

    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {visibleMemes.map((meme) => (
            <MemeCard key={meme.id} meme={meme} />
          ))}
        </div>
        {visibleMemeCount < filteredMemes.length && (
          <div className="text-center mt-12">
            <button
              onClick={handleLoadMore}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-8 rounded-full hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-pink-500 transition-all duration-300 transform hover:scale-105"
              aria-label="Load more memes"
            >
              Load More
            </button>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      <header className="py-8">
        <h1 className="text-5xl font-extrabold text-center tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
          Meme Explorer
        </h1>
        <p className="text-center text-gray-400 mt-2">Discover the Funniest Memes on the Web</p>
      </header>
      
      <div className="container mx-auto px-4 mb-8">
        <div className="relative max-w-2xl mx-auto">
          <input
            type="text"
            placeholder="Search memes by name or tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-800 border-2 border-gray-700 text-white rounded-full py-3 px-6 pl-12 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
            aria-label="Search memes"
          />
          <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <main className="container mx-auto px-4 pb-12">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
