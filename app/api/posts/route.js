import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { broadcast } from '@/app/api/events/route';
import { ObjectId } from 'mongodb';
import { getIO } from '@/lib/socket';

export async function GET() {
  try {
    const { db } = await connectToDatabase();

    const posts = await db.collection('posts')
      .aggregate([
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
            'author.email': 0,
            'comments.author.password': 0,
            'comments.author.email': 0
          }
        },
        {
          $sort: { createdAt: -1 }
        },
        {
          $limit: 50
        }
      ]).toArray();

    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    console.log('Posts API - Received POST request');
    const data = await request.json();
    const { db } = await connectToDatabase();

    // Log request data for debugging
    console.log('Posts API - Request data:', {
      ...data,
      images: data.images ? `${data.images.length} images received` : 'no images'
    });

    // Get user data from headers
    const userData = request.headers.get('x-user-data');
    if (!userData) {
      console.log('Posts API - No user data found in headers');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = JSON.parse(userData);

    // Process images if they exist
    let images = [];
    if (data.images && Array.isArray(data.images)) {
      for (const image of data.images) {
        try {
          // Handle image data based on its type
          let imageData = typeof image === 'object' ? image.data : image;

          // Validate file size
          validateFileSize(imageData);

          // Add processed image to array
          images.push({
            data: imageData,
            uploadedAt: new Date()
          });

          console.log('Posts API - Processed image:', {
            uploadedAt: new Date()
          });
        } catch (err) {
          console.error('Error processing image:', err);
          throw new Error(`Error processing image: ${err.message}`);
        }
      }
    }

    // Create post object
    const post = {
      author: new ObjectId(user.id),
      title: data.title,
      content: data.content,
      images,
      likes: [],
      tags: data.tags || [],
      isEdited: false,
      comments: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('Posts API - Created post object:', {
      ...post,
      images: post.images.length ? `${post.images.length} images processed` : 'no images'
    });

    // Insert the post
    const result = await db.collection('posts').insertOne(post);
    const insertedPost = await db.collection('posts')
      .aggregate([
        {
          $match: { _id: result.insertedId }
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

    // Emit SSE event for real-time updates
    await broadcast('newPost', insertedPost);

    return NextResponse.json(insertedPost);
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create post' },
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
