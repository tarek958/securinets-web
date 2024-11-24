import { connectDB } from '@/lib/db';
import Post from '@/models/Post';
import { getIO } from '@/lib/socket';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  try {
    const { postId } = params;
    const { content, parentCommentId } = await request.json();
    await connectDB();

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
    const io = getIO();
    if (io) {
      io.to(`post-${postId}`).emit('newComment', {
        postId,
        comment: newComment,
      });
    }

    return NextResponse.json(newComment);
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json(
      { error: 'Failed to add comment' },
      { status: 500 }
    );
  }
}
