import { Link } from 'react-router-dom';

interface StoryCardProps {
  id: string;
  slug: string;
  title: string;
  category: string;
  shortDescription: string;
  image: string;
}

export function StoryCard({ slug, title, category, shortDescription, image }: StoryCardProps) {
  return (
    <Link to={`/stories/${slug}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-soft border border-border-soft transition-all hover:shadow-lg h-full flex flex-col">
        <div className="relative h-48 overflow-hidden bg-muted">
          <img 
            src={image} 
            alt={title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
        <div className="p-5 flex-1 flex flex-col">
          <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-2">{category}</p>
          <h3 className="font-bold text-xl leading-snug text-foreground mb-3 group-hover:text-primary transition-colors">{title}</h3>
          <p className="text-sm text-gray-600 line-clamp-2 mt-auto">
            {shortDescription}
          </p>
        </div>
      </div>
    </Link>
  );
}
