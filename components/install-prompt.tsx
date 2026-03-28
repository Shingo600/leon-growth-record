"use client";

import { useEffect, useMemo, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function detectIos() {
  if (typeof window === "undefined") {
    return false;
  }

  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function detectStandalone() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(display-mode: standalone)").matches;
}

export function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setIsStandalone(detectStandalone());
    setIsIos(detectIos());

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setInstallEvent(null);
      setIsStandalone(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const statusText = useMemo(() => {
    if (isStandalone) {
      return "ホーム画面に追加済みです。アプリのように開けます。";
    }

    if (installEvent) {
      return "この端末ではホーム画面に追加できます。ボタンからインストールを進めてください。";
    }

    if (isIos) {
      return "iPhoneでは Safari の共有メニューから「ホーム画面に追加」で使えます。";
    }

    return "このブラウザでは自動のインストール案内が出ていません。Chrome 系ブラウザだと表示されやすいです。";
  }, [installEvent, isIos, isStandalone]);

  async function handleInstall() {
    if (!installEvent) {
      return;
    }

    await installEvent.prompt();
    const choice = await installEvent.userChoice;

    if (choice.outcome === "accepted") {
      setInstallEvent(null);
    }
  }

  if (dismissed) {
    return null;
  }

  return (
    <section className="card mb-5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">ホーム画面追加</p>
          <p className="mt-1 text-sm leading-6 text-ink/65">{statusText}</p>
          {isIos && !isStandalone ? (
            <p className="mt-2 text-xs leading-5 text-ink/50">
              Safari の共有ボタンから「ホーム画面に追加」を選んでください。
            </p>
          ) : null}
        </div>
        {installEvent ? (
          <button type="button" className="button-secondary shrink-0 px-4 py-2" onClick={handleInstall}>
            追加する
          </button>
        ) : (
          <button type="button" className="button-secondary shrink-0 px-4 py-2" onClick={() => setDismissed(true)}>
            閉じる
          </button>
        )}
      </div>
    </section>
  );
}
