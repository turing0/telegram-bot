import { useState, useEffect } from 'react';

interface AutoReply {
  id: string;
  keyword: string;
  reply: string;
}

export default function Config() {
  const [replies, setReplies] = useState<AutoReply[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [newReply, setNewReply] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchReplies();
  }, []);

  const fetchReplies = async () => {
    const res = await fetch('/api/auto-replies');
    const data = await res.json();
    setReplies(data);
  };

  const addReply = async () => {
    if (!newKeyword || !newReply) return;
    await fetch('/api/auto-replies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword: newKeyword, reply: newReply }),
    });
    setNewKeyword('');
    setNewReply('');
    fetchReplies();
  };

  const updateReply = async (id: string, keyword: string, reply: string) => {
    await fetch('/api/auto-replies', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, keyword, reply }),
    });
    setEditingId(null);
    fetchReplies();
  };

  const deleteReply = async (id: string) => {
    await fetch('/api/auto-replies', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchReplies();
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">自动回复配置</h1>

      <div className="mb-4">
        <input
          type="text"
          placeholder="关键词"
          value={newKeyword}
          onChange={(e) => setNewKeyword(e.target.value)}
          className="border p-2 mr-2"
        />
        <input
          type="text"
          placeholder="回复内容"
          value={newReply}
          onChange={(e) => setNewReply(e.target.value)}
          className="border p-2 mr-2"
        />
        <button onClick={addReply} className="bg-blue-500 text-white px-4 py-2">
          添加
        </button>
      </div>

      <ul className="space-y-2">
        {replies.map((reply) => (
          <li key={reply.id} className="border p-2 flex justify-between items-center">
            {editingId === reply.id ? (
              <div className="flex-1">
                <input
                  type="text"
                  value={reply.keyword}
                  onChange={(e) => setReplies(replies.map(r => r.id === reply.id ? { ...r, keyword: e.target.value } : r))}
                  className="border p-1 mr-2"
                />
                <input
                  type="text"
                  value={reply.reply}
                  onChange={(e) => setReplies(replies.map(r => r.id === reply.id ? { ...r, reply: e.target.value } : r))}
                  className="border p-1 mr-2"
                />
                <button
                  onClick={() => updateReply(reply.id, reply.keyword, reply.reply)}
                  className="bg-green-500 text-white px-2 py-1 mr-2"
                >
                  保存
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="bg-gray-500 text-white px-2 py-1"
                >
                  取消
                </button>
              </div>
            ) : (
              <div className="flex-1">
                <strong>{reply.keyword}:</strong> {reply.reply}
              </div>
            )}
            <div>
              <button
                onClick={() => setEditingId(reply.id)}
                className="bg-yellow-500 text-white px-2 py-1 mr-2"
              >
                编辑
              </button>
              <button
                onClick={() => deleteReply(reply.id)}
                className="bg-red-500 text-white px-2 py-1"
              >
                删除
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}