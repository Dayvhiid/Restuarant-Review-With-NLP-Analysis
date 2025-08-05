import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import authRoutes from '../routes/authRoutes.js';
import { protect } from '../middleware/auth.js';

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  
  // Test protected route
  app.get('/api/test/protected', protect, (req, res) => {
    res.json({ success: true, user: req.user });
  });
  
  return app;
};

describe('Authentication System', () => {
  let app;
  
  beforeEach(() => {
    app = createTestApp();
  });

  describe('POST /api/auth/register', () => {
    const validUserData = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'password123'
    };

    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.data.user.name).toBe(validUserData.name);
      expect(response.body.data.user.email).toBe(validUserData.email);
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should create user with hashed password in database', async () => {
      await request(app)
        .post('/api/auth/register')
        .send(validUserData);

      const user = await User.findOne({ email: validUserData.email }).select('+password');
      expect(user).toBeTruthy();
      expect(user.password).not.toBe(validUserData.password);
      expect(user.password.length).toBeGreaterThan(20);
    });

    it('should return valid JWT token', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData);

      const token = response.body.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      expect(decoded.id).toBeDefined();
      expect(typeof decoded.id).toBe('string');
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'test@example.com'
          // Missing password
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('provide');
    });

    it('should fail with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUserData,
          email: 'invalid-email'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with password too short', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUserData,
          password: '123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('6 characters');
    });

    it('should fail with duplicate email', async () => {
      // Register first user
      await request(app)
        .post('/api/auth/register')
        .send(validUserData);

      // Try to register another user with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: validUserData.email,
          password: 'password456'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    it('should set default role as user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData);

      expect(response.body.data.user.role).toBe('user');
    });
  });

  describe('POST /api/auth/signin', () => {
    const userData = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'password123'
    };

    beforeEach(async () => {
      // Create a user for signin tests
      await request(app)
        .post('/api/auth/register')
        .send(userData);
    });

    it('should signin user with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/signin')
        .send({
          email: userData.email,
          password: userData.password
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should fail with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/signin')
        .send({
          password: userData.password
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('email and password');
    });

    it('should fail with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/signin')
        .send({
          email: userData.email
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('email and password');
    });

    it('should fail with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/signin')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should fail with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/signin')
        .send({
          email: userData.email,
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return valid JWT token', async () => {
      const response = await request(app)
        .post('/api/auth/signin')
        .send({
          email: userData.email,
          password: userData.password
        });

      const token = response.body.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      expect(decoded.id).toBeDefined();
      
      // Verify the user exists
      const user = await User.findById(decoded.id);
      expect(user.email).toBe(userData.email);
    });
  });

  describe('GET /api/auth/me', () => {
    let authToken;
    let userId;
    const userData = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'password123'
    };

    beforeEach(async () => {
      // Register and get token
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);
      
      authToken = response.body.token;
      userId = response.body.data.user._id;
    });

    it('should get current user with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user._id).toBe(userId);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Not authorized');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Not authorized');
    });
  });

  describe('Authentication Middleware', () => {
    let authToken;
    const userData = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'password123'
    };

    beforeEach(async () => {
      // Register and get token
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);
      
      authToken = response.body.token;
    });

    it('should protect routes successfully with valid token', async () => {
      const response = await request(app)
        .get('/api/test/protected')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
    });

    it('should deny access without token', async () => {
      const response = await request(app)
        .get('/api/test/protected');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('User Model', () => {
    it('should hash password before saving', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'plainPassword123'
      };

      const user = new User(userData);
      await user.save();

      expect(user.password).not.toBe(userData.password);
      expect(user.password.length).toBeGreaterThan(20);
    });

    it('should compare passwords correctly', async () => {
      const plainPassword = 'testPassword123';
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: plainPassword
      });
      await user.save();

      const isMatch = await user.comparePassword(plainPassword);
      const isNotMatch = await user.comparePassword('wrongPassword');

      expect(isMatch).toBe(true);
      expect(isNotMatch).toBe(false);
    });

    it('should validate required fields', async () => {
      const user = new User({
        email: 'test@example.com',
        password: 'password123'
        // Missing name
      });
      
      await expect(user.save()).rejects.toThrow();
    });

    it('should validate email format', async () => {
      const user = new User({
        name: 'Test User',
        email: 'invalid-email',
        password: 'password123'
      });

      await expect(user.save()).rejects.toThrow();
    });
  });
});
