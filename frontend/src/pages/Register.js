import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  TextField, 
  Button, 
  Card, 
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  IconButton,
  Link
} from '@mui/material';
import { 
  Person as PersonIcon,
  Email as EmailIcon, 
  Lock as LockIcon, 
  Visibility, 
  VisibilityOff,
  Work as WorkIcon
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import axios from 'axios';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const watchPassword = watch('password');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await axios.post('/api/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role
      });
      
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Card elevation={3}>
        <CardContent sx={{ p: 4 }}>
          <Box textAlign="center" mb={3}>
            <Typography variant="h4" component="h1" gutterBottom color="primary">
              Create Account
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Join BlockCertify for secure certificate management
            </Typography>
          </Box>

          <form onSubmit={handleSubmit(onSubmit)}>
            <TextField
              fullWidth
              label="Full Name"
              margin="normal"
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
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Email Address"
              type="email"
              margin="normal"
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
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <FormControl fullWidth margin="normal">
              <InputLabel>Role</InputLabel>
              <Select
                label="Role"
                {...register('role', { required: 'Role is required' })}
                error={!!errors.role}
                startAdornment={
                  <InputAdornment position="start">
                    <WorkIcon color="action" />
                  </InputAdornment>
                }
              >
                <MenuItem value="student">Student</MenuItem>
                <MenuItem value="institution">Institution</MenuItem>
                <MenuItem value="verifier">Verifier</MenuItem>
              </Select>
              {errors.role && (
                <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                  {errors.role.message}
                </Typography>
              )}
            </FormControl>

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              margin="normal"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                }
              })}
              error={!!errors.password}
              helperText={errors.password?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              margin="normal"
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: value => 
                  value === watchPassword || 'Passwords do not match'
              })}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading}
              size="large"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>

            <Box textAlign="center">
              <Typography variant="body2">
                Already have an account?{' '}
                <Link component={RouterLink} to="/login" color="primary">
                  Sign in here
                </Link>
              </Typography>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Register;