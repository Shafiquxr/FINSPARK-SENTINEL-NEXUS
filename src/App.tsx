import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import IncidentDetail from './pages/IncidentDetail';
import Entities from './pages/Entities';
import EntityProfile from './pages/EntityProfile';
import Copilot from './pages/Copilot';
import { DataProvider } from './context/DataContext';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

export default function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <Layout>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/incidents" element={<Dashboard />} />
              <Route path="/incidents/:id" element={<IncidentDetail />} />
              <Route path="/entities" element={<Entities />} />
              <Route path="/entities/:id" element={<EntityProfile />} />
              <Route path="/copilot" element={<Copilot />} />
            </Routes>
          </ErrorBoundary>
        </Layout>
      </BrowserRouter>
    </DataProvider>
  );
}

