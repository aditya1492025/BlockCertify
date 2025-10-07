import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  VerifiedUser,
  Assignment,
  School,
  TrendingUp,
  Visibility,
  Add,
  Refresh
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useWeb3 } from '../context/Web3Context';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const { account, connected } = useWeb3();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated && connected && account) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, connected, account, user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch blockchain stats
      const blockchainResponse = await axios.get('/api/blockchain/stats');
      
      let userStats = null;
      let userCertificates = [];

      if (user?.role === 'institution') {
        // Fetch institution-specific data
        const [statsResponse, certsResponse] = await Promise.all([
          axios.get(`/api/institutions/${account}/stats`, {
            headers: { 'x-auth-token': localStorage.getItem('token') }
          }),
          axios.get(`/api/institutions/${account}/certificates?limit=10`)
        ]);
        
        userStats = statsResponse.data;
        userCertificates = certsResponse.data.certificates;
      } else if (user?.role === 'student') {
        // Fetch student certificates
        const certsResponse = await axios.get(`/api/certificates/recipient/${account}?limit=10`);
        userCertificates = certsResponse.data.certificates;
      }

      setStats({
        blockchain: blockchainResponse.data,
        user: userStats
      });
      setCertificates(userCertificates);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'issued': return 'success';
      case 'revoked': return 'error';
      case 'suspended': return 'warning';
      default: return 'default';
    }
  };

  if (!isAuthenticated) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="info">
          Please log in to view your dashboard.
          <Button onClick={() => navigate('/login')} sx={{ ml: 2 }}>
            Login
          </Button>
        </Alert>
      </Container>
    );
  }

  if (!connected) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">
          Please connect your wallet to view dashboard data.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h3" component="h1" gutterBottom>
            Dashboard
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Welcome back, {user?.name || 'User'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <IconButton onClick={fetchDashboardData} disabled={loading}>
            <Refresh />
          </IconButton>
          {user?.role === 'institution' && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/issue')}
            >
              Issue Certificate
            </Button>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Global Stats */}
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Assignment sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h4" component="div" gutterBottom>
                    {stats?.blockchain?.totalCertificates || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Certificates
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {user?.role === 'institution' && stats?.user && (
              <>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <VerifiedUser sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                      <Typography variant="h4" component="div" gutterBottom>
                        {stats.user.overview.validCertificates}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Your Certificates
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <TrendingUp sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                      <Typography variant="h4" component="div" gutterBottom>
                        {stats.user.verifications.total}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Verifications
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <School sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
                      <Typography variant="h4" component="div" gutterBottom>
                        {stats.user.overview.recentCertificates}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        This Month
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </>
            )}

            {user?.role === 'student' && (
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <VerifiedUser sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                    <Typography variant="h4" component="div" gutterBottom>
                      {certificates.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      My Certificates
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>

          {/* Certificate Type Distribution (Institution only) */}
          {user?.role === 'institution' && stats?.user?.typeDistribution && (
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Certificate Type Distribution
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {stats.user.typeDistribution.map((type, index) => (
                    <Chip
                      key={index}
                      label={`${type._id}: ${type.count}`}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Recent Certificates */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  {user?.role === 'institution' ? 'Recently Issued Certificates' : 'My Certificates'}
                </Typography>
                <Button
                  size="small"
                  onClick={() => navigate('/verify')}
                  startIcon={<Visibility />}
                >
                  Verify Certificate
                </Button>
              </Box>

              {certificates.length === 0 ? (
                <Alert severity="info">
                  {user?.role === 'institution' 
                    ? 'No certificates issued yet. Start by issuing your first certificate!'
                    : 'No certificates found for your address.'
                  }
                </Alert>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Course/Program</TableCell>
                        <TableCell>Type</TableCell>
                        {user?.role === 'institution' ? (
                          <TableCell>Recipient</TableCell>
                        ) : (
                          <TableCell>Institution</TableCell>
                        )}
                        <TableCell>Status</TableCell>
                        <TableCell>Issued Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {certificates.map((cert) => (
                        <TableRow key={cert.certificateId || cert.id}>
                          <TableCell>
                            <Typography variant="body2" fontFamily="monospace">
                              {cert.certificateId || cert.id}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {cert.certificate?.courseName || cert.courseName}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={cert.certificate?.type || cert.certificateType}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            {user?.role === 'institution' ? (
                              <Typography variant="body2">
                                {cert.recipient?.name || 'Unknown'}
                              </Typography>
                            ) : (
                              <Typography variant="body2">
                                {cert.institution?.name || 'Unknown Institution'}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={cert.status || (cert.verification?.isValid ? 'Valid' : 'Invalid')}
                              color={getStatusColor(cert.status || (cert.verification?.isValid ? 'issued' : 'revoked'))}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDate(cert.createdAt || cert.issuedAt)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>

          {/* Network Info */}
          <Card sx={{ mt: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Network Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    Network
                  </Typography>
                  <Typography variant="body1">
                    {stats?.blockchain?.network?.name || 'Unknown'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    Chain ID
                  </Typography>
                  <Typography variant="body1">
                    {stats?.blockchain?.network?.chainId || 'Unknown'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    Block Number
                  </Typography>
                  <Typography variant="body1">
                    {stats?.blockchain?.network?.blockNumber || 'Unknown'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </>
      )}
    </Container>
  );
};

export default Dashboard;