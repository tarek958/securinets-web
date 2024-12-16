import { connectDB } from '../lib/db.js';
import Category from '../models/Category.js';

const defaultCategories = [
  'Web',
  'Pwn',
  'Reverse Engineering',
  'Cryptography',
  'Digital Forensics',
  'OSINT',
  'Steganography',
  'Mobile Security',
  'Hardware',
  'Miscellaneous'
];

async function initializeCategories() {
  try {
    await connectDB();

    for (const category of defaultCategories) {
      const existingCategory = await Category.findOne({ name: category });
      if (!existingCategory) {
        await new Category({ name: category }).save();
        console.log(`Added category: ${category}`);
      } else {
        console.log(`Category already exists: ${category}`);
      }
    }

    console.log('Category initialization complete.');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing categories:', error);
    process.exit(1);
  }
}

initializeCategories();
