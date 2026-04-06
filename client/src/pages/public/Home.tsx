import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  Users,
  CreditCard,
  Wrench,
  CheckCircle,
  ArrowRight,
  MapPin,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { listingAPI } from '../../services/api';

export default function Home() {
  const { data: featuredData } = useQuery({
    queryKey: ['featured-listings'],
    queryFn: () => listingAPI.getFeatured(),
  });

  const features = [
    {
      icon: Building2,
      title: 'Property Management',
      description: 'Manage multiple properties with floor-based pricing and unit tracking.',
    },
    {
      icon: Users,
      title: 'Tenant Management',
      description: 'Keep track of all your tenants, leases, and important documents.',
    },
    {
      icon: CreditCard,
      title: 'Payment Collection',
      description: 'Collect rent payments online with Chapa integration.',
    },
    {
      icon: Wrench,
      title: 'Maintenance Tracking',
      description: 'Handle maintenance requests efficiently with a complete workflow.',
    },
  ];

  const benefits = [
    'Floor-based dynamic pricing',
    'Waiting list management',
    'Automated payment reminders',
    'Real-time notifications',
    'Document management',
    'Analytics dashboard',
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
                Modern Property Management Made Simple
              </h1>
              <p className="mt-6 text-lg text-primary-100">
                Streamline your property management with our all-in-one platform. Manage tenants,
                collect payments, handle maintenance, and grow your business.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/register">
                  <Button size="lg" className="bg-white text-primary-600 hover:bg-gray-100">
                    Get Started Free
                  </Button>
                </Link>
                <Link to="/listings">
                  <Button size="lg" variant="ghost" className="text-white border border-white hover:bg-white/10">
                    Browse Listings
                  </Button>
                </Link>
              </div>
            </div>
            <div className="hidden lg:block">
              <img
                src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&h=400&fit=crop"
                alt="Modern apartment building"
                className="rounded-xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Everything You Need</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Our platform provides all the tools you need to manage your properties efficiently.
            </p>
          </div>

          <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <Card key={feature.title} className="text-center">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-lg bg-primary-100 text-primary-600 mb-4">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-gray-600">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                Why Property Owners Love Enderase
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Join thousands of property owners who have simplified their operations with our
                comprehensive management solution.
              </p>
              <ul className="mt-8 space-y-4">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link to="/register">
                  <Button>
                    Start Managing Now
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <img
                src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=300&h=200&fit=crop"
                alt="Modern interior"
                className="rounded-lg shadow-lg"
              />
              <img
                src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=300&h=200&fit=crop"
                alt="Apartment"
                className="rounded-lg shadow-lg mt-8"
              />
              <img
                src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=300&h=200&fit=crop"
                alt="Living room"
                className="rounded-lg shadow-lg"
              />
              <img
                src="https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=300&h=200&fit=crop"
                alt="Building"
                className="rounded-lg shadow-lg mt-8"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      {featuredData?.data?.data && featuredData.data.data.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-gray-900">Featured Properties</h2>
              <Link to="/listings" className="text-primary-600 hover:text-primary-700 font-medium">
                View all listings
                <ArrowRight className="h-4 w-4 inline ml-1" />
              </Link>
            </div>

            <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredData.data.data.slice(0, 6).map((property: any) => (
                <Link key={property._id} to={`/listings/${property._id}`}>
                  <Card padding="none" className="overflow-hidden hover:shadow-lg transition-shadow">
                    <img
                      src={property.images?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=250&fit=crop'}
                      alt={property.name}
                      className="h-48 w-full object-cover"
                    />
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900">{property.name}</h3>
                      <div className="flex items-center text-gray-500 text-sm mt-1">
                        <MapPin className="h-4 w-4 mr-1" />
                        {property.address.city}, {property.address.state}
                      </div>
                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-primary-600 font-semibold">
                          {property.availableUnits || 0} units available
                        </span>
                        <span className="text-sm text-gray-500 capitalize">
                          {property.type}
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white">
            Ready to Transform Your Property Management?
          </h2>
          <p className="mt-4 text-lg text-primary-100">
            Join Enderase today and experience the easiest way to manage your properties.
          </p>
          <div className="mt-8">
            <Link to="/register">
              <Button size="lg" className="bg-white text-primary-600 hover:bg-gray-100">
                Get Started for Free
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
