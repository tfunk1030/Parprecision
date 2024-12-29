import express from 'express';
import cors from 'cors';
import environmentRoutes from './api/environment';
import windRoutes from './api/wind';
import shotRoutes from './api/shot';

const app = express();
const port = process.env.PORT || 3002;

// Middleware
app.use(cors());  // Allow requests from your UI
app.use(express.json());

// Routes
app.use('/api', environmentRoutes);
app.use('/api/wind', windRoutes);
app.use('/api/shot', shotRoutes);

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});