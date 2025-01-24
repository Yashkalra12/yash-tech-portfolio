import { useState } from 'react'
import './App.css'
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
// import { Outlet } from 'react-router-dom'
import Navbar from './Components/Navbar'
import Home from './Pages/Home'


function App() {
  const Layout = () => {
  return (
    <div className='bg-[#05051b] text-white'>
      <Navbar />
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
        { path: "/", element: <Home /> },
      ],
    },
  ]);
  
  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App
