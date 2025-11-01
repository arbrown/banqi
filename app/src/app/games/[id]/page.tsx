export default function GamePage({ params }: { params: { id: string } }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-4xl font-bold">Game Room</h1>
      <p className="mt-4 text-2xl">Game ID: {params.id}</p>
      <p className="mt-8 text-lg">Game board and logic will be implemented here.</p>
    </div>
  );
}
