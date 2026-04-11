"use client";

import type { ChangeEvent } from "react";
import { useEffect, useState } from "react";
import { useAppData } from "@/components/app-provider";
import { prepareImageForStorage } from "@/lib/image-client";
import type { DogGender } from "@/lib/types";

const genderOptions: DogGender[] = ["オス", "メス", "不明"];

type ProfileFormState = {
  name: string;
  breed: string;
  birthday: string;
  gender: DogGender;
  arrivalDate: string;
  currentWeight: string;
  photoUrl: string;
  catchPhrase: string;
  walkGoal: string;
  intelligenceGoal: string;
  trainingGoal: string;
};

function createFormState(data: ReturnType<typeof useAppData>["data"]): ProfileFormState {
  return {
    name: data.profile.name,
    breed: data.profile.breed,
    birthday: data.profile.birthday,
    gender: data.profile.gender,
    arrivalDate: data.profile.arrivalDate,
    currentWeight: String(data.profile.currentWeight),
    photoUrl: data.profile.photoUrl,
    catchPhrase: data.profile.catchPhrase,
    walkGoal: String(data.profile.dailyGoals.walkMinutes),
    intelligenceGoal: String(data.profile.dailyGoals.intelligenceMinutes),
    trainingGoal: String(data.profile.dailyGoals.trainingMinutes)
  };
}

