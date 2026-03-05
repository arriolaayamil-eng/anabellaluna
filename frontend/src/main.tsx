import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router'
import './i18n'
import ALLRoutes from './feature-module/routes/router'
import store from './core/redux/store'
import { base_path } from './environment'
import "../node_modules/bootstrap/dist/css/bootstrap.min.css";
import "../node_modules/bootstrap/dist/js/bootstrap.bundle.min.js";
import "../src/style/css/iconsax.css";
import "../src/style/css/feather.css";
import "../node_modules/@tabler/icons-webfont/dist/tabler-icons.css";
import "../node_modules/@fortawesome/fontawesome-free/css/fontawesome.min.css";
import "../node_modules/@fortawesome/fontawesome-free/css/all.min.css";
import "../src/style/icon/material-icon/material-icon.css";
import AOS from 'aos';
import '../node_modules/aos/dist/aos.css';
import "../src/index.scss"; 
import DynamicTitle from './feature-module/routes/dynamicTitle.js'

// Initialize AOS once when app loads
AOS.init({
  duration: 1000,
  once: true,
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter basename={base_path}>
        <DynamicTitle />
        <ALLRoutes />
      </BrowserRouter>
    </Provider>
  </StrictMode>,
)
