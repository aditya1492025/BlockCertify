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
  MenuItem,
  Grid,
  Divider
} from '@mui/material';
import {
  Assignment,
  Send,
  Person,
  School
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useWeb3 } from '../context/Web3Context';
import axios from 'axios';
import { toast } from 'react-toastify';

const IssueCertificate = () => {
  const { user, isAuthenticated } = useAuth();
  const { account, connected } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    recipientAddress: '',
    recipientName: '',
    recipientEmail: '',
    certificateType: 'degree',
    courseName: '',
    grade: '',
    description: ''
  });

  const certificateTypes = [
    { value: 'degree', label: 'Degree' },
    { value: 'diploma', label: 'Diploma' },
    { value: 'certificate', label: 'Certificate' },
    { value: 'transcript', label: 'Transcript' },
    { value: 'other', label: 'Other' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const errors = [];
    
    if (!formData.recipientAddress.trim()) {
      errors.push('Recipient address is required');
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(formData.recipientAddress)) {
      errors.push('Invalid Ethereum address format');
    }
    
    if (!formData.recipientName.trim()) {
      errors.push('Recipient name is required');
    }
    
    if (!formData.courseName.trim()) {
      errors.push('Course/Program name is required');
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (errors.length > 0) {
      toast.error(errors.join(', '));
      return;
    }

    if (!isAuthenticated || user?.role !== 'institution') {
      toast.error('Only registered institutions can issue certificates');
      return;
    }

    if (!connected || !account) {
      toast.error('Please connect your wallet');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `/api/institutions/${account}/certificates`,
        formData,
        {
          headers: {
            'x-auth-token': localStorage.getItem('token')
          }
        }
      );

      toast.success('Certificate issued successfully!');
      
      // Reset form
      setFormData({
        recipientAddress: '',
        recipientName: '',
        recipientEmail: '',
        certificateType: 'degree',
        courseName: '',
        grade: '',
        description: ''
      });

      console.log('Certificate issued:', response.data);

    } catch (error) {
      console.error('Error issuing certificate:', error);
      
      if (error.response?.status === 403) {
        toast.error('Access denied. Please ensure you are a registered institution.');
      } else if (error.response?.status === 401) {
        toast.error('Authentication required. Please log in.');
      } else {
        toast.error(error.response?.data?.error || 'Error issuing certificate');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning">
          Please log in as an institution to issue certificates.
        </Alert>
      </Container>
    );
  }

  if (user?.role !== 'institution') {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">
          Only registered institutions can issue certificates.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Issue Certificate
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Create and issue a new blockchain certificate
        </Typography>
      </Box>

      {!connected && (
        <Alert severity="warning" sx={{ mb: 4 }}>
          Please connect your wallet to issue certificates.
        </Alert>
      )}

      <Card>
        <CardContent sx={{ p: 4 }}>
          <Box component="form" onSubmit={handleSubmit}>
            {/* Institution Info */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <School sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Institution Information</Typography>
            </Box>
            
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Institution Address"
                  value={account || 'Not connected'}
                  disabled
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Institution Name"
                  value={user?.name || 'Not available'}
                  disabled
                  variant="outlined"
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Recipient Info */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Person sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Recipient Information</Typography>
            </Box>
            
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Recipient Ethereum Address"
                  name="recipientAddress"
                  value={formData.recipientAddress}
                  onChange={handleInputChange}
                  placeholder="0x..."
                  helperText="The Ethereum address that will own this certificate"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Recipient Name"
                  name="recipientName"
                  value={formData.recipientName}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Recipient Email"
                  name="recipientEmail"
                  type="email"
                  value={formData.recipientEmail}
                  onChange={handleInputChange}
                  placeholder="john@example.com"
                  helperText="Optional: for notifications"
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Certificate Details */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Assignment sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Certificate Details</Typography>
            </Box>
            
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  select
                  label="Certificate Type"
                  name="certificateType"
                  value={formData.certificateType}
                  onChange={handleInputChange}
                >
                  {certificateTypes.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Grade/Achievement"
                  name="grade"
                  value={formData.grade}
                  onChange={handleInputChange}
                  placeholder="A+, First Class, etc."
                  helperText="Optional"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Course/Program Name"
                  name="courseName"
                  value={formData.courseName}
                  onChange={handleInputChange}
                  placeholder="Bachelor of Science in Computer Science"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Additional details about the certificate..."
                  helperText="Optional: Any additional information about the certificate"
                />
              </Grid>
            </Grid>

            {/* Submit Button */}
            <Box sx={{ textAlign: 'center', pt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={loading ? <CircularProgress size={20} /> : <Send />}
                disabled={loading || !connected}
                sx={{ minWidth: 200 }}
              >
                {loading ? 'Issuing Certificate...' : 'Issue Certificate'}
              </Button>
            </Box>

            {loading && (
              <Alert severity="info" sx={{ mt: 3 }}>
                Please wait while the certificate is being created on the blockchain. 
                This may take a few moments...
              </Alert>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card sx={{ mt: 4, bgcolor: 'grey.50' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Important Information
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            • Certificates are permanently stored on the blockchain and cannot be deleted
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            • Each certificate receives a unique ID and cryptographic hash
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            • Recipients can verify their certificates using the certificate ID or hash
          </Typography>
          <Typography variant="body2">
            • Certificates can be revoked if necessary, but the revocation will be permanently recorded
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
};

export default IssueCertificate;