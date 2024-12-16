import { connectDB } from '@/lib/db';
import Category from '@/models/Category';
import mongoose from 'mongoose';

// Default categories that should always be available
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

// Helper function to ensure default categories exist
async function ensureDefaultCategories() {
  for (const categoryName of defaultCategories) {
    await Category.findOneAndUpdate(
      { name: categoryName },
      { name: categoryName },
      { upsert: true }
    );
  }
}

export async function GET() {
  try {
    await connectDB();
    await ensureDefaultCategories();

    // Get all categories from the database
    const categories = await Category.find().select('name -_id');
    const categoryNames = categories.map(c => c.name);

    // Sort alphabetically
    return Response.json(categoryNames.sort());
  } catch (error) {
    console.error('Error fetching categories:', error);
    return Response.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const { category } = await request.json();

    if (!category) {
      return Response.json({ error: 'Category name is required' }, { status: 400 });
    }

    // Check if category already exists
    const existingCategory = await Category.findOne({ name: category });
    if (existingCategory) {
      return Response.json({ error: 'Category already exists' }, { status: 400 });
    }

    // Create new category
    const newCategory = new Category({ name: category });
    await newCategory.save();

    return Response.json({ message: 'Category added successfully' });
  } catch (error) {
    console.error('Error adding category:', error);
    return Response.json({ error: 'Failed to add category' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    if (!category) {
      return Response.json({ error: 'Category name is required' }, { status: 400 });
    }

    // Check if it's a default category
    if (defaultCategories.includes(category)) {
      return Response.json({ error: 'Cannot delete default category' }, { status: 400 });
    }

    // Check if category exists
    const existingCategory = await Category.findOne({ name: category });
    if (!existingCategory) {
      return Response.json({ error: 'Category not found' }, { status: 404 });
    }

    // Check if category is in use
    const isCategoryInUse = await mongoose.connection.db
      .collection('challenges')
      .findOne({ category });

    if (isCategoryInUse) {
      return Response.json({ error: 'Cannot delete category that is in use' }, { status: 400 });
    }

    // Delete category
    await Category.deleteOne({ name: category });

    return Response.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return Response.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
