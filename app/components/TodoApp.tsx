"use client";

import { useEffect, useState } from "react";

type Todo = {
  id: string;
  text: string;
  completed: boolean;
};

const STORAGE_KEY = "todo-app:todos";

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  // 初回読み込み時にlocalStorageから復元
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setTodos(JSON.parse(saved));
      }
    } catch {
      // 読み込みに失敗した場合は空リストのまま
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // 変更のたびにlocalStorageへ保存
  useEffect(() => {
    if (!isLoaded) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos, isLoaded]);

  const addTodo = () => {
    const text = input.trim();
    if (!text) return;
    setTodos((prev) => [{ id: createId(), text, completed: false }, ...prev]);
    setInput("");
  };

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      addTodo();
    }
  };

  const remainingCount = todos.filter((t) => !t.completed).length;

  return (
    <div className="w-full max-w-md">
      <div className="rounded-3xl bg-white/80 backdrop-blur-sm shadow-xl shadow-brand-500/10 ring-1 ring-black/5 p-6 sm:p-8">
        <header className="mb-6 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
            📝 ToDoリスト
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {todos.length === 0
              ? "タスクを追加してみましょう"
              : `残り ${remainingCount} 件 / 全 ${todos.length} 件`}
          </p>
        </header>

        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="新しいタスクを入力..."
            className="flex-1 min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30"
          />
          <button
            onClick={addTodo}
            disabled={!input.trim()}
            className="shrink-0 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-brand-500/30 transition hover:bg-brand-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-brand-500"
          >
            追加
          </button>
        </div>

        {todos.length === 0 ? (
          <div className="py-12 text-center text-slate-300">
            <p className="text-4xl mb-2">🌤️</p>
            <p className="text-sm">タスクがありません</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {todos.map((todo) => (
              <li
                key={todo.id}
                className="task-item group flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 transition hover:border-brand-100 hover:shadow-sm"
              >
                <button
                  onClick={() => toggleTodo(todo.id)}
                  aria-label={todo.completed ? "未完了に戻す" : "完了にする"}
                  className={`task-checkbox flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                    todo.completed
                      ? "border-brand-500 bg-brand-500"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  {todo.completed && (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-3 w-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>

                <span
                  className={`flex-1 break-words text-sm ${
                    todo.completed
                      ? "text-slate-300 line-through"
                      : "text-slate-700"
                  }`}
                >
                  {todo.text}
                </span>

                <button
                  onClick={() => deleteTodo(todo.id)}
                  aria-label="削除"
                  className="shrink-0 rounded-lg p-1.5 text-slate-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-slate-300">
        入力内容はこの端末に自動保存されます
      </p>
    </div>
  );
}
