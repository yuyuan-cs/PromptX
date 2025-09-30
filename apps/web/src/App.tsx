import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '~/components/Layout'
import HomePage from '~/pages/HomePage'
import RolesPage from '~/pages/RolesPage'
import ToolsPage from '~/pages/ToolsPage'
import ProjectsPage from '~/pages/ProjectsPage'
import MemoryPage from '~/pages/MemoryPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/home" replace />} />
        <Route path="home" element={<HomePage />} />
        <Route path="roles" element={<RolesPage />} />
        <Route path="tools" element={<ToolsPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="memory" element={<MemoryPage />} />
      </Route>
    </Routes>
  )
}

export default App