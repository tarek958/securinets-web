import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { broadcast } from '@/app/api/events/route';
import { ObjectId } from 'mongodb';

export async function POST(request, { params }) {
  try {
    const { postId } = params;
    const { content, parentCommentId } = await request.json();
    await connectToDatabase();

    // Get user data from headers
    const userData = request.headers.get('x-user-data');
    
    if (!userData) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = JSON.parse(userData);

    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    const comment = {
      content,
      author: user.id,
      parentComment: parentCommentId,
      createdAt: new Date(),
    };

    post.comments.push(comment);
    await post.save();

    // Populate author information
    await post.populate('comments.author', 'username');
    const newComment = post.comments[post.comments.length - 1];

    // Emit new comment event
    await broadcast(`post-${postId}`, 'newComment', {
      postId,
      comment: newComment,
    });

    return NextResponse.json(newComment);
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json(
      { error: 'Failed to add comment' },
      { status: 500 }
    );
  }
}
