import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import PagePharmacien from './PagePharmacien.jsx'
import PageFiche from './PageFiche.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/pharmacien" element={<PagePharmacien />} />
        <Route path="/fiche/:id" element={<PageFiche />} />
        <Route path="*" element={<Navigate to="/pharmacien" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
