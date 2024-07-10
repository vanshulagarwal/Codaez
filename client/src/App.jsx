import './App.css'
import Auth from './Pages/Auth/Auth';
import Dashboard from "./Pages/Dashboard/Dashboard";
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom'
import Landing from './Pages/Landing/Landing';
import Leaderboard from './Pages/Leaderboard/Leaderboard';
import Profile from './Pages/Profile/Profile';
import Navbar from './Pages/Navbar/Navbar'
import Sidebar from './components/Sidebar/Sidebar';
import CompleteProfile from './components/Register/CompleteProfile';

const Layout = () => {
    return (
        <div className='app'>
            <Navbar />
            <Sidebar />
            <Outlet />
            {/* <Footer /> */}
        </div>
    )
}

const router = createBrowserRouter([
    {
        path: "/",
        element: <Layout />,
        children: [
            {
                path: "/home",
                element: <Landing />
            },
            {
                path: "/dashboard",
                element: <Dashboard />
            },
            {
                path: "/leaderboard",
                element: <Leaderboard />
            },
            {
                path: "/auth",
                element: <Auth />
            },
            {
                path: "/profile/:username",
                element: <Profile />
            },
            {
                path: "/completeprofile",
                element: <CompleteProfile />
            },
        ]
    },
])

function App() {

    return (
        <>
            <div>
                <RouterProvider router={router} />
            </div>
        </>
    )
}

export default App
