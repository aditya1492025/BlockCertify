import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Avatar,
  Chip,
  Divider,
  Alert
} from '@mui/material';
import { 
  Person,
  Email,
  Work,
  Edit,
  Save,
  Cancel
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import axios from 'axios';

const Profile = () => {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await axios.put('/api/auth/profile', data, {
        headers: {
          'x-auth-token': localStorage.getItem('token')
        }
      });
      
      // Update user data in localStorage
      const updatedUser = { ...user, ...data };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      toast.success('Profile updated successfully!');
      setEditing(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    reset();
    setEditing(false);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Profile
      </Typography>
      
      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar 
                sx={{ 
                  width: 100, 
                  height: 100, 
                  margin: '0 auto 16px',
                  bgcolor: 'primary.main',
                  fontSize: '2rem'
                }}
              >
                {user?.name?.charAt(0)?.toUpperCase()}
              </Avatar>
              <Typography variant="h6" gutterBottom>
                {user?.name}
              </Typography>
              <Chip 
                label={user?.role} 
                color="primary" 
                sx={{ mb: 2 }}
              />
              <Typography variant="body2" color="text.secondary">
                Member since {new Date(user?.createdAt).toLocaleDateString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Personal Information
                </Typography>
                {!editing && (
                  <Button 
                    startIcon={<Edit />} 
                    onClick={() => setEditing(true)}
                  >
                    Edit
                  </Button>
                )}
              </Box>
              
              <Divider sx={{ mb: 3 }} />
              
              {editing ? (
                <form onSubmit={handleSubmit(onSubmit)}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        {...register('name', {
                          required: 'Name is required',
                          minLength: {
                            value: 2,
                            message: 'Name must be at least 2 characters'
                          }
                        })}
                        error={!!errors.name}
                        helperText={errors.name?.message}
                        InputProps={{
                          startAdornment: <Person color="action" sx={{ mr: 1 }} />,
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Email Address"
                        type="email"
                        {...register('email', {
                          required: 'Email is required',
                          pattern: {
                            value: /^\S+@\S+$/i,
                            message: 'Please enter a valid email'
                          }
                        })}
                        error={!!errors.email}
                        helperText={errors.email?.message}
                        InputProps={{
                          startAdornment: <Email color="action" sx={{ mr: 1 }} />,
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Box display="flex" gap={2}>
                        <Button
                          type="submit"
                          variant="contained"
                          startIcon={<Save />}
                          disabled={loading}
                        >
                          {loading ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<Cancel />}
                          onClick={handleCancel}
                          disabled={loading}
                        >
                          Cancel
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </form>
              ) : (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Person color="action" sx={{ mr: 2 }} />
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Full Name
                        </Typography>
                        <Typography variant="body1">
                          {user?.name}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Email color="action" sx={{ mr: 2 }} />
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Email Address
                        </Typography>
                        <Typography variant="body1">
                          {user?.email}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Work color="action" sx={{ mr: 2 }} />
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Role
                        </Typography>
                        <Typography variant="body1">
                          {user?.role}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Profile;