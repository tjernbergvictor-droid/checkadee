import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ListDetail from './pages/ListDetail';
import NewList from './pages/NewList';
import Help from './pages/Help';
import Settings from './pages/Settings';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/lista/:listId" element={<ListDetail />} />
        <Route path="/ny-lista" element={<NewList />} />
        <Route path="/hjalp" element={<Help />} />
        <Route path="/installningar" element={<Settings />} />
      </Routes>
    </Layout>
  );
}
