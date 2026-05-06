import { useState, useEffect } from 'react';

interface AutoReply {
  id: string;
  keyword: string;
  reply: string;
  matchType: 'exact' | 'contains';
}

interface EditingState {
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
  const [editingData, setEditingData] = useState<EditingState | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReplies();
  }, []);

  const fetchReplies = async () => {
    try {
      const res = await fetch('/api/auto-replies');
      const data = await res.json();
      setReplies(data);
    } catch (error) {
      console.error('Failed to fetch replies:', error);
    }
  };

  const addReply = async () => {
    if (!newKeyword || !newReply) {
      alert('请输入关键词和回复内容');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auto-replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: newKeyword, reply: newReply, matchType: newMatchType }),
      });
      if (res.ok) {
        setNewKeyword('');
        setNewReply('');
        setNewMatchType('contains');
        await fetchReplies();
      }
    } catch (error) {
      console.error('Failed to add reply:', error);
      alert('添加失败');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (reply: AutoReply) => {
    setEditingId(reply.id);
    setEditingData({ ...reply });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingData(null);
  };

  const saveEdit = async () => {
    if (!editingData || !editingData.keyword || !editingData.reply) {
      alert('请输入关键词和回复内容');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auto-replies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingData.id,
          keyword: editingData.keyword,
          reply: editingData.reply,
          matchType: editingData.matchType,
        }),
      });
      if (res.ok) {
        setEditingId(null);
        setEditingData(null);
        await fetchReplies();
      }
    } catch (error) {
      console.error('Failed to update reply:', error);
      alert('保存失败');
    } finally {
      setLoading(false);
    }
  };

  const deleteReply = async (id: string) => {
    if (!confirm('确定要删除这个回复吗？')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auto-replies', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        await fetchReplies();
      }
    } catch (error) {
      console.error('Failed to delete reply:', error);
      alert('删除失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">自动回复配置</h1>
          <p className="text-gray-600">管理 Telegram 机器人的自动回复规则</p>
        </div>

        {/* Add New Reply Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">添加新规则</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="关键词（例如：hello）"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={newMatchType}
                onChange={(e) => setNewMatchType(e.target.value as 'exact' | 'contains')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="exact">完全匹配</option>
                <option value="contains">关键词包含</option>
              </select>
            </div>
            <textarea
              placeholder="回复内容（例如：你好！有什么可以帮助你的吗？）"
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={addReply}
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50"
            >
              {loading ? '处理中...' : '添加规则'}
            </button>
          </div>
        </div>

        {/* Replies List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">规则列表（{replies.length}）</h2>
          {replies.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              <p>还没有添加任何规则</p>
            </div>
          ) : (
            replies.map((reply) => (
              <div
                key={reply.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition duration-200"
              >
                {editingId === reply.id && editingData ? (
                  // Editing Mode
                  <div className="p-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          value={editingData.keyword}
                          onChange={(e) =>
                            setEditingData({ ...editingData, keyword: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <select
                          value={editingData.matchType}
                          onChange={(e) =>
                            setEditingData({
                              ...editingData,
                              matchType: e.target.value as 'exact' | 'contains',
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="exact">完全匹配</option>
                          <option value="contains">关键词包含</option>
                        </select>
                      </div>
                      <textarea
                        value={editingData.reply}
                        onChange={(e) =>
                          setEditingData({ ...editingData, reply: e.target.value })
                        }
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={cancelEdit}
                          disabled={loading}
                          className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold rounded-lg transition duration-200 disabled:opacity-50"
                        >
                          取消
                        </button>
                        <button
                          onClick={saveEdit}
                          disabled={loading}
                          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition duration-200 disabled:opacity-50"
                        >
                          {loading ? '保存中...' : '保存'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Display Mode
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-block bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">
                            {reply.keyword}
                          </span>
                          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                            {reply.matchType === 'exact' ? '完全匹配' : '关键词包含'}
                          </span>
                        </div>
                        <p className="text-gray-700 leading-relaxed">{reply.reply}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end pt-4 border-t border-gray-200">
                      <button
                        onClick={() => startEdit(reply)}
                        disabled={loading}
                        className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition duration-200 disabled:opacity-50"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => deleteReply(reply.id)}
                        disabled={loading}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition duration-200 disabled:opacity-50"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
