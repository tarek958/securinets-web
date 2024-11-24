export async function getChallenges() {
  const res = await fetch('/api/challenges', {
    cache: 'no-store'
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch challenges');
  }

  return res.json();
}

export async function submitFlag(challengeId, flag) {
  const res = await fetch('/api/submit-flag', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ challengeId, flag }),
  });

  if (!res.ok) {
    throw new Error('Failed to submit flag');
  }

  return res.json();
}
