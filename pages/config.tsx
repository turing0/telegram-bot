import type { GetServerSideProps } from 'next';
import { FormEvent, useEffect, useState } from 'react';
import { isConfigAuthenticated, isConfigPasswordSet } from '../utils/config-auth';

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

interface ConfigProps {
  authenticated: boolean;
  passwordConfigured: boolean;
}

const matchTypeLabels = {
  exact: '精准匹配',
  contains: '包含匹配',
};

const inputClassName =
  'w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100';

const secondaryButtonClassName =
  'inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50';

function LoginView({ passwordConfigured }: { passwordConfigured: boolean }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submitPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!password.trim()) {
      setError('请输入管理密码');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/config-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() }),
      });

      if (res.ok) {
        window.location.reload();
        return;
      }

      setError(res.status === 500 ? '请先配置环境变量 CONFIG_PAGE_PASSWORD' : '密码不正确');
    } catch (loginError) {
      console.error('Failed to login:', loginError);
      setError('登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-900">
      <main className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="mb-2 text-sm font-medium text-sky-600">Telegram Bot</p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">配置页登录</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          输入管理密码后才能查看和编辑自动回复规则。
        </p>

        {!passwordConfigured ? (
          <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">
            当前没有配置 <span className="font-semibold">CONFIG_PAGE_PASSWORD</span> 环境变量。
          </div>
        ) : null}

        <form onSubmit={submitPassword} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">密码</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={inputClassName}
              placeholder="请输入管理密码"
              autoComplete="current-password"
            />
          </label>

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-11 w-full items-center justify-center rounded-md bg-sky-600 px-4 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? '验证中...' : '进入配置页'}
          </button>
        </form>
      </main>
    </div>
  );
}

