import { connectDB } from '@/lib/db';
import Category from '@/models/Category';

export async function PUT(request, context) {
  try {
    await connectDB();
    const { category } = context.params;
    const { newName } = await request.json();

    if (!newName) {
      return Response.json({ error: 'New category name is required' }, { status: 400 });
    }

    // Check if the new name already exists
    const existingCategory = await Category.findOne({ name: newName });
    if (existingCategory && existingCategory.name !== category) {
      return Response.json({ error: 'Category with this name already exists' }, { status: 400 });
    }

    // Find and update the category
    const updatedCategory = await Category.findOneAndUpdate(
      { name: category },
      { name: newName },
      { new: true }
    );

    if (!updatedCategory) {
      return Response.json({ error: 'Category not found' }, { status: 404 });
    }

    return Response.json({ message: 'Category updated successfully' });
  } catch (error) {
    console.error('Error updating category:', error);
    return Response.json({ error: 'Failed to update category' }, { status: 500 });
  }
}
