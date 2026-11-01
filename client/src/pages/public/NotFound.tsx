import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center px-4">
      {/* 404 heading */}
      <h1
        className="text-[10rem] sm:text-[14rem] font-bold leading-none select-none bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent"
        style={{ fontFamily: '"DM Serif Display", serif' }}
      >
        404
      </h1>

      {/* Subtitle */}
      <h2
        className="mt-2 text-2xl sm:text-3xl font-semibold text-stone-200"
        style={{ fontFamily: '"Outfit", sans-serif' }}
      >
        Page not found
      </h2>

      {/* Description */}
      <p className="mt-3 text-stone-400 text-center max-w-sm text-base" style={{ fontFamily: '"Outfit", sans-serif' }}>
        The page you're looking for doesn't exist or has been moved.
      </p>

      {/* Go Home button */}
      <Link
        to="/"
        className="mt-10 inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-stone-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 transition-all duration-200 shadow-lg shadow-amber-500/20"
        style={{ fontFamily: '"Outfit", sans-serif' }}
      >
        Go Home
      </Link>

      {/* Browse Listings link */}
      <Link
        to="/listings"
        className="mt-4 text-sm text-stone-500 hover:text-amber-400 transition-colors duration-200"
        style={{ fontFamily: '"Outfit", sans-serif' }}
      >
        Browse Listings
      </Link>
    </div>
  );
};

export default NotFound;
