import React from 'react';

const HomePage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <h1 className="text-5xl font-bold mb-4">TUF Ops</h1>
      <p className="text-xl mb-8">Welcome to the internal operations hub.</p>
      <a href="/login" className="px-6 py-2 text-lg font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700">
        Login
      </a>
    </div>
  );
};

export default HomePage;
