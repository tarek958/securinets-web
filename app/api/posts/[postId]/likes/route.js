import { connectDB } from '@/lib/db';
import Post from '@/models/Post';
import { getIO } from '@/lib/socket';
import { headers } from 'next/headers';

export async function POST(request, { params }) {
  try {
    const { postId } = params;
    await connectDB();

    // Get user from headers
    const headersList = headers();
    const userHeader = headersList.get('user');
    
    if (!userHeader) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = JSON.parse(userHeader);

    const post = await Post.findById(postId);
    if (!post) {
      return Response.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    const userId = user.id;
    const likeIndex = post.likes.indexOf(userId);

    if (likeIndex === -1) {
      // Add like
      post.likes.push(userId);
    } else {
      // Remove like
      post.likes.splice(likeIndex, 1);
    }

    await post.save();

    // Emit like update event
    const io = getIO();
    io.to(`post-${postId}`).emit('like-updated', {
      postId,
      likes: post.likes.length,
      isLiked: likeIndex === -1,
    });

    return Response.json({
      likes: post.likes.length,
      isLiked: likeIndex === -1,
    });
  } catch (error) {
    console.error('Error updating likes:', error);
    return Response.json(
      { error: 'Failed to update likes' },
      { status: 500 }
    );
  }
}
