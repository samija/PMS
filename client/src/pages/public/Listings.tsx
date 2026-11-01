import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, Building2 } from 'lucide-react';
import { listingAPI } from '../../services/api';

export default function Listings() {
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    city: '',
    page: 1,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['listings', filters],
    queryFn: () => listingAPI.getAll(filters),
  });

  const listings = data?.data?.data?.listings || [];
  const pagination = data?.data?.data?.pagination;

  const propertyTypes = [
    { value: '', label: 'All Types' },
    { value: 'apartment', label: 'Apartment' },
    { value: 'house', label: 'House' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'villa', label: 'Villa' },
  ];

  return (
    <>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Outfit:wght@300;400;500;600;700&display=swap');

        .listings-root {
          font-family: 'Outfit', sans-serif;
          background-color: #0c0a09;
          min-height: 100vh;
          color: #e7e5e4;
        }

        /* Hero header */
        .listings-hero {
          background: linear-gradient(160deg, #1c1917 0%, #0c0a09 60%, #1a0e00 100%);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          padding: 3.5rem 1rem 3rem;
        }

        .listings-hero-inner {
          max-width: 80rem;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        .listings-hero h1 {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(2rem, 5vw, 3.25rem);
          font-weight: 400;
          color: #fafaf9;
          line-height: 1.15;
          letter-spacing: -0.01em;
        }

        .listings-hero h1 span {
          color: #d97706;
        }

        .listings-hero p {
          margin-top: 0.75rem;
          color: #a8a29e;
          font-size: 1rem;
          font-weight: 300;
          max-width: 42ch;
        }

        /* Search bar */
        .search-row {
          margin-top: 2rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        @media (min-width: 640px) {
          .search-row { flex-direction: row; }
        }

        .search-input-wrap {
          flex: 1;
          position: relative;
        }

        .search-icon {
          position: absolute;
          left: 0.875rem;
          top: 50%;
          transform: translateY(-50%);
          color: #78716c;
          width: 1.125rem;
          height: 1.125rem;
          pointer-events: none;
        }

        .dark-input {
          width: 100%;
          background: #1c1917;
          border: 1px solid #44403c;
          border-radius: 0.5rem;
          padding: 0.625rem 0.875rem;
          color: #fafaf9;
          font-family: 'Outfit', sans-serif;
          font-size: 0.9375rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          -webkit-appearance: none;
        }

        .dark-input::placeholder { color: #57534e; }

        .dark-input:focus {
          border-color: #d97706;
          box-shadow: 0 0 0 3px rgba(217,119,6,0.15);
        }

        .dark-input-padded { padding-left: 2.5rem; }

        .dark-select {
          background: #1c1917;
          border: 1px solid #44403c;
          border-radius: 0.5rem;
          padding: 0.625rem 2rem 0.625rem 0.875rem;
          color: #fafaf9;
          font-family: 'Outfit', sans-serif;
          font-size: 0.9375rem;
          outline: none;
          cursor: pointer;
          transition: border-color 0.2s, box-shadow 0.2s;
          -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2378716c' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.75rem center;
          min-width: 10rem;
        }

        .dark-select:focus {
          border-color: #d97706;
          box-shadow: 0 0 0 3px rgba(217,119,6,0.15);
        }

        .dark-select option {
          background: #1c1917;
          color: #fafaf9;
        }

        /* Main content */
        .listings-main {
          max-width: 80rem;
          margin: 0 auto;
          padding: 2.5rem 1.5rem 4rem;
        }

        /* Count line */
        .count-line {
          color: #78716c;
          font-size: 0.875rem;
          margin-bottom: 1.25rem;
        }

        /* Grid */
        .listings-grid {
          display: grid;
          gap: 1.5rem;
          grid-template-columns: 1fr;
        }

        @media (min-width: 640px) {
          .listings-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (min-width: 1024px) {
          .listings-grid { grid-template-columns: repeat(3, 1fr); }
        }

        /* Skeleton cards */
        .skeleton-card {
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 0.875rem;
          overflow: hidden;
          animation: pulse 1.8s ease-in-out infinite;
        }

        .skeleton-img {
          height: 12rem;
          background: #292524;
        }

        .skeleton-body {
          padding: 1.125rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .skeleton-line {
          height: 0.75rem;
          border-radius: 9999px;
          background: #292524;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        /* Property card link */
        .property-link {
          display: flex;
          flex-direction: column;
          height: 100%;
          text-decoration: none;
          color: inherit;
          border-radius: 0.875rem;
          outline-offset: 3px;
        }

        .property-link:focus-visible {
          outline: 2px solid #d97706;
        }

        /* Property card */
        .property-card {
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 0.875rem;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          height: 100%;
          transition: border-color 0.25s, box-shadow 0.25s, transform 0.25s;
        }

        .property-card:hover {
          border-color: rgba(217,119,6,0.35);
          box-shadow: 0 8px 32px rgba(0,0,0,0.45), 0 0 0 1px rgba(217,119,6,0.15);
          transform: translateY(-2px);
        }

        /* Image wrapper */
        .card-img-wrap {
          position: relative;
          overflow: hidden;
          height: 12rem;
        }

        .card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.45s ease;
        }

        .property-card:hover .card-img {
          transform: scale(1.06);
        }

        /* Type badge */
        .type-badge {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          background: rgba(217,119,6,0.9);
          color: #fafaf9;
          font-size: 0.6875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          padding: 0.25rem 0.625rem;
          border-radius: 9999px;
          backdrop-filter: blur(4px);
        }

        /* Card body */
        .card-body {
          padding: 1.125rem;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .card-title {
          font-size: 1.0625rem;
          font-weight: 600;
          color: #fafaf9;
          line-height: 1.3;
        }

        .card-address {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          color: #78716c;
          font-size: 0.8125rem;
          margin-top: 0.375rem;
        }

        .card-address svg {
          flex-shrink: 0;
          color: #d97706;
        }

        /* Amenity badges */
        .amenities-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.375rem;
          margin-top: 0.875rem;
        }

        .amenity-badge {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          color: #a8a29e;
          font-size: 0.6875rem;
          font-weight: 500;
          padding: 0.2rem 0.5rem;
          border-radius: 9999px;
        }

        /* Card footer */
        .card-footer {
          margin-top: auto;
          padding-top: 0.875rem;
          border-top: 1px solid rgba(255,255,255,0.06);
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }

        .price-label {
          font-size: 0.75rem;
          color: #57534e;
        }

        .price-value {
          font-size: 1.0625rem;
          font-weight: 700;
          color: #d97706;
          margin-top: 0.125rem;
        }

        .units-label {
          font-size: 0.75rem;
          color: #57534e;
          text-align: right;
        }

        .units-value {
          font-size: 0.9375rem;
          font-weight: 600;
          color: #e7e5e4;
          text-align: right;
          margin-top: 0.125rem;
        }

        /* Empty state */
        .empty-state {
          text-align: center;
          padding: 5rem 1rem;
        }

        .empty-icon-wrap {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 4.5rem;
          height: 4.5rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 9999px;
          margin-bottom: 1.25rem;
        }

        .empty-icon-wrap svg {
          color: #57534e;
          width: 2rem;
          height: 2rem;
        }

        .empty-state h3 {
          font-family: 'DM Serif Display', serif;
          font-size: 1.375rem;
          font-weight: 400;
          color: #e7e5e4;
        }

        .empty-state p {
          color: #78716c;
          font-size: 0.9375rem;
          margin-top: 0.5rem;
          max-width: 38ch;
          margin-left: auto;
          margin-right: auto;
        }

        /* Pagination */
        .pagination-nav {
          margin-top: 2.5rem;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.75rem;
        }

        .page-btn {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          color: #a8a29e;
          font-family: 'Outfit', sans-serif;
          font-size: 0.875rem;
          font-weight: 500;
          padding: 0.5rem 1.25rem;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s, color 0.2s;
        }

        .page-btn:hover:not(:disabled) {
          background: rgba(217,119,6,0.12);
          border-color: rgba(217,119,6,0.4);
          color: #d97706;
        }

        .page-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .page-info {
          color: #78716c;
          font-size: 0.875rem;
          padding: 0 0.5rem;
        }
      `}</style>

      <div className="listings-root">
        {/* Hero / Header */}
        <header className="listings-hero">
          <div className="listings-hero-inner">
            <h1>
              Find Your <span>Next Home</span>
            </h1>
            <p>Browse available properties and find the perfect place for you.</p>

            {/* Search and Filters */}
            <search aria-label="Search and filter properties">
              <div className="search-row">
                <div className="search-input-wrap">
                  <Search className="search-icon" aria-hidden="true" />
                  <input
                    type="text"
                    className="dark-input dark-input-padded"
                    placeholder="Search by name, city, or location..."
                    aria-label="Search properties by name, city, or location"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                  />
                </div>
                <select
                  className="dark-select"
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}
                  aria-label="Filter by property type"
                >
                  {propertyTypes.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  className="dark-input"
                  style={{ minWidth: '10rem' }}
                  placeholder="City"
                  aria-label="Filter by city"
                  value={filters.city}
                  onChange={(e) => setFilters({ ...filters, city: e.target.value, page: 1 })}
                />
              </div>
            </search>
          </div>
        </header>

        {/* Listings */}
        <main aria-label="Property listings" className="listings-main">
          {isLoading ? (
            <div className="listings-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton-card" aria-hidden="true">
                  <div className="skeleton-img" />
                  <div className="skeleton-body">
                    <div className="skeleton-line" style={{ width: '75%' }} />
                    <div className="skeleton-line" style={{ width: '50%' }} />
                    <div className="skeleton-line" style={{ width: '65%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon-wrap">
                <Building2 aria-hidden="true" />
              </div>
              <h3>No properties found</h3>
              <p>Try adjusting your search or filters to find what you&apos;re looking for.</p>
            </div>
          ) : (
            <>
              <p className="count-line">
                Showing {listings.length} of {pagination?.total || 0} properties
              </p>

              <div role="list" className="listings-grid">
                {listings.map((property: any) => (
                  <Link
                    key={property._id}
                    to={`/listings/${property._id}`}
                    role="listitem"
                    className="property-link"
                    aria-label={`View details for ${property.name} in ${property.address?.city}`}
                  >
                    <div className="property-card">
                      {/* Image */}
                      <div className="card-img-wrap">
                        <img
                          src={
                            property.images?.[0] ||
                            'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=250&fit=crop'
                          }
                          alt={property.name}
                          className="card-img"
                        />
                        <span className="type-badge">{property.type}</span>
                      </div>

                      {/* Body */}
                      <div className="card-body">
                        <h3 className="card-title">{property.name}</h3>
                        <div className="card-address">
                          <MapPin size={13} aria-hidden="true" />
                          {property.address.street}, {property.address.city}
                        </div>

                        {property.amenities?.length > 0 && (
                          <div className="amenities-row">
                            {property.amenities.slice(0, 3).map((amenity: string) => (
                              <span key={amenity} className="amenity-badge">
                                {amenity}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="card-footer">
                          <div>
                            <div className="price-label">Starting from</div>
                            <div className="price-value">
                              {property.priceRange?.minPrice?.toLocaleString() || '---'} ETB
                            </div>
                          </div>
                          <div>
                            <div className="units-label">Available</div>
                            <div className="units-value">{property.availableUnits || 0} units</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <nav aria-label="Pagination" className="pagination-nav">
                  <button
                    className="page-btn"
                    disabled={filters.page === 1}
                    aria-label="Go to previous page"
                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                  >
                    Previous
                  </button>
                  <span aria-live="polite" className="page-info">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    className="page-btn"
                    disabled={filters.page === pagination.pages}
                    aria-label="Go to next page"
                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                  >
                    Next
                  </button>
                </nav>
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
}
