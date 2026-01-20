import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './hooks/useTheme';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import DocsPage from './pages/DocsPage';
import ApiPage from './pages/ApiPage';
import ExamplesPage from './pages/ExamplesPage';
import PluginsPage from './pages/PluginsPage';
import PlaygroundPage from './pages/PlaygroundPage';

function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="docs/*" element={<DocsPage />} />
          <Route path="api/*" element={<ApiPage />} />
          <Route path="examples/*" element={<ExamplesPage />} />
          <Route path="plugins/*" element={<PluginsPage />} />
          <Route path="playground" element={<PlaygroundPage />} />
        </Route>
      </Routes>
    </ThemeProvider>
  );
}

export default App;
