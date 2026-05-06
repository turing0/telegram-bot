import { useState, useEffect } from 'react';

interface AutoReply {
  id: string;
  keyword: string;
  reply: string;
  matchType: 'exact' | 'contains';
}

export default function Config() {
  const [replies, setReplies] = useState<AutoReply[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [newReply, setNewReply] = useState('');
  const [newMatchType, setNewMatchType] = useState<'exact' | 'contains'>('contains');
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
      body: JSON.stringify({ keyword: newKeyword, reply: newReply, matchType: newMatchType }),
    });
    setNewKeyword('');
    setNewReply('');
    setNewMatchType('contains');
    fetchReplies();
  };

  const updateReply = async (id: string, keyword: string, reply: string, matchType: 'exact' | 'contains') => {
    await fetch('/api/auto-replies', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, keyword, reply, matchType }),
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

      <div className="mb-4 p-4 border rounded">
        <div className="mb-2">
          <input
            type="text"
            placeholder="关键词"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            className="border p-2 mr-2 w-32"
          />
          <input
            type="text"
            placeholder="回复内容"
            value={newReply}
            onChange={(e) => setNewReply(e.target.value)}
            className="border p-2 mr-2 flex-1"
          />
        </div>
        <div className="mb-2">
          <label className="mr-2">匹配方式：</label>
          <select
            value={newMatchType}
            onChange={(e) => setNewMatchType(e.target.value as 'exact' | 'contains')}
            className="border p-2 mr-2"
          >
            <option value="exact">完全匹配</option>
            <option value="contains">关键词包含</option>
          </select>
          <button onClick={addReply} className="bg-blue-500 text-white px-4 py-2">
            添加
          </button>
        </div>
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
                  className="border p-1 mr-2 w-24"
                />
                <input
                  type="text"
                  value={reply.reply}
                  onChange={(e) => setReplies(replies.map(r => r.id === reply.id ? { ...r, reply: e.target.value } : r))}
                  className="border p-1 mr-2 flex-1"
                />
                <select
                  value={reply.matchType}
                  onChange={(e) => setReplies(replies.map(r => r.id === reply.id ? { ...r, matchType: e.target.value as 'exact' | 'contains' } : r))}
                  className="border p-1 mr-2"
                >
                  <option value="exact">完全匹配</option>
                  <option value="contains">关键词包含</option>
                </select>
                <button
                  onClick={() => updateReply(reply.id, reply.keyword, reply.reply, reply.matchType)}
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
                <strong>{reply.keyword}</strong>
                <span className="ml-2 text-sm text-gray-500">[{reply.matchType === 'exact' ? '完全匹配' : '关键词包含'}]</span>
                <p className="text-gray-700">{reply.reply}</p>
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