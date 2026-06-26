import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Landing       from "./pages/Landing";
import Login         from "./pages/Login";
import Signup        from "./pages/Signup";
import Storefront    from "./pages/Storefront";

import Dashboard     from "./pages/fundi/Dashboard";
import Jobs          from "./pages/fundi/Jobs";
import Products      from "./pages/fundi/Products";
import Orders        from "./pages/fundi/Orders";
import Clients       from "./pages/fundi/Clients";
import Materials     from "./pages/fundi/Materials";
import Stats         from "./pages/fundi/Stats";
import StorefrontEditor from "./pages/fundi/StorefrontEditor";
import Chat          from "./pages/fundi/Chat";
import Billing       from "./pages/fundi/Billing";
import Settings      from "./pages/fundi/Settings";
import Support       from "./pages/fundi/Support";

import AdminOverview from "./pages/admin/AdminOverview";
import AdminFundis   from "./pages/admin/AdminFundis";
import AdminOrders   from "./pages/admin/AdminOrders";
import AdminChat     from "./pages/admin/AdminChat";
import AdminSupport  from "./pages/admin/AdminSupport";

const F = (role, El) => <ProtectedRoute role={role}><El/></ProtectedRoute>;

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/"            element={<Landing/>}/>
          <Route path="/login"       element={<Login/>}/>
          <Route path="/signup"      element={<Signup/>}/>
          <Route path="/s/:slug"     element={<Storefront/>}/>

          {/* Fundi */}
          <Route path="/app"              element={F("fundi", Dashboard)}/>
          <Route path="/app/jobs"         element={F("fundi", Jobs)}/>
          <Route path="/app/products"     element={F("fundi", Products)}/>
          <Route path="/app/orders"       element={F("fundi", Orders)}/>
          <Route path="/app/clients"      element={F("fundi", Clients)}/>
          <Route path="/app/materials"    element={F("fundi", Materials)}/>
          <Route path="/app/stats"        element={F("fundi", Stats)}/>
          <Route path="/app/storefront"   element={F("fundi", StorefrontEditor)}/>
          <Route path="/app/chat"         element={F("fundi", Chat)}/>
          <Route path="/app/billing"      element={F("fundi", Billing)}/>
          <Route path="/app/settings"     element={F("fundi", Settings)}/>
          <Route path="/app/support"      element={F("fundi", Support)}/>

          {/* Admin */}
          <Route path="/admin"            element={F("admin", AdminOverview)}/>
          <Route path="/admin/fundis"     element={F("admin", AdminFundis)}/>
          <Route path="/admin/orders"     element={F("admin", AdminOrders)}/>
          <Route path="/admin/chat"       element={F("admin", AdminChat)}/>
          <Route path="/admin/support"    element={F("admin", AdminSupport)}/>

          <Route path="*" element={<Landing/>}/>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
