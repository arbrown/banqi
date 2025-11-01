'use client';

import { useUserStore } from '@/store/userStore';
import { useRouter } from 'next/navigation';

export default function CreateGameButton() {
  const { user } = useUserStore();
  const router = useRouter();

  const handleCreateGame = async () => {
    if (!user) {
      alert('You must be logged in to create a game.');
      return;
    }

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to create game');
      }

      const { gameId } = await response.json();
      console.log('Game created:', gameId);
      // Redirect to the new game page
      router.push(`/games/${gameId}`);

    } catch (error) {
      console.error('Error creating game:', error);
      alert('Could not create game.');
    }
  };

  if (!user) return null;

  return (
    <button
      onClick={handleCreateGame}
      className="mt-8 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
    >
      Create New Game
    </button>
  );
}
