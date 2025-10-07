import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert
} from '@mui/material';
import {
  School as SchoolIcon,
  Person as PersonIcon,
  Description as DescriptionIcon,
  CalendarToday as CalendarIcon,
  Upload as UploadIcon
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import axios from 'axios';

const UploadCertificate = () => {
  const [loading, setLoading] = useState(false);
  const [uploadedCertId, setUploadedCertId] = useState(null);
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/certificates/upload', {
        recipientName: data.recipientName,
        recipientEmail: data.recipientEmail,
        courseName: data.courseName,
        courseCode: data.courseCode,
        grade: data.grade,
        completionDate: data.completionDate,
        description: data.description,
        institutionName: data.institutionName,
        issuerName: data.issuerName,
        certificateType: data.certificateType
      });
      
      setUploadedCertId(response.data.certificate.id);
      toast.success('Certificate uploaded successfully!');
      reset();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to upload certificate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom color="primary" textAlign="center">
        Upload Certificate
      </Typography>
      <Typography variant="body1" color="text.secondary" textAlign="center" mb={4}>
        Upload and register a new certificate on the blockchain
      </Typography>

      {uploadedCertId && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Certificate uploaded successfully! Certificate ID: <strong>{uploadedCertId}</strong>
          <br />
          Share this ID with recipients for verification.
        </Alert>
      )}

      <Card elevation={3}>
        <CardContent sx={{ p: 4 }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              {/* Institution Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom color="primary">
                  Institution Information
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Institution Name"
                  {...register('institutionName', {
                    required: 'Institution name is required'
                  })}
                  error={!!errors.institutionName}
                  helperText={errors.institutionName?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SchoolIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Issuer Name"
                  {...register('issuerName', {
                    required: 'Issuer name is required'
                  })}
                  error={!!errors.issuerName}
                  helperText={errors.issuerName?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Recipient Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
                  Recipient Information
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Recipient Name"
                  {...register('recipientName', {
                    required: 'Recipient name is required'
                  })}
                  error={!!errors.recipientName}
                  helperText={errors.recipientName?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Recipient Email"
                  type="email"
                  {...register('recipientEmail', {
                    required: 'Recipient email is required',
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: 'Please enter a valid email'
                    }
                  })}
                  error={!!errors.recipientEmail}
                  helperText={errors.recipientEmail?.message}
                />
              </Grid>

              {/* Course Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
                  Course Information
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Course Name"
                  {...register('courseName', {
                    required: 'Course name is required'
                  })}
                  error={!!errors.courseName}
                  helperText={errors.courseName?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <DescriptionIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Course Code"
                  {...register('courseCode', {
                    required: 'Course code is required'
                  })}
                  error={!!errors.courseCode}
                  helperText={errors.courseCode?.message}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Certificate Type</InputLabel>
                  <Select
                    label="Certificate Type"
                    {...register('certificateType', {
                      required: 'Certificate type is required'
                    })}
                    error={!!errors.certificateType}
                  >
                    <MenuItem value="completion">Course Completion</MenuItem>
                    <MenuItem value="achievement">Achievement</MenuItem>
                    <MenuItem value="degree">Degree</MenuItem>
                    <MenuItem value="diploma">Diploma</MenuItem>
                    <MenuItem value="certification">Professional Certification</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Grade/Score"
                  {...register('grade')}
                  helperText="Optional: Enter grade, percentage, or score"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Completion Date"
                  type="date"
                  {...register('completionDate', {
                    required: 'Completion date is required'
                  })}
                  error={!!errors.completionDate}
                  helperText={errors.completionDate?.message}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  {...register('description')}
                  helperText="Optional: Add additional details about the certificate"
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  startIcon={<UploadIcon />}
                  sx={{ mt: 2, py: 1.5 }}
                >
                  {loading ? 'Uploading Certificate...' : 'Upload Certificate'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
};

export default UploadCertificate;