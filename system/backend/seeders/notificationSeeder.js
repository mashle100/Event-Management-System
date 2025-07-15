const Notification = require('../models/Notification');
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/event-management')
  .then(() => console.log('MongoDB connected for seeding notifications'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const seedNotifications = async () => {
  try {
    // Clear existing notifications
    await Notification.deleteMany({});
    console.log('Cleared existing notifications');

    // Create sample notifications
    const notifications = [
      {
        title: "Welcome to our New Platform!",
        message: "We're excited to launch our new event management platform. Explore the new features and let us know what you think!",
        type: "info",
        audience: "all",
        status: "active",
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) // 15 days ago
      },
      {
        title: "System Maintenance",
        message: "Our platform will be undergoing maintenance on Saturday, July 15th from 2 AM to 5 AM EST. Some services may be temporarily unavailable during this time.",
        type: "warning",
        audience: "all",
        status: "active",
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
      },
      {
        title: "New Feature: QR Code Check-in",
        message: "We've added QR code check-in functionality for event organizers. Now you can quickly validate attendees at your events!",
        type: "success",
        audience: "organizers",
        status: "active",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
      },
      {
        title: "Event Registration Now Open",
        message: "Registration is now open for all upcoming summer events. Sign up early to secure your spot!",
        type: "info",
        audience: "attendees",
        status: "active",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
      },
      {
        title: "Important Security Update",
        message: "We've updated our security protocols. Please update your password next time you log in to enhance your account security.",
        type: "error",
        audience: "all",
        status: "active",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      },
      {
        title: "Old System Retirement",
        message: "Our legacy system will be retired on December 31st. Please ensure all your data is migrated to the new platform.",
        type: "warning",
        audience: "all",
        status: "archived",
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
      }
    ];

    await Notification.insertMany(notifications);
    console.log(`Successfully seeded ${notifications.length} notifications`);

    // Display the seeded notifications
    const seededNotifications = await Notification.find({});
    console.log('Seeded notifications:');
    seededNotifications.forEach(notification => {
      console.log(`- ${notification.title} (${notification.type}, ${notification.status})`);
    });

    mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error seeding notifications:', error);
    mongoose.connection.close();
    process.exit(1);
  }
};

// Run the seeder
seedNotifications();
