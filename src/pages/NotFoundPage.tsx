import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-24 text-center">
      <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
      <p className="text-xl text-gray-600 mb-8">Page not found</p>
      <Link to="/" className="text-blue-600 hover:underline">← Back to Home</Link>
    </div>
  );
}