export default function Config({ authenticated, passwordConfigured }: ConfigProps) {
  const [replies, setReplies] = useState<AutoReply[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [newReply, setNewReply] = useState('');
  const [newMatchType, setNewMatchType] = useState<'exact' | 'contains'>('exact');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<EditingState | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authenticated) {
      fetchReplies();
    }
  }, [authenticated]);

  const fetchReplies = async () => {
    try {
      const res = await fetch('/api/auto-replies');

      if (res.status === 401) {
        window.location.reload();
        return;
      }

      const data = await res.json();
      setReplies(data);
    } catch (error) {
      console.error('Failed to fetch replies:', error);
    }
  };

  const addReply = async () => {
    if (!newKeyword.trim() || !newReply.trim()) {
      alert('请填写关键词和回复内容');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auto-replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: newKeyword.trim(),
          reply: newReply.trim(),
          matchType: newMatchType,
        }),
      });

      if (res.ok) {
        setNewKeyword('');
        setNewReply('');
        setNewMatchType('exact');
        await fetchReplies();
      }
    } catch (error) {
      console.error('Failed to add reply:', error);
      alert('新增回复失败');
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
    if (!editingData || !editingData.keyword.trim() || !editingData.reply.trim()) {
      alert('请填写关键词和回复内容');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auto-replies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingData.id,
          keyword: editingData.keyword.trim(),
          reply: editingData.reply.trim(),
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
      alert('保存回复失败');
    } finally {
      setLoading(false);
    }
  };

  const deleteReply = async (id: string) => {
    if (!confirm('确定要删除这条自动回复吗？')) return;

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
      alert('删除回复失败');
    } finally {
      setLoading(false);
    }
  };

  if (!authenticated) {
    return <LoginView passwordConfigured={passwordConfigured} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="flex flex-col gap-5 p-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-sm font-medium text-sky-600">Telegram Bot</p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                自动回复配置
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                管理关键词触发规则，让机器人按设定内容自动响应用户消息。
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:min-w-[320px]">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase text-slate-500">规则总数</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{replies.length}</p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase text-slate-500">默认模式</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">精准</p>
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-950">新增规则</h2>
              <p className="mt-1 text-sm text-slate-500">填写关键词、匹配方式和回复内容。</p>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">关键词</span>
                <input
                  type="text"
                  placeholder="例如：hello"
                  value={newKeyword}
                  onChange={(event) => setNewKeyword(event.target.value)}
                  className={inputClassName}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">匹配方式</span>
                <select
                  value={newMatchType}
                  onChange={(event) =>
                    setNewMatchType(event.target.value as 'exact' | 'contains')
                  }
                  className={inputClassName}
                >
                  <option value="exact">精准匹配</option>
                  <option value="contains">包含匹配</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">回复内容</span>
                <textarea
                  placeholder="输入机器人要发送的回复内容"
                  value={newReply}
                  onChange={(event) => setNewReply(event.target.value)}
                  rows={6}
                  className={inputClassName}
                />
              </label>

              <button
                onClick={addReply}
                disabled={loading}
                className="inline-flex h-11 w-full items-center justify-center rounded-md bg-sky-600 px-4 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? '处理中...' : '添加自动回复'}
              </button>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white">
            <div className="flex flex-col gap-2 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">回复规则</h2>
                <p className="mt-1 text-sm text-slate-500">按关键词命中后返回对应内容。</p>
              </div>
              <span className="inline-flex w-fit items-center rounded-md bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
                {replies.length} 条规则
              </span>
            </div>

            {replies.length === 0 ? (
              <div className="flex min-h-[320px] items-center justify-center p-8 text-center">
                <div>
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-slate-100 text-xl text-slate-500">
                    +
                  </div>
                  <h3 className="text-base font-semibold text-slate-950">还没有自动回复</h3>
                  <p className="mt-1 text-sm text-slate-500">先在左侧添加一条规则。</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {replies.map((reply) => (
                  <article key={reply.id} className="p-5 transition hover:bg-slate-50">
                    {editingId === reply.id && editingData ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px]">
                          <input
                            type="text"
                            value={editingData.keyword}
                            onChange={(event) =>
                              setEditingData({ ...editingData, keyword: event.target.value })
                            }
                            className={inputClassName}
                          />
                          <select
                            value={editingData.matchType}
                            onChange={(event) =>
                              setEditingData({
                                ...editingData,
                                matchType: event.target.value as 'exact' | 'contains',
                              })
                            }
                            className={inputClassName}
                          >
                            <option value="exact">精准匹配</option>
                            <option value="contains">包含匹配</option>
                          </select>
                        </div>

                        <textarea
                          value={editingData.reply}
                          onChange={(event) =>
                            setEditingData({ ...editingData, reply: event.target.value })
                          }
                          rows={4}
                          className={inputClassName}
                        />

                        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                          <button
                            onClick={cancelEdit}
                            disabled={loading}
                            className={secondaryButtonClassName}
                          >
                            取消
                          </button>
                          <button
                            onClick={saveEdit}
                            disabled={loading}
                            className="inline-flex h-10 items-center justify-center rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {loading ? '保存中...' : '保存修改'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <span className="rounded-md bg-sky-50 px-2.5 py-1 text-sm font-semibold text-sky-700 ring-1 ring-inset ring-sky-100">
                              {reply.keyword}
                            </span>
                            <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                              {matchTypeLabels[reply.matchType]}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                            {reply.reply}
                          </p>
                        </div>

                        <div className="flex shrink-0 gap-2 md:pt-0">
                          <button
                            onClick={() => startEdit(reply)}
                            disabled={loading}
                            className={secondaryButtonClassName}
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => deleteReply(reply.id)}
                            disabled={loading}
                            className="inline-flex h-10 items-center justify-center rounded-md border border-rose-200 bg-white px-4 text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<ConfigProps> = async ({ req }) => {
  return {
    props: {
      authenticated: isConfigAuthenticated(req.headers.cookie),
      passwordConfigured: isConfigPasswordSet(),
    },
  };
};
