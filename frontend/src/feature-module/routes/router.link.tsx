import Index from "../components/home/index";
import { all_routes } from "./all_routes";
import { Navigate, Route } from "react-router";
import BuyGrid from "../components/listing-modules/buy-property/buy-grid/buyGrid";
import BuyList from "../components/listing-modules/buy-property/buy-list/buyList";
import BuyGridMap from "../components/listing-modules/buy-property/buy-grid-map/buyGridMap";
import BuyListMap from "../components/listing-modules/buy-property/buy-list-map/buyListMap";
import BuyGridSidebar from "../components/listing-modules/buy-property/buy-grid-sidebar/buyGridSidebar";
import BuyListSidebar from "../components/listing-modules/buy-property/buy-list-sidebar/buyListSidebar";
import BuyDetails from "../components/listing-modules/buy-property/buy-details/buyDetails";
import RentGrid from "../components/listing-modules/rent-property/rent-grid/rentGrid";
import RentList from "../components/listing-modules/rent-property/rent-list/rentList";
import RentGridMap from "../components/listing-modules/rent-property/rent-grid-map/rentGridMap";
import RentListMap from "../components/listing-modules/rent-property/rent-list-map/rentListMap";
import RentGridSidebar from "../components/listing-modules/rent-property/rent-grid-sidebar/rentGridSidebar";
import RentListSidebar from "../components/listing-modules/rent-property/rent-list-sidebar/rentListSidebar";
import Rentdetails from "../components/listing-modules/rent-property/rent-details/rentdetails";
import RentalBooking from "../components/listing-modules/rent-property/rent-booking/rentalBooking";
import RentOrderDetails from "../components/listing-modules/rent-property/rent-order-details/rentOrderDetails";
import RentalOrderConfirmation from "../components/listing-modules/rent-property/rental-order-confirmation/rentalOrderConfirmation";
import AgentGrid from "../components/listing-modules/agent-module/agent-grid/agentGrid";
import AgentDetails from "../components/listing-modules/agent-module/agent-details/agentDetails";
import AgencyGrid from "../components/listing-modules/agency-module/agency-grid/agencyGrid";
import AgencyDetails from "../components/listing-modules/agency-module/agency-details/agencyDetails";
import AddProperyBuy from "../components/add-property-buy/addProperyBuy";
import Cart from "../components/cart/cart";
import Notification from "../components/notification/notification";
import BlogList from "../components/blog-modules/blog-list/blogList";
import BlogGrid from "../components/blog-modules/blog-grid/blogGrid";
import BlogDetails from "../components/blog-modules/blog-details/blogDetails";
import AboutUs from "../components/pages-modules/about-us/aboutUs";
import SignUp from "../components/auth-modules/sign-up/signUp";
import SignIn from "../components/auth-modules/sign-in/signIn";
import ForgorPassword from "../components/auth-modules/forgort-password/forgorPassword";
import ResetPassword from "../components/auth-modules/reset-password/resetPassword";
import InvoiceDetails from "../components/pages-modules/invoice-details/invoiceDetails";
import ContactUs from "../components/pages-modules/contact-us/contactUs";
import Wishlist from "../components/pages-modules/wishlist/wishlist";
import Error404 from "../components/pages-modules/error-404/error404";
import Error500 from "../components/pages-modules/error-500/error500";
import Pricing from "../components/pages-modules/pricing/pricing";
import Faq from "../components/pages-modules/faq/faq";
import Gallery from "../components/pages-modules/gallery/gallery";
import OurTeam from "../components/pages-modules/our-team/ourTeam";
import Testimonial from "../components/pages-modules/testimonial/testimonial";
import TermsCondition from "../components/pages-modules/terms-condition/termsCondition";
import PrivacyPolicy from "../components/pages-modules/privacy-policy/privacyPolicy";
import Maintenance from "../components/pages-modules/maintenance/maintenance";
import ComingSoon from "../components/pages-modules/coming-soon/comingSoon";
import Checkout from "../components/pages-modules/checkout/checkout";
import Profile from "../components/pages-modules/profile/profile";
import UserCreateForm from "../../components/UserCreateForm";
import RequireAuth from "../../core/auth/RequireAuth";

