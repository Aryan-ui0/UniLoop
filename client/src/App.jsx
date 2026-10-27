import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ItemDetail from "./pages/ItemDetail.jsx";
import MyListings from "./pages/MyListings.jsx";
import MyRequests from "./pages/MyRequests.jsx";
import NotFound from "./pages/NotFound.jsx";

export default function App() {
    return (
        <>
            <Navbar />
            <main>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/items/:id" element={<ItemDetail />} />

                    {/* Only for logged-in students */}
                    <Route element={<ProtectedRoute />}>
                        <Route path="/my-listings" element={<MyListings />} />
                        <Route path="/my-requests" element={<MyRequests />} />
                    </Route>

                    <Route path="*" element={<NotFound />} />
                </Routes>
            </main>
            <Footer />
        </>
    );
}
