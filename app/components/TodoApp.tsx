"use client";

import { useEffect, useMemo, useState } from "react";
import ProgressRing from "./ProgressRing";

type Priority = "high" | "medium" | "low";
type Category = "work" | "private" | "other";

type Todo = {
  id: string;
  text: string;
  completed: boolean;
  priority: Priority;
  category: Category;
  dueDate: string | null; // YYYY-MM-DD
  createdAt: number;
};

const STORAGE_KEY = "todo-app:todos";

const PRIORITY_LABELS: Record<Priority, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

const PRIORITY_BADGE: Record<Priority, string> = {
  high: "bg-rose-50 text-rose-600 ring-1 ring-rose-200",
  medium: "bg-amber-50 text-amber-600 ring-1 ring-amber-200",
  low: "bg-slate-100 text-slate-500 ring-1 ring-slate-200",
};

const PRIORITY_BORDER: Record<Priority, string> = {
  high: "border-l-4 border-l-rose-300",
  medium: "border-l-4 border-l-amber-300",
  low: "border-l-4 border-l-slate-200",
};

const CATEGORY_LABELS: Record<Category, string> = {
  work: "仕事",
  private: "プライベート",
  other: "その他",
};

const CATEGORY_BADGE: Record<Category, string> = {
  work: "bg-sky-50 text-sky-600 ring-1 ring-sky-200",
  private: "bg-violet-50 text-violet-600 ring-1 ring-violet-200",
  other: "bg-stone-100 text-stone-600 ring-1 ring-stone-200",
};

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDate(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${Number(m)}/${Number(d)}`;
}

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  const [text, setText] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [category, setCategory] = useState<Category>("other");
  const [dueDate, setDueDate] = useState("");

  const [filterCategory, setFilterCategory] = useState<Category | "all">("all");
  const [filterPriority, setFilterPriority] = useState<Priority | "all">("all");

  // 初回読み込み時にlocalStorageから復元
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<Todo>[];
        setTodos(
          parsed.map((t) => ({
            id: t.id ?? createId(),
            text: t.text ?? "",
            completed: t.completed ?? false,
            priority: (t.priority as Priority) ?? "medium",
            category: (t.category as Category) ?? "other",
            dueDate: t.dueDate ?? null,
            createdAt: t.createdAt ?? Date.now(),
          }))
        );
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
    const trimmed = text.trim();
    if (!trimmed) return;
    setTodos((prev) => [
      {
        id: createId(),
        text: trimmed,
        completed: false,
        priority,
        category,
        dueDate: dueDate || null,
        createdAt: Date.now(),
      },
      ...prev,
    ]);
    setText("");
    setDueDate("");
  };

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const requestDelete = (id: string) => {
    setRemovingIds((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setTodos((prev) => prev.filter((todo) => todo.id !== id));
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 220);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      addTodo();
    }
  };

  const remainingCount = todos.filter((t) => !t.completed).length;
  const completedCount = todos.length - remainingCount;
  const percent =
    todos.length === 0 ? 0 : Math.round((completedCount / todos.length) * 100);

  const filteredTodos = useMemo(
    () =>
      todos.filter(
        (t) =>
          (filterCategory === "all" || t.category === filterCategory) &&
          (filterPriority === "all" || t.priority === filterPriority)
      ),
    [todos, filterCategory, filterPriority]
  );

  const isFiltering = filterCategory !== "all" || filterPriority !== "all";
  const today = todayISO();
  const selectClass =
    "rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30";

  return (
    <div className="w-full max-w-md">
      <div className="rounded-3xl bg-white/80 backdrop-blur-sm shadow-xl shadow-brand-500/10 ring-1 ring-black/5 p-6 sm:p-8">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
              📝 ToDoリスト
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              {todos.length === 0
                ? "タスクを追加してみましょう"
                : `残り ${remainingCount} 件 / 全 ${todos.length} 件`}
            </p>
          </div>
          {todos.length > 0 && <ProgressRing percent={percent} />}
        </header>

        <div className="mb-4 flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="新しいタスクを入力..."
              className="flex-1 min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30"
            />
            <button
              onClick={addTodo}
              disabled={!text.trim()}
              className="shrink-0 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-brand-500/30 transition hover:bg-brand-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-brand-500"
            >
              追加
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className={selectClass}
              aria-label="優先度"
            >
              <option value="high">優先度: 高</option>
              <option value="medium">優先度: 中</option>
              <option value="low">優先度: 低</option>
            </select>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className={selectClass}
              aria-label="カテゴリ"
            >
              <option value="work">仕事</option>
              <option value="private">プライベート</option>
              <option value="other">その他</option>
            </select>

            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={selectClass}
              aria-label="締め切り日"
            />
          </div>
        </div>

        {todos.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
            <span className="text-xs text-slate-400">絞り込み:</span>
            <select
              value={filterCategory}
              onChange={(e) =>
                setFilterCategory(e.target.value as Category | "all")
              }
              className={selectClass}
              aria-label="カテゴリで絞り込み"
            >
              <option value="all">すべてのカテゴリ</option>
              <option value="work">仕事</option>
              <option value="private">プライベート</option>
              <option value="other">その他</option>
            </select>
            <select
              value={filterPriority}
              onChange={(e) =>
                setFilterPriority(e.target.value as Priority | "all")
              }
              className={selectClass}
              aria-label="優先度で絞り込み"
            >
              <option value="all">すべての優先度</option>
              <option value="high">優先度: 高</option>
              <option value="medium">優先度: 中</option>
              <option value="low">優先度: 低</option>
            </select>
            {isFiltering && (
              <button
                onClick={() => {
                  setFilterCategory("all");
                  setFilterPriority("all");
                }}
                className="text-xs text-brand-600 underline underline-offset-2 hover:text-brand-700"
              >
                リセット
              </button>
            )}
          </div>
        )}

        {todos.length === 0 ? (
          <div className="py-12 text-center text-slate-300">
            <p className="text-4xl mb-2">🌱</p>
            <p className="text-sm">タスクがありません</p>
          </div>
        ) : filteredTodos.length === 0 ? (
          <div className="py-12 text-center text-slate-300">
            <p className="text-4xl mb-2">🔍</p>
            <p className="text-sm">条件に一致するタスクがありません</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {filteredTodos.map((todo) => {
              const overdue =
                !todo.completed && !!todo.dueDate && todo.dueDate < today;
              return (
                <li
                  key={todo.id}
                  className={`task-item group flex items-start gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 transition-all duration-200 ease-in hover:border-brand-100 hover:shadow-sm ${PRIORITY_BORDER[todo.priority]} ${
                    removingIds.has(todo.id) ? "task-item--removing" : ""
                  }`}
                >
                  <button
                    key={todo.completed ? "done" : "todo"}
                    onClick={() => toggleTodo(todo.id)}
                    aria-label={todo.completed ? "未完了に戻す" : "完了にする"}
                    className={`task-checkbox mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      todo.completed
                        ? "task-checkbox--pop border-brand-500 bg-brand-500"
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

                  <div className="min-w-0 flex-1">
                    <span
                      className={`block break-words text-sm ${
                        todo.completed
                          ? "text-slate-300 line-through"
                          : "text-slate-700"
                      }`}
                    >
                      {todo.text}
                    </span>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${PRIORITY_BADGE[todo.priority]}`}
                      >
                        優先度: {PRIORITY_LABELS[todo.priority]}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${CATEGORY_BADGE[todo.category]}`}
                      >
                        {CATEGORY_LABELS[todo.category]}
                      </span>
                      {todo.dueDate && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            overdue
                              ? "bg-red-50 text-red-600 ring-1 ring-red-200"
                              : "bg-slate-50 text-slate-500 ring-1 ring-slate-200"
                          }`}
                        >
                          {overdue ? "期限切れ " : "期限 "}
                          {formatDate(todo.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => requestDelete(todo.id)}
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
              );
            })}
          </ul>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-slate-300">
        入力内容はこの端末に自動保存されます
      </p>
    </div>
  );
}