const routes = all_routes;

export const publicRoutes = [
  {
    path: "/",
    name: "Root",
    element: <Navigate to={routes.index} />,
    route: Route,
  },
  {
    path: "*", // ✅ Catch-all route for 404s
    element: <Navigate to={routes.index} />,
    route: Route,
  },
  {
    path: routes.index,
    element: <Index />,
    meta_title:"Inicio",
    route: Route,
  },
  {
    path: "/create-user",
    element: <UserCreateForm />,
    meta_title: "Crear Usuario CRM",
    route: Route,
  },
  {
    path: routes.buyPropertyGrid,
    element: <BuyGrid />,
            meta_title:"Buy Grid",
    route: Route,
  },
  {
    path: routes.buyPropertyList,
    element: <BuyList />,
            meta_title:"Buy List",
    route: Route,
  },
  {
    path: routes.buyGridMap,
    element: <BuyGridMap />,
            meta_title:"Buy Grid Map",
    route: Route,
  },
  {
    path: routes.buyListMap,
    element: <BuyListMap />,
            meta_title:"Buy List Map",
    route: Route,
  },
  {
    path: routes.buyPropertyGridSidebar,
    element: <BuyGridSidebar />,
            meta_title:"Buy Grid Sidebar",
    route: Route,
  },
  {
    path: routes.buyPropertyListSidebar,
    element: <BuyListSidebar />,
            meta_title:"Buy List Sidebar",
    route: Route,
  },
  {
    path: routes.buyDetails,
    element: <BuyDetails />,
            meta_title:"Buy Details",
    route: Route,
  },
  {
    path: routes.rentPropertyGrid,
    element: <RentGrid />,
    meta_title:"Rent Grid",
    route: Route,
  },
  {
    path: routes.rentPropertyList,
    element: <RentList />,
    meta_title:"Rent List",
    route: Route,
  },
  {
    path: routes.rentGridMap,
    element: <RentGridMap />,
    meta_title:"Rent Grid Map",
    route: Route,
  },
  {
    path: routes.rentListMap,
    element: <RentListMap />,
    meta_title:"Rent List Map",
    route: Route,
  },
  {
    path: routes.rentPropertyGridSidebar,
    element: <RentGridSidebar />,
    meta_title:"Rent Grid Sidebar",
    route: Route,
  },
  {
    path: routes.rentPropertyListSidebar,
    element: <RentListSidebar />,
    meta_title:"Rent List Sidebar",
    route: Route,
  },
  {
    path: routes.rentDetails,
    element: <Rentdetails />,
    meta_title:"Rent Details",
    route: Route,
  },
  {
    path: routes.rentBooking,
    element: (
      <RequireAuth>
        <RentalBooking />
      </RequireAuth>
    ),
    meta_title:"Rental Booking",
    route: Route,
  },
  {
    path: routes.rentalOrderDetails,
    element: (
      <RequireAuth>
        <RentOrderDetails />
      </RequireAuth>
    ),
    meta_title:"Rental Order Details",
    route: Route,
  },
  {
    path: routes.rentalOrderConfirmation,
    element: (
      <RequireAuth>
        <RentalOrderConfirmation />
      </RequireAuth>
    ),
    meta_title:"Rental Order Details",
    route: Route,
  },
  {
    path: routes.agentGrid,
    element: <AgentGrid />,
       meta_title:"Agent Grid",
    route: Route,
  },
  {
    path: routes.agentDetails,
    element: <AgentDetails />,
     meta_title:"Agent Details",
    route: Route,
  },
  {
    path: routes.agencyGrid,
    element: <AgencyGrid />,
       meta_title:"Agency Grid",
    route: Route,
  },
  {
    path: routes.agencyDetails,
    element: <AgencyDetails />,
          meta_title:"Agency Details",
    route: Route,
  },
  {
    path: routes.addpropertybuy,
    element: <AddProperyBuy />,
     meta_title:"Add Property Buy",
    route: Route,
  },
  {
    path: routes.cart,
    element: (
      <RequireAuth>
        <Cart />
      </RequireAuth>
    ),
       meta_title:"Cart",
    route: Route,
  },
  {
    path: routes.notification,
    element: <Notification />,
     meta_title:"Notification",
    route: Route,
  },
  {
    path: routes.blogList,
    element: <BlogList />,
     meta_title:"Blog List",
    route: Route,
  },
  {
    path: routes.blogGrid,
    element: <BlogGrid />,
         meta_title:"Blog Grid",
    route: Route,
  },
  {
    path: routes.blogDetails,
    element: <BlogDetails />,
         meta_title:"Blog Details",
    route: Route,
  },
  {
    path: routes.aboutUs,
    element: <AboutUs />,
         meta_title:"About Us",
    route: Route,
  },
  {
    path: routes.invoiceDetails,
    element: <InvoiceDetails />,
     meta_title:"Invoice",
    route: Route,
  },
  {
    path: routes.contactUs,
    element: <ContactUs />,
     meta_title:"Contact Us",
    route: Route,
  },
  {
    path: routes.wishlist,
    element: (
      <RequireAuth>
        <Wishlist />
      </RequireAuth>
    ),
      meta_title:"Wishlist",
    route: Route,
  },
  {
    path: routes.pricing,
    element: <Pricing />,
      meta_title:"Pricing",
    route: Route,
  },
  {
    path: routes.faq,
    element: <Faq />,
     meta_title:"Faq",
    route: Route,
  },
  {
    path: routes.gallery,
    element: <Gallery />,
     meta_title:"Gallery",
    route: Route,
  },
  {
    path: routes.ourTeam,
    element: <OurTeam />,
       meta_title:"Team",
    route: Route,
  },
  {
    path: routes.testimonial,
    element: <Testimonial />,
      meta_title:"Testimonial",
    route: Route,
  },
  {
    path: routes.termsCondition,
    element: <TermsCondition />,
       meta_title:"Terms & Condition",
    route: Route,
  },
  {
    path: routes.privacyPolicy,
    element: <PrivacyPolicy />,
      meta_title:"Privacy Policy",
    route: Route,
  },
  {
    path: routes.checkout,
    element: (
      <RequireAuth>
        <Checkout />
      </RequireAuth>
    ),
       meta_title:"Checkout",
    route: Route,
  },
  {
    path: routes.profile,
    element: (
      <RequireAuth>
        <Profile />
      </RequireAuth>
    ),
    meta_title:"Mi Perfil",
    route: Route,
  },
];
export const authRoutes = [
  {
    path: routes.signup,
    element: <SignUp />,
     meta_title:"Sign Up",
    route: Route,
  },
  {
    path: routes.signin,
    element: <SignIn />,
      meta_title:"Sign In",
    route: Route,
  },
  {
    path: routes.forgotPassword,
    element: <ForgorPassword />,
          meta_title:"Forgot Password",
    route: Route,
  },
  {
    path: routes.resetPassword,
    element: <ResetPassword />,
     meta_title:"Reset Password",
    route: Route,
  },
  {
    path: routes.error404,
    element: <Error404 />,
         meta_title:"Error 404",
    route: Route,
  },
  {
    path: routes.error500,
    element: <Error500 />,
          meta_title:"Error 500",
    route: Route,
  },
  {
    path: routes.maintenance,
    element: <Maintenance />,
            meta_title:"Maintenance",
    route: Route,
  },
  {
    path: routes.comingSoon,
    element: <ComingSoon />,
    meta_title:"Coming Soon",
    route: Route,
  },
];
