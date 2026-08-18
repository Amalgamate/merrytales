import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StoryCard } from '@/components/merry/StoryCard';
import { PageHero } from '@/components/merry/PageHero';
import { FloatingGiftIcons } from '@/components/merry/FloatingGiftIcons';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

interface Story {
  id: string;
  slug: string;
  title: string;
  category: string;
  shortDescription: string;
  image: string;
  date: string;
}

export function Stories() {
  const location = useLocation();
  const isRealWeddings = location.pathname.includes('real-weddings');

  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/stories`)
      .then(r => r.json())
      .then((body: { data: Story[] }) => setStories(body.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const displayStories = isRealWeddings
    ? stories.filter(s => s.category === 'Real Weddings')
    : stories;

  return (
    <div className="pt-20 min-h-screen bg-background pb-24">
      {/* Hero Section */}
      <PageHero
        label={isRealWeddings ? 'Real Weddings' : 'Stories & Inspiration'}
        title={isRealWeddings ? 'LOVE STORIES IN MOTION.' : 'IDEAS FOR YOUR BIG DAY.'}
        subtitle={
          isRealWeddings
            ? 'Get inspired by couples who celebrated their love with Merry Tales.'
            : 'Wedding advice, real stories, style inspiration, and planning tips from the Merry Tales team.'
        }
        image="/african_stories_hero.png"
        imageAlt="Love Stories"
        overlay="dark"
        height="md"
      />

      {/* Categories Navigation */}
      {!isRealWeddings && (
        <div className="max-w-7xl mx-auto px-4 mt-8 border-b border-border-soft pb-4">
          <div className="flex overflow-x-auto hide-scrollbar space-x-6">
            <Link to="/stories" className="font-bold text-primary border-b-2 border-primary pb-1 whitespace-nowrap">All Stories</Link>
            <Link to="/stories/real-weddings" className="font-semibold text-gray-500 hover:text-foreground whitespace-nowrap">Real Weddings</Link>
            <button className="font-semibold text-gray-500 hover:text-foreground whitespace-nowrap">Wedding Inspiration</button>
            <button className="font-semibold text-gray-500 hover:text-foreground whitespace-nowrap">Planning Advice</button>
            <button className="font-semibold text-gray-500 hover:text-foreground whitespace-nowrap">Style Guides</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Featured Story */}
          {!isRealWeddings && stories.length > 0 && (
            <div className="max-w-7xl mx-auto px-4 mt-12 mb-16">
              <div className="bg-white rounded-3xl overflow-hidden shadow-soft border border-border-soft flex flex-col md:flex-row group cursor-pointer hover:shadow-lg transition-all">
                <div className="w-full md:w-1/2 h-64 md:h-[400px] overflow-hidden">
                  <img src={stories[0].image} alt={stories[0].title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
                <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                  <p className="text-sm text-primary font-semibold uppercase tracking-wider mb-3">Featured • {stories[0].category}</p>
                  <h2 className="text-3xl md:text-4xl font-extrabold mb-4 leading-tight">{stories[0].title}</h2>
                  <p className="text-gray-600 mb-6 text-lg">{stories[0].shortDescription}</p>
                  <Button className="w-max rounded-full">Read Story</Button>
                </div>
              </div>
            </div>
          )}

          {/* Grid */}
          <div className={`max-w-7xl mx-auto px-4 ${isRealWeddings ? 'mt-12' : ''}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {(isRealWeddings ? displayStories : displayStories.slice(1)).map((story) => (
                <StoryCard key={story.id} {...story} />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Newsletter CTA */}
      <div className="max-w-7xl mx-auto px-4 mt-24">
        <div className="relative overflow-hidden bg-foreground text-white rounded-3xl p-8 md:p-16 text-center">
          <FloatingGiftIcons />
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-4">Get wedding inspiration delivered.</h2>
            <p className="text-white font-medium mb-8 max-w-xl mx-auto">Sign up for our weekly newsletter full of real weddings, style guides, and planning tips.</p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input type="email" placeholder="Your email address" className="flex-1 rounded-full px-6 py-3 text-foreground focus:outline-none" />
              <Button className="rounded-full font-bold shadow-soft whitespace-nowrap px-8">Subscribe</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
