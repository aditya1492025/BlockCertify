import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  Divider
} from '@mui/material';
import {
  Search,
  VerifiedUser,
  Error as ErrorIcon,
  Assignment,
  School,
  Person,
  DateRange
} from '@mui/icons-material';
import axios from 'axios';

const VerifyCertificate = () => {
  const [searchType, setSearchType] = useState('id');
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (!searchValue.trim()) {
      setError('Please enter a certificate ID or hash');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await axios.post('/api/blockchain/verify-certificate', {
        [searchType === 'id' ? 'certificateId' : 'certificateHash']: searchValue.trim()
      });

      setResult(response.data);
    } catch (error) {
      console.error('Verification error:', error);
      if (error.response?.status === 404) {
        setError('Certificate not found');
      } else if (error.response?.status === 400) {
        setError(error.response.data.error || 'Certificate is not valid');
      } else {
        setError('Error verifying certificate. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (isValid) => {
    return isValid ? 'success' : 'error';
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Verify Certificate
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Enter a certificate ID or hash to verify its authenticity
        </Typography>
      </Box>

      {/* Search Form */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Certificate Verification
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Button
              variant={searchType === 'id' ? 'contained' : 'outlined'}
              onClick={() => setSearchType('id')}
              size="small"
            >
              Certificate ID
            </Button>
            <Button
              variant={searchType === 'hash' ? 'contained' : 'outlined'}
              onClick={() => setSearchType('hash')}
              size="small"
            >
              Certificate Hash
            </Button>
          </Box>

          <TextField
            fullWidth
            label={searchType === 'id' ? 'Certificate ID' : 'Certificate Hash'}
            placeholder={searchType === 'id' ? 'e.g. 123' : 'e.g. 0x1234...'}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            sx={{ mb: 3 }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleVerify();
              }
            }}
          />

          <Button
            variant="contained"
            size="large"
            startIcon={loading ? <CircularProgress size={20} /> : <Search />}
            onClick={handleVerify}
            disabled={loading || !searchValue.trim()}
            fullWidth
          >
            {loading ? 'Verifying...' : 'Verify Certificate'}
          </Button>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {/* Results Display */}
      {result && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            {/* Verification Status */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              {result.verified ? (
                <VerifiedUser color="success" sx={{ mr: 2, fontSize: 32 }} />
              ) : (
                <ErrorIcon color="error" sx={{ mr: 2, fontSize: 32 }} />
              )}
              <Box>
                <Typography variant="h5" component="h2">
                  {result.verified ? 'Certificate Verified' : 'Certificate Invalid'}
                </Typography>
                <Chip
                  label={result.certificate?.isValid ? 'Valid' : 'Revoked'}
                  color={getStatusColor(result.certificate?.isValid)}
                  size="small"
                />
              </Box>
            </Box>

            {result.certificate && (
              <>
                <Divider sx={{ mb: 3 }} />
                
                {/* Certificate Details */}
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Assignment sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6">Certificate Details</Typography>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Certificate ID
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {result.certificate.id}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Course/Program
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {result.certificate.courseName}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Certificate Type
                      </Typography>
                      <Chip 
                        label={result.certificate.certificateType} 
                        size="small"
                        variant="outlined"
                      />
                    </Box>

                    {result.certificate.grade && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Grade/Achievement
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {result.certificate.grade}
                        </Typography>
                      </Box>
                    )}

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Issue Date
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <DateRange sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body1">
                          {formatDate(result.certificate.issuedAt)}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <School sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6">Institution</Typography>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Institution Address
                      </Typography>
                      <Typography 
                        variant="body2" 
                        fontFamily="monospace"
                        sx={{ 
                          wordBreak: 'break-all',
                          bgcolor: 'grey.100',
                          p: 1,
                          borderRadius: 1
                        }}
                      >
                        {result.certificate.institution}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Person sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6">Recipient</Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Recipient Address
                      </Typography>
                      <Typography 
                        variant="body2" 
                        fontFamily="monospace"
                        sx={{ 
                          wordBreak: 'break-all',
                          bgcolor: 'grey.100',
                          p: 1,
                          borderRadius: 1
                        }}
                      >
                        {result.certificate.recipient}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* Technical Details */}
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Technical Details
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="text.secondary">
                        Certificate Hash
                      </Typography>
                      <Typography 
                        variant="body2" 
                        fontFamily="monospace"
                        sx={{ 
                          wordBreak: 'break-all',
                          bgcolor: 'grey.100',
                          p: 1,
                          borderRadius: 1
                        }}
                      >
                        {result.certificate.certificateHash}
                      </Typography>
                    </Grid>
                    
                    {result.certificate.metadataHash && (
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="text.secondary">
                          Metadata Hash
                        </Typography>
                        <Typography 
                          variant="body2" 
                          fontFamily="monospace"
                          sx={{ 
                            wordBreak: 'break-all',
                            bgcolor: 'grey.100',
                            p: 1,
                            borderRadius: 1
                          }}
                        >
                          {result.certificate.metadataHash}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            How to Verify
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            To verify a certificate, you can use either:
          </Typography>
          <Typography variant="body2" component="div">
            • <strong>Certificate ID:</strong> A unique number assigned to each certificate
            <br />
            • <strong>Certificate Hash:</strong> A cryptographic hash that uniquely identifies the certificate data
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
};

export default VerifyCertificate;