import React from 'react';
import { Box, Container, Typography, Link, Grid } from '@mui/material';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: 'grey.900',
        color: 'white',
        py: 4,
        mt: 'auto'
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom>
              BlockCertify
            </Typography>
            <Typography variant="body2">
              Decentralized certificate verification platform powered by blockchain technology.
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom>
              Quick Links
            </Typography>
            <Link href="/" color="inherit" display="block" sx={{ mb: 1 }}>
              Home
            </Link>
            <Link href="/verify" color="inherit" display="block" sx={{ mb: 1 }}>
              Verify Certificate
            </Link>
            <Link href="/dashboard" color="inherit" display="block">
              Dashboard
            </Link>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom>
              Support
            </Typography>
            <Link href="#" color="inherit" display="block" sx={{ mb: 1 }}>
              Documentation
            </Link>
            <Link href="#" color="inherit" display="block" sx={{ mb: 1 }}>
              API Reference
            </Link>
            <Link href="#" color="inherit" display="block">
              Contact Us
            </Link>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom>
              Legal
            </Typography>
            <Link href="#" color="inherit" display="block" sx={{ mb: 1 }}>
              Privacy Policy
            </Link>
            <Link href="#" color="inherit" display="block" sx={{ mb: 1 }}>
              Terms of Service
            </Link>
            <Link href="#" color="inherit" display="block">
              Security
            </Link>
          </Grid>
        </Grid>
        <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid grey.700' }}>
          <Typography variant="body2" align="center">
            © 2025 BlockCertify. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;