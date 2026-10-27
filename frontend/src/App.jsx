import { Route, Routes } from 'react-router-dom'
import { Heart, MessageCircle } from 'lucide-react'
import AppShell from './components/AppShell'
import RequireAuth from './components/RequireAuth'
import ComingSoon from './pages/ComingSoon'
import Home from './pages/Home'
import Login from './pages/Login'
import MyPets from './pages/MyPets'
import NewPet from './pages/NewPet'
import NotFound from './pages/NotFound'
import PetDetail from './pages/PetDetail'
import Profile from './pages/Profile'
import './App.css'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Home />} />
        <Route path="pets/:id" element={<PetDetail />} />
        <Route path="favoritos" element={<ComingSoon icon={Heart} title="Favoritos">Aqui vão ficar os pets que você salvar com o coração.</ComingSoon>} />
        <Route path="mensagens" element={<ComingSoon icon={MessageCircle} title="Mensagens">Aqui você vai conversar com quem anunciou o pet sobre o seu pedido.</ComingSoon>} />
        <Route path="perfil" element={<Profile />} />
        <Route path="anunciar" element={<RequireAuth><NewPet /></RequireAuth>} />
        <Route path="meus-anuncios" element={<RequireAuth><MyPets /></RequireAuth>} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="entrar" element={<Login key="login" mode="login" />} />
      <Route path="cadastro" element={<Login key="register" mode="register" />} />
    </Routes>
  )
}
