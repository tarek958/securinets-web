import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { getIO } from '@/lib/socket';
import { NextResponse } from 'next/server';

// DELETE a post
export async function DELETE(request, { params }) {
  try {
    const { postId } = params;
    const { db } = await connectToDatabase();

    // Get user data from headers
    const userData = request.headers.get('x-user-data');
    if (!userData) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = JSON.parse(userData);

    // Find the post
    const post = await db.collection('posts').findOne({
      _id: new ObjectId(postId)
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Check if user is the author
    if (post.author.toString() !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to delete this post' },
        { status: 403 }
      );
    }

    // Delete the post
    await db.collection('posts').deleteOne({
      _id: new ObjectId(postId)
    });

    // Emit socket event for real-time updates
    try {
      const io = getIO();
      if (io) {
        io.emit('postDeleted', { postId });
      }
    } catch (error) {
      console.log('Socket.io not available, skipping real-time update');
    }

    return NextResponse.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    );
  }
}

// PATCH to update a post
export async function PATCH(request, { params }) {
  try {
    const { postId } = params;
    const data = await request.json();
    const { db } = await connectToDatabase();

    // Get user data from headers
    const userData = request.headers.get('x-user-data');
    if (!userData) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = JSON.parse(userData);

    // Find the post
    const post = await db.collection('posts').findOne({
      _id: new ObjectId(postId)
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Check if user is the author
    if (post.author.toString() !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to edit this post' },
        { status: 403 }
      );
    }

    // Process images if they exist
    let images = post.images; // Keep existing images by default
    if (data.images && Array.isArray(data.images)) {
      images = [];
      for (const image of data.images) {
        try {
          let imageData = typeof image === 'object' ? image.data : image;
          validateFileSize(imageData);
          images.push({
            data: imageData,
            uploadedAt: new Date()
          });
        } catch (err) {
          console.error('Error processing image:', err);
          throw new Error(`Error processing image: ${err.message}`);
        }
      }
    }

    // Update the post
    const updatedPost = {
      title: data.title || post.title,
      content: data.content || post.content,
      images,
      tags: data.tags || post.tags,
      isEdited: true,
      updatedAt: new Date()
    };

    await db.collection('posts').updateOne(
      { _id: new ObjectId(postId) },
      { $set: updatedPost }
    );

    // Get the updated post with author details
    const result = await db.collection('posts')
      .aggregate([
        {
          $match: { _id: new ObjectId(postId) }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'author',
            foreignField: '_id',
            as: 'author'
          }
        },
        {
          $unwind: '$author'
        },
        {
          $project: {
            'author.password': 0,
            'author.email': 0
          }
        }
      ]).next();

    // Emit socket event for real-time updates
    try {
      const io = getIO();
      if (io) {
        io.emit('postUpdated', result);
      }
    } catch (error) {
      console.log('Socket.io not available, skipping real-time update');
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update post' },
      { status: 500 }
    );
  }
}

// Helper function to validate file size (max 5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

function validateFileSize(base64String) {
  try {
    // Check if it's a valid base64 image string
    if (!base64String.match(/^data:image\/(png|jpeg|jpg|gif);base64,/)) {
      throw new Error('Invalid image format. Must be base64 encoded image.');
    }

    // Get the base64 data part
    const base64Data = base64String.split(',')[1];
    
    // Calculate the size in bytes
    const sizeInBytes = Math.ceil((base64Data.length * 3) / 4);
    
    if (sizeInBytes > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`);
    }
    
    return true;
  } catch (error) {
    throw new Error(`Error validating file size: ${error.message}`);
  }
}
