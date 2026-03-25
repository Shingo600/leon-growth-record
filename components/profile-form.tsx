"use client";

import { useEffect, useState } from "react";
import { useAppData } from "@/components/app-provider";
import { DogGender } from "@/lib/types";

const genderOptions: DogGender[] = ["オス", "メス", "不明"];

export function ProfileForm() {
  const { data, updateProfile } = useAppData();
  const [savedMessage, setSavedMessage] = useState("");
  const [form, setForm] = useState({
    ...data.profile,
    currentWeight: String(data.profile.currentWeight)
  });

  useEffect(() => {
    setForm({
      ...data.profile,
      currentWeight: String(data.profile.currentWeight)
    });
  }, [data.profile]);

  return (
    <form
      className="card space-y-5 p-5"
      onSubmit={(event) => {
        event.preventDefault();
        updateProfile({
          ...form,
          currentWeight: Number(form.currentWeight)
        });
        setSavedMessage("プロフィールを保存しました");
        window.setTimeout(() => setSavedMessage(""), 2000);
      }}
    >
      <div>
        <label className="label" htmlFor="profile-name">名前</label>
        <input
          id="profile-name"
          className="input"
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="profile-breed">犬種</label>
        <input
          id="profile-breed"
          className="input"
          value={form.breed}
          onChange={(event) => setForm((current) => ({ ...current, breed: event.target.value }))}
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="profile-birthday">誕生日</label>
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
        <label className="label" htmlFor="profile-gender">性別</label>
        <select
          id="profile-gender"
          className="input"
          value={form.gender}
          onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value as DogGender }))}
        >
          {genderOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="profile-arrival-date">お迎え日</label>
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
        <label className="label" htmlFor="profile-current-weight">現在体重</label>
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

      <button className="button-primary w-full" type="submit">プロフィールを保存</button>
      {savedMessage ? <p className="text-center text-sm text-moss">{savedMessage}</p> : null}
    </form>
  );
}
