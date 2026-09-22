import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ListDetail from './pages/ListDetail';
import NewList from './pages/NewList';
import NewSighting from './pages/NewSighting';
import Help from './pages/Help';
import Settings from './pages/Settings';
import Leaderboard from './pages/Leaderboard';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/lista/:listId" element={<ListDetail />} />
        <Route path="/ny-lista" element={<NewList />} />
        <Route path="/nytt-kryss" element={<NewSighting />} />
        <Route path="/topplista" element={<Leaderboard />} />
        <Route path="/hjalp" element={<Help />} />
        <Route path="/installningar" element={<Settings />} />
      </Routes>
    </Layout>
  );
}
