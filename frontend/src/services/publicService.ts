import { api } from '../config/api';

export interface PropertyCard {
  id: string;
  slug: string;
  title: string;
  type?: string;
  operation?: 'rent' | 'buy' | '';
  featured?: boolean;
  category?: string;
  propertyCode?: string;
  offerPrice?: number;
  pricePerM2?: number;
  structureType?: string;
  extraFeatures?: {
    balcony?: string;
    floor?: string;
    wardrobe?: string;
    tv?: string;
    waterPurifier?: string;
    microwave?: string;
    ac?: string;
    fridge?: string;
    curtains?: string;
    garageSize?: string;
    availableFrom?: string;
    yearBuilt?: string;
    heating?: string;
    hotWater?: string;
    stove?: string;
  };
  media?: { coverUrl?: string };
  location?: {
    addressLine?: string;
    neighborhood?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    country?: string;
    lat?: number | null;
    lng?: number | null;
  };
  price?: { amount?: number; currency?: string; unit?: string };
  features?: {
    beds?: number;
    baths?: number;
    areaSqFt?: number;
    coveredAreaSqFt?: number;
    rooms?: number;
    parking?: number;
    parkingType?: string;
  };
  agent?: {
    id: string;
    name: string;
    avatarUrl?: string;
    email?: string;
    phone?: string;
    cargo?: string;
    bio?: string;
    especialidad?: string;
    redesSociales?: {
      linkedin?: string;
      instagram?: string;
      facebook?: string;
    };
  };
}

export interface PropertyDetail extends PropertyCard {
  description?: string;
  galleryUrls?: string[];
  floorPlanUrls?: string[];
  videoUrls?: string[];
  amenities?: string[];
  status?: string;
  ageYears?: number;
  trending?: boolean;
  visitCount?: number;
  funnelSettings?: import('../feature-module/components/listing-modules/common/funnelSettings').FunnelSettings | null;
}

export interface BookingContact {
  fullName: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface EnquiryRequest {
  propertyId?: string;
  propertySlug?: string;
  fullName: string;
  email?: string;
  phone?: string;
  message?: string;
}

export interface VisitRequest extends EnquiryRequest {
  start: string;
  end?: string;
}

export const publicService = {
  getProperties: async (operation?: 'rent' | 'buy', filters?: {
    city?: string;
    beds?: number;
    baths?: number;
    minPrice?: number;
    maxPrice?: number;
    type?: string;
    search?: string;
    sort?: 'price_asc' | 'price_desc';
    featured?: boolean;
  }) => {
    const params = new URLSearchParams();
    if (operation) params.set('operation', operation);
    if (filters) {
      if (filters.city) params.set('city', filters.city);
      if (filters.beds) params.set('beds', String(filters.beds));
      if (filters.baths) params.set('baths', String(filters.baths));
      if (filters.minPrice) params.set('minPrice', String(filters.minPrice));
      if (filters.maxPrice) params.set('maxPrice', String(filters.maxPrice));
      if (filters.type) params.set('type', filters.type);
      if (filters.search) params.set('search', filters.search);
      if (filters.sort) params.set('sort', filters.sort);
      if (filters.featured) params.set('featured', 'true');
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get(`/public/properties${query}`) as Promise<{ items: PropertyCard[] }>;
  },

  getPropertyBySlug: async (slug: string, token?: string) => {
    const qs = token ? `?token=${encodeURIComponent(token)}` : '';
    return api.get(`/public/properties/${encodeURIComponent(slug)}${qs}`) as Promise<{ item: PropertyDetail }>;
  },

  createBookingRequest: async (contact: BookingContact) => {
    return api.post('/public/bookings', { contact }) as Promise<{ booking: any }>;
  },

  createEnquiry: async (payload: EnquiryRequest) => {
    return api.post('/public/enquiries', payload) as Promise<{ ok: boolean; enquiry: any }>;
  },

  scheduleVisit: async (payload: VisitRequest) => {
    return api.post('/public/visits', payload) as Promise<{ ok: boolean; cita: any; activity: any }>;
  },

  getCart: async () => {
    return api.get('/public/cart') as Promise<{ items: any[] }>;
  },

  addToCart: async (payload: {
    propertyId?: string;
    propertySlug?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: number;
    notes?: string;
  }) => {
    return api.post('/public/cart/items', payload) as Promise<{ item: any }>;
  },

  clearCart: async () => {
    return api.delete('/public/cart') as Promise<{ ok: boolean }>;
  },

  getWishlist: async () => {
    return api.get('/public/wishlist') as Promise<{ items: any[] }>;
  },

  addToWishlist: async (payload: { propertyId?: string; propertySlug?: string }) => {
    return api.post('/public/wishlist', payload) as Promise<{ item: any }>;
  },

  removeWishlistItem: async (id: string) => {
    return api.delete(`/public/wishlist/${encodeURIComponent(id)}`) as Promise<{ ok: boolean }>;
  },

  getStats: async () => {
    return api.get('/public/stats') as Promise<{ properties: number; agents: number; sales: number; rentals: number }>;
  },

  getPropertyStats: async () => {
    return api.get('/public/property-stats') as Promise<{ cities: { name: string; count: number }[]; types: { name: string; count: number }[] }>;
  },

  getAgents: async () => {
    return api.get('/public/agents') as Promise<{ items: any[] }>;
  },

  getAgentById: async (id: string) => {
    return api.get(`/public/agents/${encodeURIComponent(id)}`) as Promise<{ agent: any; properties: PropertyCard[] }>;
  },

  removeCartItem: async (id: string) => {
    return api.delete(`/public/cart/items/${encodeURIComponent(id)}`) as Promise<{ ok: boolean }>;
  },

  updateCartItem: async (id: string, payload: { checkIn?: string; checkOut?: string; guests?: number; notes?: string }) => {
    return api.put(`/public/cart/items/${encodeURIComponent(id)}`, payload) as Promise<{ item: any }>;
  },

  getBookings: async () => {
    return api.get('/public/bookings') as Promise<{ items: any[] }>;
  },

  getBookingById: async (id: string) => {
    return api.get(`/public/bookings/${encodeURIComponent(id)}`) as Promise<{ item: any }>;
  },

  getBlogCategories: async () => {
    return api.get('/public/blog/categories') as Promise<{ items: any[] }>;
  },

  getBlogPosts: async (categorySlug?: string) => {
    const query = categorySlug ? `?category=${encodeURIComponent(categorySlug)}` : '';
    return api.get(`/public/blog/posts${query}`) as Promise<{ items: any[] }>;
  },

  getBlogPostBySlug: async (slug: string) => {
    return api.get(`/public/blog/posts/${encodeURIComponent(slug)}`) as Promise<{ item: any }>;
  },

  getTestimonials: async () => {
    return api.get('/public/testimonials') as Promise<{ items: { id: string; name: string; avatar: string; text: string; rating: number }[] }>;
  },

  getFaqs: async () => {
    return api.get('/public/faqs') as Promise<{ items: { id: string; question: string; answer: string; category: string }[] }>;
  },

  sendContactMessage: async (data: { nombre: string; email?: string; telefono?: string; asunto?: string; mensaje: string }) => {
    return api.post('/public/contact', data) as Promise<{ ok: boolean; id: string }>;
  },

  getGallery: async () => {
    return api.get('/public/gallery') as Promise<{ items: { id: string; url: string; title: string; slug: string }[] }>;
  },

  getSiteConfig: async () => {
    return api.get('/public/site-config') as Promise<{
      name: string; phone: string; email: string; address: string;
      whatsapp: string; socialMedia: Record<string, string>; logo: string;
    }>;
  },
};

export default publicService;
