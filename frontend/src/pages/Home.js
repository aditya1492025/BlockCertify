import React from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip
} from '@mui/material';
import {
  Security,
  VerifiedUser,
  School,
  Speed,
  Assignment,
  Search
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Security sx={{ fontSize: 40 }} />,
      title: 'Blockchain Security',
      description: 'Immutable certificate storage with cryptographic verification'
    },
    {
      icon: <VerifiedUser sx={{ fontSize: 40 }} />,
      title: 'Instant Verification',
      description: 'Real-time certificate authentication with smart contracts'
    },
    {
      icon: <School sx={{ fontSize: 40 }} />,
      title: 'Multi-Institution',
      description: 'Support for universities, schools, and certification bodies'
    },
    {
      icon: <Speed sx={{ fontSize: 40 }} />,
      title: 'Fast & Efficient',
      description: 'Quick issuance and verification process'
    }
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          color: 'white',
          py: 8,
          mb: 6
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" component="h1" gutterBottom className="fade-in">
                BlockCertify
              </Typography>
              <Typography variant="h5" component="h2" gutterBottom className="fade-in">
                Decentralized Certificate Authentication Platform
              </Typography>
              <Typography variant="body1" sx={{ mb: 4, fontSize: '1.2rem' }} className="fade-in">
                Secure, transparent, and tamper-proof certificate verification 
                using blockchain technology. Transform your certificate management 
                into a trustworthy, efficient system.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  sx={{ 
                    bgcolor: 'white', 
                    color: 'primary.main',
                    '&:hover': { bgcolor: 'grey.100' }
                  }}
                  startIcon={<Search />}
                  onClick={() => navigate('/verify')}
                >
                  Verify Certificate
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  sx={{ 
                    borderColor: 'white', 
                    color: 'white',
                    '&:hover': { borderColor: 'grey.300', bgcolor: 'rgba(255,255,255,0.1)' }
                  }}
                  onClick={() => navigate('/register')}
                >
                  Get Started
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '300px',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderRadius: 2,
                  backdropFilter: 'blur(10px)'
                }}
              >
                <Typography variant="h4" sx={{ opacity: 0.7 }}>
                  Certificate Demo
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ mb: 6 }}>
        <Typography variant="h3" component="h2" align="center" gutterBottom>
          Why Choose BlockCertify?
        </Typography>
        <Typography variant="h6" align="center" color="text.secondary" sx={{ mb: 4 }}>
          Revolutionary blockchain technology meets traditional certification
        </Typography>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card 
                sx={{ 
                  height: '100%', 
                  textAlign: 'center',
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3
                  }
                }}
                className="certificate-card"
              >
                <CardContent>
                  <Box sx={{ color: 'primary.main', mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Stats Section */}
      <Box sx={{ bgcolor: 'grey.50', py: 6, mb: 6 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} textAlign="center">
            <Grid item xs={12} sm={3}>
              <Typography variant="h3" color="primary" gutterBottom>
                10K+
              </Typography>
              <Typography variant="h6">
                Certificates Issued
              </Typography>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Typography variant="h3" color="primary" gutterBottom>
                500+
              </Typography>
              <Typography variant="h6">
                Institutions
              </Typography>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Typography variant="h3" color="primary" gutterBottom>
                50K+
              </Typography>
              <Typography variant="h6">
                Verifications
              </Typography>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Typography variant="h3" color="primary" gutterBottom>
                99.9%
              </Typography>
              <Typography variant="h6">
                Uptime
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Container maxWidth="md" sx={{ mb: 6 }}>
        <Card sx={{ p: 4, textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
          <CardContent>
            <Typography variant="h4" component="h2" gutterBottom>
              Ready to Get Started?
            </Typography>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Join the future of certificate verification today
            </Typography>
          </CardContent>
          <CardActions sx={{ justifyContent: 'center' }}>
            <Button
              variant="contained"
              size="large"
              sx={{ 
                bgcolor: 'white', 
                color: 'primary.main',
                mr: 2,
                '&:hover': { bgcolor: 'grey.100' }
              }}
              startIcon={<Assignment />}
              onClick={() => navigate('/register')}
            >
              Register Institution
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{ 
                borderColor: 'white', 
                color: 'white',
                '&:hover': { borderColor: 'grey.300', bgcolor: 'rgba(255,255,255,0.1)' }
              }}
              onClick={() => navigate('/dashboard')}
            >
              View Dashboard
            </Button>
          </CardActions>
        </Card>
      </Container>
    </Box>
  );
};

export default Home;