
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import Dashboard from './pages/Dashboard';
import MinhasObras from './pages/MinhasObras';
import Orcamentos from './pages/Orcamentos';
import Cronogramas from './pages/Cronogramas';
import AgenteIA from './pages/AgenteIA';

import './App.css';

function RotaProtegida({ children }) {
  const token = localStorage.getItem('token');

  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/dashboard" element={
          <RotaProtegida><Dashboard /></RotaProtegida>
        } />

        <Route path="/obras" element={
          <RotaProtegida><MinhasObras /></RotaProtegida>
        } />

        <Route path="/orcamentos" element={
          <RotaProtegida><Orcamentos /></RotaProtegida>
        } />

        <Route path="/cronogramas" element={
          <RotaProtegida><Cronogramas /></RotaProtegida>
        } />

        <Route path="/agente" element={
          <RotaProtegida><AgenteIA /></RotaProtegida>
        } />
      </Routes>
    </BrowserRouter>
  );
}