export function ProfileForm() {
  const app = useAppData();
  const { updateProfile } = app;
  const [savedMessage, setSavedMessage] = useState("");
  const [imageMessage, setImageMessage] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [form, setForm] = useState<ProfileFormState>(() => createFormState(app.data));

  useEffect(() => {
    setForm(createFormState(app.data));
  }, [app.data]);

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const prepared = await prepareImageForStorage(file);
      setForm((current) => ({ ...current, photoUrl: prepared.dataUrl }));
      setSelectedFileName(prepared.fileName);
      setImageMessage(prepared.message);
    } catch (error) {
      setImageMessage(error instanceof Error ? error.message : "画像の読み込みに失敗しました。");
      setSelectedFileName("");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <form
      className="card space-y-5 p-5"
      onSubmit={(event) => {
        event.preventDefault();
        updateProfile({
          name: form.name,
          breed: form.breed,
          birthday: form.birthday,
          gender: form.gender,
          arrivalDate: form.arrivalDate,
          currentWeight: Number(form.currentWeight),
          photoUrl: form.photoUrl,
          catchPhrase: form.catchPhrase,
          dailyGoals: {
            walkMinutes: Number(form.walkGoal),
            intelligenceMinutes: Number(form.intelligenceGoal),
            trainingMinutes: Number(form.trainingGoal)
          }
        });
        setSavedMessage("プロフィールを保存しました");
        window.setTimeout(() => setSavedMessage(""), 2000);
      }}
    >
      <div>
        <label className="label" htmlFor="profile-photo-url">
          プロフィール写真URL
        </label>
        <input
          id="profile-photo-url"
          className="input"
          type="text"
          placeholder="https://example.com/dog-photo.jpg"
          value={form.photoUrl.startsWith("data:image/") ? "" : form.photoUrl}
          onChange={(event) => {
            setSelectedFileName("");
            setImageMessage("");
            setForm((current) => ({ ...current, photoUrl: event.target.value }));
          }}
        />
      </div>

      <div>
        <label className="label" htmlFor="profile-photo-file">
          端末からプロフィール写真を追加
        </label>
        <input
          id="profile-photo-file"
          className="input file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
          type="file"
          accept="image/*,.heic,.heif"
          onChange={handleImageChange}
        />
        <p className="mt-2 text-xs leading-5 text-ink/55">
          スマホで撮った大きめの写真も、アプリ側で自動的に軽くしてから保存します。
        </p>
        {selectedFileName ? <p className="mt-2 text-xs text-ink/60">選択中: {selectedFileName}</p> : null}
        {imageMessage ? <p className="mt-2 text-xs text-moss">{imageMessage}</p> : null}
        {form.photoUrl ? (
          <div className="mt-3 overflow-hidden rounded-3xl border border-sand bg-white">
            <img src={form.photoUrl} alt="プロフィール写真プレビュー" className="h-48 w-full object-cover" />
          </div>
        ) : null}
      </div>

      <div>
        <label className="label" htmlFor="profile-name">
          名前
        </label>
        <input
          id="profile-name"
          className="input"
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="profile-breed">
          犬種
        </label>
        <input
          id="profile-breed"
          className="input"
          value={form.breed}
          onChange={(event) => setForm((current) => ({ ...current, breed: event.target.value }))}
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="profile-birthday">
          誕生日
        </label>
        <input
          id="profile-birthday"
          className="input date-input"
          type="date"
          value={form.birthday}
          onChange={(event) => setForm((current) => ({ ...current, birthday: event.target.value }))}
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="profile-gender">
          性別
        </label>
        <select
          id="profile-gender"
          className="input"
          value={form.gender}
          onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value as DogGender }))}
        >
          {genderOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="profile-arrival-date">
          お迎え日
        </label>
        <input
          id="profile-arrival-date"
          className="input date-input"
          type="date"
          value={form.arrivalDate}
          onChange={(event) => setForm((current) => ({ ...current, arrivalDate: event.target.value }))}
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="profile-current-weight">
          現在体重
        </label>
        <input
          id="profile-current-weight"
          className="input"
          type="number"
          min="0"
          step="0.1"
          value={form.currentWeight}
          onChange={(event) => setForm((current) => ({ ...current, currentWeight: event.target.value }))}
          required
        />
      </div>

      <div className="space-y-4 rounded-3xl bg-cream px-4 py-4">
        <div>
          <p className="text-sm font-semibold text-ink">毎日の目標</p>
          <p className="mt-1 text-xs leading-5 text-ink/60">ホームの活動サマリーで使う目標分です。</p>
        </div>

        <div>
          <label className="label" htmlFor="profile-walk-goal">
            散歩目標（分）
          </label>
          <input
            id="profile-walk-goal"
            className="input"
            type="number"
            min="0"
            step="1"
            value={form.walkGoal}
            onChange={(event) => setForm((current) => ({ ...current, walkGoal: event.target.value }))}
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="profile-intelligence-goal">
            知育遊び目標（分）
          </label>
          <input
            id="profile-intelligence-goal"
            className="input"
            type="number"
            min="0"
            step="1"
            value={form.intelligenceGoal}
            onChange={(event) => setForm((current) => ({ ...current, intelligenceGoal: event.target.value }))}
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="profile-training-goal">
            トレーニング目標（分）
          </label>
          <input
            id="profile-training-goal"
            className="input"
            type="number"
            min="0"
            step="1"
            value={form.trainingGoal}
            onChange={(event) => setForm((current) => ({ ...current, trainingGoal: event.target.value }))}
            required
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="profile-catch-phrase">
          ひとことメッセージ
        </label>
        <textarea
          id="profile-catch-phrase"
          className="input min-h-24 resize-none"
          value={form.catchPhrase}
          onChange={(event) => setForm((current) => ({ ...current, catchPhrase: event.target.value }))}
          placeholder="今日もやさしく見守ろう"
        />
      </div>

      <button className="button-primary w-full" type="submit">
        プロフィールを保存
      </button>
      {form.photoUrl ? (
        <button
          type="button"
          className="button-secondary w-full"
          onClick={() => {
            setSelectedFileName("");
            setImageMessage("");
            setForm((current) => ({ ...current, photoUrl: "" }));
          }}
        >
          プロフィール写真を削除
        </button>
      ) : null}
      {savedMessage ? <p className="text-center text-sm text-moss">{savedMessage}</p> : null}
    </form>
  );
}
