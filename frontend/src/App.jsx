import { Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import RequireAuth from './components/RequireAuth'
import SessionWatcher from './components/SessionWatcher'
import Conversation from './pages/Conversation'
import EditPet from './pages/EditPet'
import Favorites from './pages/Favorites'
import Home from './pages/Home'
import Login from './pages/Login'
import Messages from './pages/Messages'
import MyPets from './pages/MyPets'
import MyRequests from './pages/MyRequests'
import NewPet from './pages/NewPet'
import NotFound from './pages/NotFound'
import PetDetail from './pages/PetDetail'
import Profile from './pages/Profile'
import './App.css'

export default function App() {
  return (
    <>
      <SessionWatcher />
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Home />} />
          <Route path="pets/:id" element={<PetDetail />} />
          <Route path="favoritos" element={<Favorites />} />
          <Route path="mensagens" element={<Messages />} />
          <Route path="mensagens/:id" element={<RequireAuth><Conversation /></RequireAuth>} />
          <Route path="perfil" element={<Profile />} />
          <Route path="anunciar" element={<RequireAuth><NewPet /></RequireAuth>} />
          <Route path="meus-anuncios" element={<RequireAuth><MyPets /></RequireAuth>} />
          <Route path="meus-anuncios/:id/editar" element={<RequireAuth><EditPet /></RequireAuth>} />
          <Route path="minhas-solicitacoes" element={<RequireAuth><MyRequests /></RequireAuth>} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="entrar" element={<Login key="login" mode="login" />} />
        <Route path="cadastro" element={<Login key="register" mode="register" />} />
      </Routes>
    </>
  )
}
