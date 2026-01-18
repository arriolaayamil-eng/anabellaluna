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
  };
  media?: { coverUrl?: string };
  location?: {
    addressLine?: string;
    neighborhood?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    country?: string;
  };
  price?: { amount?: number; currency?: string; unit?: string };
  features?: {
    beds?: number;
    baths?: number;
    areaSqFt?: number;
    coveredAreaSqFt?: number;
    rooms?: number;
    parking?: number;
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
  getProperties: async (operation?: 'rent' | 'buy') => {
    const query = operation ? `?operation=${operation}` : '';
    return api.get(`/public/properties${query}`) as Promise<{ items: PropertyCard[] }>;
  },

  getPropertyBySlug: async (slug: string) => {
    return api.get(`/public/properties/${encodeURIComponent(slug)}`) as Promise<{ item: PropertyDetail }>;
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
};

export default publicService;
