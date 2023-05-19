import { useState } from 'react';
import Layout from '../components/Layout';

const TestPage = () => {
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState('');

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const response = await fetch('/api/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        reply,
      }),
    });

    if (response.ok) {
      alert('Configuration saved successfully!');
    } else {
      alert('Failed to save configuration.');
    }
  };

  return (
    <Layout title="Home | Telegram Bot Config">
      <div className="flex flex-col justify-center items-center pt-6">
        <h1 className="text-4xl text-center mb-6">Configure Auto Reply</h1>
        <form className="w-full max-w-md" onSubmit={handleFormSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="message">
              Message to Match
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="message"
              type="text"
              placeholder="Message to match"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="reply">
              Auto Reply
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="reply"
              type="text"
              placeholder="Auto reply"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="submit"
            >
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default TestPage;
