import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import "./App.css";
import "./styles/portfolio.css";
import Portfolio from "./Pages/Portfolio";
import Navbar from "./Components/Navbar";
import Home from "./Pages/Home";

/**
 * The 2021-inspired rebuild lives at `/`.
 *
 * The previous dark-themed portfolio is kept at `/legacy` while the new design
 * is iterated on — nothing is deleted, so the two can be compared side by side.
 */
function LegacyLayout() {
  return (
    <div className="bg-[#05051b] text-white">
      <Navbar />
      <Outlet />
    </div>
  );
}

const router = createBrowserRouter([
  { path: "/", element: <Portfolio /> },
  {
    path: "/legacy",
    element: <LegacyLayout />,
    children: [{ index: true, element: <Home /> }],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
