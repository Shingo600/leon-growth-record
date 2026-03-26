"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useAppData } from "@/components/app-provider";
import { FoodCategory, FoodItem } from "@/lib/types";

const categories: FoodCategory[] = ["ドライ", "ウェット", "おやつ", "サプリ"];

type FormState = {
  productName: string;
  maker: string;
  category: FoodCategory;
  caloriesPer100g: string;
  servingSize: string;
  memo: string;
  openedDate: string;
  price: string;
  contentAmount: string;
};

function createEmptyForm(): FormState {
  return {
    productName: "",
    maker: "",
    category: "ドライ",
    caloriesPer100g: "0",
    servingSize: "0",
    memo: "",
    openedDate: "",
    price: "",
    contentAmount: ""
  };
}

function createEditForm(item: FoodItem): FormState {
  return {
    productName: item.productName,
    maker: item.maker,
    category: item.category,
    caloriesPer100g: String(item.caloriesPer100g),
    servingSize: String(item.servingSize),
    memo: item.memo,
    openedDate: item.openedDate,
    price: item.price === null ? "" : String(item.price),
    contentAmount: item.contentAmount === null ? "" : String(item.contentAmount)
  };
}

function ModalShell({
  title,
  children,
  onClose
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[120] bg-ink/35" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="flex min-h-full items-end justify-center px-4 pb-6 pt-10 sm:items-center">
        <div
          className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-[2rem] bg-white p-5 shadow-card"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <h4 className="text-lg font-semibold">{title}</h4>
            <button type="button" className="button-secondary cursor-pointer px-4 py-2" onClick={onClose}>
              閉じる
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

export function FoodDatabaseManager() {
  const { data, addFoodItem, updateFoodItem, deleteFoodItem } = useAppData();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(createEmptyForm());

  const foodItems = useMemo(
    () => [...data.foodItems].sort((left, right) => left.productName.localeCompare(right.productName)),
    [data.foodItems]
  );

  function closeModal() {
    setOpen(false);
    setEditingId(null);
    setForm(createEmptyForm());
  }

  return (
    <section className="card relative z-10 isolate space-y-4 p-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm text-ink/60">ごはんデータベース</p>
          <h3 className="mt-1 text-xl font-semibold">登録フードを管理</h3>
        </div>
        <button
          type="button"
          className="button-primary cursor-pointer"
          onClick={() => {
            setEditingId(null);
            setForm(createEmptyForm());
            setOpen(true);
          }}
        >
          フードを追加
        </button>
      </div>

      <p className="text-sm leading-6 text-ink/70">
        ごはん記録で選ぶ候補をここで管理します。商品名、カロリー、1食目安を先に入れておくと入力が楽になります。
      </p>

      <div className="space-y-3">
        {foodItems.map((item) => (
          <article key={item.id} className="rounded-3xl bg-cream px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-ink/55">{item.category}</p>
                <p className="mt-1 text-lg font-semibold">{item.productName}</p>
                <p className="mt-1 text-sm text-ink/70">{item.maker}</p>
              </div>
              <div className="shrink-0 text-right text-sm text-ink/65">
                <p>{item.caloriesPer100g}kcal / 100g</p>
                <p className="mt-1">目安 {item.servingSize}g</p>
              </div>
            </div>

            {item.memo ? <p className="mt-3 text-sm text-ink/70">{item.memo}</p> : null}

            <div className="mt-4 flex gap-3">
              <button
                type="button"
                className="button-secondary flex-1 cursor-pointer"
                onClick={() => {
                  setEditingId(item.id);
                  setForm(createEditForm(item));
                  setOpen(true);
                }}
              >
                編集
              </button>
              <button
                type="button"
                className="button-secondary flex-1 cursor-pointer"
                onClick={() => {
                  if (window.confirm(`${item.productName} をデータベースから削除しますか？`)) {
                    deleteFoodItem(item.id);
                  }
                }}
              >
                削除
              </button>
            </div>
          </article>
        ))}
      </div>

      {open ? (
        <ModalShell title={editingId ? "フードを編集" : "フードを追加"} onClose={closeModal}>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();

              const nextItem = {
                productName: form.productName,
                maker: form.maker,
                category: form.category,
                caloriesPer100g: Number(form.caloriesPer100g),
                servingSize: Number(form.servingSize),
                memo: form.memo,
                openedDate: form.openedDate,
                price: form.price ? Number(form.price) : null,
                contentAmount: form.contentAmount ? Number(form.contentAmount) : null
              };

              if (editingId) {
                updateFoodItem(editingId, nextItem);
              } else {
                addFoodItem(nextItem);
              }

              closeModal();
            }}
          >
            <div>
              <label className="label" htmlFor="food-product-name">商品名</label>
              <input
                id="food-product-name"
                className="input"
                value={form.productName}
                onChange={(event) => setForm((current) => ({ ...current, productName: event.target.value }))}
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="food-maker">メーカー</label>
              <input
                id="food-maker"
                className="input"
                value={form.maker}
                onChange={(event) => setForm((current) => ({ ...current, maker: event.target.value }))}
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="food-category">区分</label>
              <select
                id="food-category"
                className="input"
                value={form.category}
                onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as FoodCategory }))}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="food-calories">100gあたりカロリー</label>
                <input
                  id="food-calories"
                  className="input"
                  type="number"
                  min="0"
                  value={form.caloriesPer100g}
                  onChange={(event) => setForm((current) => ({ ...current, caloriesPer100g: event.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="label" htmlFor="food-serving-size">1食目安（g）</label>
                <input
                  id="food-serving-size"
                  className="input"
                  type="number"
                  min="0"
                  value={form.servingSize}
                  onChange={(event) => setForm((current) => ({ ...current, servingSize: event.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="food-opened-date">開封日</label>
                <input
                  id="food-opened-date"
                  className="input date-input"
                  type="date"
                  value={form.openedDate}
                  onChange={(event) => setForm((current) => ({ ...current, openedDate: event.target.value }))}
                />
              </div>

              <div>
                <label className="label" htmlFor="food-price">価格</label>
                <input
                  id="food-price"
                  className="input"
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="food-content-amount">内容量（g）</label>
              <input
                id="food-content-amount"
                className="input"
                type="number"
                min="0"
                value={form.contentAmount}
                onChange={(event) => setForm((current) => ({ ...current, contentAmount: event.target.value }))}
              />
            </div>

            <div>
              <label className="label" htmlFor="food-memo">メモ</label>
              <textarea
                id="food-memo"
                className="input min-h-24 resize-none"
                value={form.memo}
                onChange={(event) => setForm((current) => ({ ...current, memo: event.target.value }))}
              />
            </div>

            <button type="submit" className="button-primary w-full cursor-pointer">
              {editingId ? "更新する" : "登録する"}
            </button>
          </form>
        </ModalShell>
      ) : null}
    </section>
  );
}
