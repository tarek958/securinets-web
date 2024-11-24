import { Suspense } from 'react';
import CountdownClient from './CountdownClient';
import MatrixBackground from '@/components/MatrixBackground';

export default function CountdownPage() {
  return (
    <main className="min-h-screen relative">
      <MatrixBackground className="fixed inset-0" />
      
      
        <div className="pt-8">
          <Suspense fallback={<div>Loading...</div>}>
            <CountdownClient />
          </Suspense>
        </div>
   
    </main>
  );
}
