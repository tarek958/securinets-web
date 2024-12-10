import { connectToDatabase } from '@/lib/db';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token');

  if (token) {
    try {
      // Connect to the database
      const { db } = await connectToDatabase();

      // Decode the token to get the user ID
      const { payload } = await jwtVerify(token.value, new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret'));
      const userId = payload.id; // Ensure this matches the structure in the JWT payload
      const email = payload.email; // Ensure this matches the structure in the JWT payload
      const user = await db.collection("users").findOne({ email });
      console.log('Token verified for user ID:', userId);

      // Remove session from database by user ID
      const result = await db.collection('sessions').deleteOne({ userId: user._id }); // Adjust query if necessary
      console.log('Delete result:', result);
      console.log('result.deletedCount:', result.deletedCount);
      if (result.deletedCount > 0) {
        console.log('Session successfully removed for user ID:', userId);
      } else {
        // Consider querying by token as a fallback if userId isn't stored
        const tokenResult = await db.collection('sessions').deleteOne({ token: token.value });
        console.log('Fallback delete result:', tokenResult);
        if (tokenResult.deletedCount > 0) {
          console.log('Session successfully removed using token as fallback.');
        } else {
          console.warn('No session found with the token either.');
        }
      }

      // Remove the auth-token cookie
      cookieStore.delete('auth-token');
    } catch (error) {
      console.error('Failed to decode token or remove session:', error);
    }
  } else {
    console.warn('No token found in cookies.');
  }

  return Response.json({ message: 'Logged out successfully' });
}
