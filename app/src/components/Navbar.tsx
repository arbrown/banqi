import AuthStatus from './AuthStatus';

export default function Navbar() {
  return (
    <nav className="bg-gray-800 text-white p-4 flex justify-between items-center">
      <a href="/" className="font-bold text-xl">Pao</a>
      <AuthStatus />
    </nav>
  );
}
