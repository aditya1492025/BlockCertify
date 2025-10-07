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
  Divider,
  Paper
} from '@mui/material';
import {
  Search,
  VerifiedUser,
  Error as ErrorIcon,
  Assignment,
  School,
  Person,
  DateRange,
  CheckCircle,
  Cancel
} from '@mui/icons-material';
import axios from 'axios';

const VerifyCertificate = () => {
  const [certificateId, setCertificateId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (!certificateId.trim()) {
      setError('Please enter a certificate ID');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await axios.get(`/api/certificates/verify/${certificateId.trim()}`);
      setResult(response.data);
    } catch (error) {
      if (error.response?.status === 404) {
        setError('Certificate not found. Please check the ID and try again.');
      } else {
        setError(error.response?.data?.error || 'Verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setCertificateId('');
    setResult(null);
    setError('');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box textAlign="center" mb={4}>
        <Typography variant="h4" component="h1" gutterBottom color="primary">
          Verify Certificate
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Enter a certificate ID to verify its authenticity and view details
        </Typography>
      </Box>

      <Card elevation={3} sx={{ mb: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Box display="flex" gap={2} alignItems="flex-start">
            <TextField
              fullWidth
              label="Certificate ID"
              placeholder="Enter certificate ID (e.g., CERT-000001)"
              value={certificateId}
              onChange={(e) => setCertificateId(e.target.value)}
              error={!!error && !result}
              helperText={error && !result ? error : 'Enter the unique certificate ID provided by the institution'}
              disabled={loading}
            />
            <Button
              variant="contained"
              onClick={handleVerify}
              disabled={loading || !certificateId.trim()}
              startIcon={loading ? <CircularProgress size={20} /> : <Search />}
              sx={{ minWidth: 120, height: 56 }}
            >
              {loading ? 'Verifying...' : 'Verify'}
            </Button>
            {(result || error) && (
              <Button
                variant="outlined"
                onClick={handleClear}
                sx={{ minWidth: 80, height: 56 }}
              >
                Clear
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Verification Result */}
      {result && (
        <Card elevation={3}>
          <CardContent sx={{ p: 4 }}>
            <Box display="flex" alignItems="center" mb={3}>
              {result.verified ? (
                <CheckCircle color="success" sx={{ fontSize: 40, mr: 2 }} />
              ) : (
                <Cancel color="error" sx={{ fontSize: 40, mr: 2 }} />
              )}
              <Box>
                <Typography variant="h5" color={result.verified ? 'success.main' : 'error.main'}>
                  {result.verified ? 'Certificate Verified' : 'Certificate Invalid'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {result.message}
                </Typography>
              </Box>
            </Box>

            {result.verified && result.certificate && (
              <>
                <Divider sx={{ my: 3 }} />
                
                <Grid container spacing={3}>
                  {/* Certificate Details */}
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom color="primary">
                      Certificate Details
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Paper elevation={1} sx={{ p: 2 }}>
                      <Box display="flex" alignItems="center" mb={1}>
                        <Assignment color="primary" sx={{ mr: 1 }} />
                        <Typography variant="subtitle2">Certificate ID</Typography>
                      </Box>
                      <Typography variant="body1" fontWeight="bold">
                        {result.certificate.id}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Paper elevation={1} sx={{ p: 2 }}>
                      <Box display="flex" alignItems="center" mb={1}>
                        <Assignment color="primary" sx={{ mr: 1 }} />
                        <Typography variant="subtitle2">Certificate Type</Typography>
                      </Box>
                      <Chip 
                        label={result.certificate.certificateType} 
                        color="primary" 
                        variant="outlined"
                      />
                    </Paper>
                  </Grid>

                  {/* Recipient Information */}
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
                      Recipient Information
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Paper elevation={1} sx={{ p: 2 }}>
                      <Box display="flex" alignItems="center" mb={1}>
                        <Person color="primary" sx={{ mr: 1 }} />
                        <Typography variant="subtitle2">Recipient Name</Typography>
                      </Box>
                      <Typography variant="body1" fontWeight="bold">
                        {result.certificate.recipientName}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Paper elevation={1} sx={{ p: 2 }}>
                      <Box display="flex" alignItems="center" mb={1}>
                        <Person color="primary" sx={{ mr: 1 }} />
                        <Typography variant="subtitle2">Recipient Email</Typography>
                      </Box>
                      <Typography variant="body1">
                        {result.certificate.recipientEmail}
                      </Typography>
                    </Paper>
                  </Grid>

                  {/* Course Information */}
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
                      Course Information
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Paper elevation={1} sx={{ p: 2 }}>
                      <Box display="flex" alignItems="center" mb={1}>
                        <Assignment color="primary" sx={{ mr: 1 }} />
                        <Typography variant="subtitle2">Course Name</Typography>
                      </Box>
                      <Typography variant="body1" fontWeight="bold">
                        {result.certificate.courseName}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Paper elevation={1} sx={{ p: 2 }}>
                      <Box display="flex" alignItems="center" mb={1}>
                        <Assignment color="primary" sx={{ mr: 1 }} />
                        <Typography variant="subtitle2">Course Code</Typography>
                      </Box>
                      <Typography variant="body1">
                        {result.certificate.courseCode}
                      </Typography>
                    </Paper>
                  </Grid>

                  {result.certificate.grade && (
                    <Grid item xs={12} md={6}>
                      <Paper elevation={1} sx={{ p: 2 }}>
                        <Box display="flex" alignItems="center" mb={1}>
                          <VerifiedUser color="primary" sx={{ mr: 1 }} />
                          <Typography variant="subtitle2">Grade/Score</Typography>
                        </Box>
                        <Typography variant="body1" fontWeight="bold">
                          {result.certificate.grade}
                        </Typography>
                      </Paper>
                    </Grid>
                  )}

                  {/* Institution Information */}
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
                      Institution Information
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Paper elevation={1} sx={{ p: 2 }}>
                      <Box display="flex" alignItems="center" mb={1}>
                        <School color="primary" sx={{ mr: 1 }} />
                        <Typography variant="subtitle2">Institution</Typography>
                      </Box>
                      <Typography variant="body1" fontWeight="bold">
                        {result.certificate.institutionName}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Paper elevation={1} sx={{ p: 2 }}>
                      <Box display="flex" alignItems="center" mb={1}>
                        <Person color="primary" sx={{ mr: 1 }} />
                        <Typography variant="subtitle2">Issued By</Typography>
                      </Box>
                      <Typography variant="body1">
                        {result.certificate.issuerName}
                      </Typography>
                    </Paper>
                  </Grid>

                  {/* Dates */}
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
                      Important Dates
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Paper elevation={1} sx={{ p: 2 }}>
                      <Box display="flex" alignItems="center" mb={1}>
                        <DateRange color="primary" sx={{ mr: 1 }} />
                        <Typography variant="subtitle2">Completion Date</Typography>
                      </Box>
                      <Typography variant="body1">
                        {formatDate(result.certificate.completionDate)}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Paper elevation={1} sx={{ p: 2 }}>
                      <Box display="flex" alignItems="center" mb={1}>
                        <DateRange color="primary" sx={{ mr: 1 }} />
                        <Typography variant="subtitle2">Issued Date</Typography>
                      </Box>
                      <Typography variant="body1">
                        {formatDate(result.certificate.issuedDate)}
                      </Typography>
                    </Paper>
                  </Grid>

                  {result.certificate.description && (
                    <Grid item xs={12}>
                      <Paper elevation={1} sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Description
                        </Typography>
                        <Typography variant="body1">
                          {result.certificate.description}
                        </Typography>
                      </Paper>
                    </Grid>
                  )}

                  {/* Verification Hash */}
                  <Grid item xs={12}>
                    <Paper elevation={1} sx={{ p: 2, backgroundColor: 'grey.50' }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Verification Hash
                      </Typography>
                      <Typography variant="body2" fontFamily="monospace" sx={{ wordBreak: 'break-all' }}>
                        {result.certificate.verificationHash}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                <Alert severity="success" sx={{ mt: 3 }}>
                  <Typography variant="body2">
                    This certificate has been verified as authentic and is currently active.
                    The information above has been verified against the issuing institution's records.
                  </Typography>
                </Alert>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && !result && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* Instructions */}
      {!result && !error && (
        <Card elevation={1} sx={{ mt: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              How to verify a certificate:
            </Typography>
            <Typography variant="body2" component="div">
              <Box component="ol" sx={{ pl: 2 }}>
                <li>Obtain the certificate ID from the certificate holder or institution</li>
                <li>Enter the certificate ID in the field above</li>
                <li>Click "Verify" to check the certificate's authenticity</li>
                <li>Review the displayed certificate details if verification is successful</li>
              </Box>
            </Typography>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default VerifyCertificate;