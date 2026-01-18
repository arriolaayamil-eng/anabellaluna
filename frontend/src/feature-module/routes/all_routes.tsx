export const all_routes: any = {
  //Auth routes
  signup:'/signup',
  signin:'/signin',
  forgotPassword:'/forgot-password',
  resetPassword:'/reset-password',
  profile:'/profile',
 
 

  //Home routes
  index: "/index",

  //Listing routes
  buyPropertyGrid:'/buy-property-grid',
  buyPropertyList:'/buy-property-list',
  buyGridMap:'/buy-grid-map',
  buyListMap:'/buy-list-map',
  buyPropertyGridSidebar:'/buy-property-grid-sidebar',
  buyPropertyListSidebar:'/buy-property-list-sidebar',
  buyDetails:'/buy/:slug',
  buyDetailsPath:(slug: string) => `/buy/${slug}`,
  rentPropertyGrid:'/rent-property-grid',
  rentPropertyList:'/rent-property-list',
  rentGridMap:'/rent-grid-map',
  rentListMap:'/rent-list-map',
  rentPropertyGridSidebar:'/rent-property-grid-sidebar',
  rentPropertyListSidebar:'/rent-property-list-sidebar',
  rentDetails:'/rent/:slug',
  rentDetailsPath:(slug: string) => `/rent/${slug}`,
  rentBooking:'/rent-booking',
  rentalOrderDetails:'/rental-order-details',
  rentalOrderConfirmation:'/rental-order-confirmation',

  //Agent routes
  agentGrid:'/agent-grid',
  agentes:'/agent-grid',
  agentDetails:'/agent-details',
  
  //Agency routes
  agencyGrid:'/agency-grid',
  agencyDetails:'/agency-details',

  //Pages routes
  aboutUs:'/about-us',
   invoiceDetails:'/invoice-details',
  contactUs:'/contact-us',
  error404:'/error-404',
  error500:'/error-500',
  pricing:'/pricing',
  faq:'/faq',
  gallery:'/gallery',
  ourTeam:'/our-team',
  testimonial:'/testimonial',
  termsCondition:'/terms-condition',
  privacyPolicy:'/privacy-policy',
  maintenance:'/maintenance',
  comingSoon:'/coming-soon',
  cart:'/cart',
  notification:'/notification',
  addpropertybuy:'/add-property-buy',
  wishlist:'/wishlist',
  buyDetailsSchedule:'/buy-details-schedule',
  checkout:'/checkout',

  //Blogs routes
  blogList:'/blog-list',
  blogGrid:'/blog-grid',
  blogDetails:'/blog/:slug',
  blogDetailsPath:(slug: string) => `/blog/${slug}`,

};
