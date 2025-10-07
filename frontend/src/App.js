import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import VerifyCertificate from './pages/VerifyCertificate';
import IssueCertificate from './pages/IssueCertificate';
import UploadCertificate from './pages/UploadCertificate';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';

// Context
import { AuthProvider } from './contexts/AuthContext';
import { Web3Provider } from './context/Web3Context';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 600,
    },
    h2: {
      fontWeight: 600,
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Web3Provider>
        <AuthProvider>
          <Router>
            <div className="App" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
              <Navbar />
              <main style={{ flex: 1, paddingTop: '64px' }}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/verify" element={<VerifyCertificate />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/issue" element={
                    <ProtectedRoute requiredRole="institution">
                      <IssueCertificate />
                    </ProtectedRoute>
                  } />
                  <Route path="/upload" element={
                    <ProtectedRoute requiredRole="institution">
                      <UploadCertificate />
                    </ProtectedRoute>
                  } />
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } />
                </Routes>
              </main>
              <Footer />
              <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
              />
            </div>
          </Router>
        </AuthProvider>
      </Web3Provider>
    </ThemeProvider>
  );
}

export default App;