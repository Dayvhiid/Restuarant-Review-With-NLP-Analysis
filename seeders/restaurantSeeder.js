import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Restaurant from '../models/Restaurant.js';

// Load environment variables
dotenv.config();

// Sample restaurant data
const restaurantData = [
  {
    name: "Giuseppe's Italian Kitchen",
    location: "Downtown Manhattan, New York",
    cuisine: "Italian"
  },
  {
    name: "Sakura Sushi Bar",
    location: "Beverly Hills, California",
    cuisine: "Japanese"
  },
  {
    name: "El Mariachi Loco",
    location: "Austin, Texas",
    cuisine: "Mexican"
  },
  {
    name: "Dragon Palace",
    location: "Chinatown, San Francisco",
    cuisine: "Chinese"
  },
  {
    name: "Café de Paris",
    location: "Upper East Side, New York",
    cuisine: "French"
  },
  {
    name: "Spice Route",
    location: "London, UK",
    cuisine: "Indian"
  },
  {
    name: "The Burger Joint",
    location: "Chicago, Illinois",
    cuisine: "American"
  },
  {
    name: "Mediterranean Delights",
    location: "Miami, Florida",
    cuisine: "Mediterranean"
  },
  {
    name: "Bangkok Street Food",
    location: "Los Angeles, California",
    cuisine: "Thai"
  },
  {
    name: "Oktoberfest Grill",
    location: "Milwaukee, Wisconsin",
    cuisine: "German"
  },
  {
    name: "Soul Food Kitchen",
    location: "Atlanta, Georgia",
    cuisine: "Southern"
  },
  {
    name: "Kebab House",
    location: "Detroit, Michigan",
    cuisine: "Middle Eastern"
  },
  {
    name: "The Steakhouse",
    location: "Dallas, Texas",
    cuisine: "Steakhouse"
  },
  {
    name: "Nonna's Pizzeria",
    location: "Boston, Massachusetts",
    cuisine: "Italian"
  },
  {
    name: "Taco Libre",
    location: "Phoenix, Arizona",
    cuisine: "Mexican"
  },
  {
    name: "Fresh Garden Bistro",
    location: "Portland, Oregon",
    cuisine: "Vegetarian"
  },
  {
    name: "Ocean Breeze Seafood",
    location: "Seattle, Washington",
    cuisine: "Seafood"
  },
  {
    name: "Mountain View Diner",
    location: "Denver, Colorado",
    cuisine: "American"
  },
  {
    name: "Little Saigon",
    location: "Houston, Texas",
    cuisine: "Vietnamese"
  },
  {
    name: "Tandoor Express",
    location: "San Jose, California",
    cuisine: "Indian"
  }
];

// Connect to database
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Seed restaurants
const seedRestaurants = async () => {
  try {
    await connectDB();
    
    // Clear existing restaurants
    await Restaurant.deleteMany({});
    console.log('Cleared existing restaurants');
    
    // Insert new restaurants
    const restaurants = await Restaurant.insertMany(restaurantData);
    console.log(`✓ Successfully seeded ${restaurants.length} restaurants`);
    
    // Display seeded restaurants
    console.log('\nSeeded Restaurants:');
    console.log('===================');
    restaurants.forEach((restaurant, index) => {
      console.log(`${index + 1}. ${restaurant.name}`);
      console.log(`   Location: ${restaurant.location}`);
      console.log(`   Cuisine: ${restaurant.cuisine}`);
      console.log(`   ID: ${restaurant._id}`);
      console.log('');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

// Clear restaurants only
const clearRestaurants = async () => {
  try {
    await connectDB();
    await Restaurant.deleteMany({});
    console.log('✓ All restaurants cleared successfully');
    process.exit(0);
  } catch (error) {
    console.error('Clear error:', error);
    process.exit(1);
  }
};

// Check command line arguments
const command = process.argv[2];

if (command === 'clear') {
  clearRestaurants();
} else {
  seedRestaurants();
}
