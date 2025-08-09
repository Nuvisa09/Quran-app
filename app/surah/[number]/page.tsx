"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";

interface Ayat {
  nomorAyat: number;
  teksArab: string;
  teksLatin: string;
  teksIndonesia: string;
  audio: {
    "01": string;
    "02": string;
    "03": string;
    "04": string;
    "05": string;
  };
}

interface SurahDetail {
  nomor: number;
  nama: string;
  namaLatin: string;
  arti: string;
  jumlahAyat: number;
  tempatTurun: string;
  audioFull: {
    "01": string;
    "02": string;
    "03": string;
    "04": string;
    "05": string;
  };
  ayat: Ayat[];
}

type Bookmark = {
  surah: number;
  namaLatin: string;
  arti: string;
  ayat?: number;
};

export default function SurahDetailPage() {
  const params = useParams();
  const nomorSurah = params.number as string;
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isSurahBookmarked, setIsSurahBookmarked] = useState(false);
  const [bookmarkedAyats, setBookmarkedAyats] = useState<Bookmark[]>([]);

  const { data, isLoading, isError } = useQuery<SurahDetail>({
    queryKey: ["surah-detail", nomorSurah],
    queryFn: async () => {
      const response = await axios.get(
        `https://equran.id/api/v2/surat/${nomorSurah}`
      );
      return response.data.data;
    },
  });

  useEffect(() => {
    if (!data) return;

    // Bookmark Surah
    const savedSurahs: Bookmark[] = JSON.parse(
      localStorage.getItem("bookmarkedSurahs") || "[]"
    );
    setIsSurahBookmarked(
      savedSurahs.some((s) => s.surah === data.nomor && !s.ayat)
    );

    // Bookmark Ayat
    const savedAyats: Bookmark[] = JSON.parse(
      localStorage.getItem("bookmarkedAyats") || "[]"
    );

    const uniqueAyats = savedAyats.filter(
      (bookmark, index, self) =>
        index ===
        self.findIndex(
          (b) => b.surah === bookmark.surah && b.ayat === bookmark.ayat
        )
    );

    setBookmarkedAyats(savedAyats.filter((b) => b.surah === data.nomor));
    localStorage.setItem("bookmarkedAyats", JSON.stringify(uniqueAyats));
  }, [data]);

  const toggleBookmarkSurah = () => {
    if (!data) return;

    const saved: Bookmark[] = JSON.parse(
      localStorage.getItem("bookmarkedSurahs") || "[]"
    );

    const exists = saved.some((b) => b.surah === data.nomor && !b.ayat);
    let updated;

    if (exists) {
      updated = saved.filter((b) => !(b.surah === data.nomor && !b.ayat));
    } else {
      updated = [
        ...saved,
        {
          surah: data.nomor,
          namaLatin: data.namaLatin,
          arti: data.arti,
        },
      ];
    }

    localStorage.setItem("bookmarkedSurahs", JSON.stringify(updated));
    setIsSurahBookmarked(!exists);
  };

  // Toggle bookmark Ayat
  const toggleBookmarkAyat = (ayatNumber: number) => {
    if (!data) return;

    const saved: Bookmark[] = JSON.parse(
      localStorage.getItem("bookmarkedAyats") || "[]"
    );

    const exists = saved.some(
      (b) => b.surah === data.nomor && b.ayat === ayatNumber
    );
    let updated;

    if (exists) {
      updated = saved.filter(
        (b) => !(b.surah === data.nomor && b.ayat === ayatNumber)
      );
    } else {
      updated = [
        ...saved,
        {
          surah: data.nomor,
          namaLatin: data.namaLatin,
          arti: data.arti,
          ayat: ayatNumber,
        },
      ];
    }

    localStorage.setItem("bookmarkedAyats", JSON.stringify(updated));
    setBookmarkedAyats(updated.filter((b) => b.surah === data.nomor));
  };

  const playAudio = (audioUrl: string, ayatNumber: number) => {
    // stop current audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // if clicking the same ayat that's currently playing, stop it
    if (currentlyPlaying === ayatNumber) {
      setCurrentlyPlaying(null);
      return;
    }

    //create new audio element and play
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    setCurrentlyPlaying(ayatNumber);

    audio.play().catch((error) => {
      console.error("error playing audio:", error);
      setCurrentlyPlaying(null);
    });

    //Reset state when audio ends
    audio.onended = () => {
      // setCurrentlyPlaying(null);
      // audioRef.current = null;
      const currentIndex = data?.ayat.findIndex(
        (a) => a.nomorAyat === ayatNumber
      );
      const nextAyat =
        typeof currentIndex === "number" &&
        currentIndex !== -1 &&
        data?.ayat[currentIndex + 1]
          ? data.ayat[currentIndex + 1]
          : undefined;

      if (nextAyat) {
        //lanjut ke ayat berikutnya
        playAudio(nextAyat.audio["01"], nextAyat.nomorAyat);
      } else {
        //kalau habis, berhenti
        setCurrentlyPlaying(null);
        audioRef.current = null;
      }
    };

    //Handle audio errors
    audio.onerror = () => {
      setCurrentlyPlaying(null);
      audioRef.current = null;
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full size-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Memuat Surah...</p>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg">
            Terjadi kesalahan saat membuat surah!
          </p>
          <p className="next-slate-400 mt-2">Silakan coba lagi nanti.</p>
          <Link
            href="/"
            className="inline-block mt-4 px-4 py-2 bg-slate-700 rounded hover:bg-slate-600 transition-colors"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <main className="container mx-auto p-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-slate-400 hover:text-white mb-4 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Kembali ke Daftar Surat
          </Link>
          <div className="text-center bg-slate-800 rounded-lg p-6 border border-slate-700 relative">
            <button
              onClick={toggleBookmarkSurah}
              title={
                isSurahBookmarked ? "Hapus Bookmark Surah" : "Bookmark Surah"
              }
              className="absolute top-4 right-4"
            >
              {isSurahBookmarked ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  className="w-6 h-6 text-yellow-400"
                  viewBox="0 0 24 24"
                >
                  <path d="M5 3a2 2 0 0 0-2 2v16l9-4 9 4V5a2 2 0 0 0-2-2H5z" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  stroke="currentColor"
                  className="w-6 h-6 text-yellow-400"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 5v16l7-3 7 3V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2z"
                  />
                </svg>
              )}
            </button>
            <h1 className="text-3xl font-bold mb-2">{data.namaLatin}</h1>
            <p className="text-4xl font-mono mb-2 text-slate-300">
              {data.nama}
            </p>
            <p className="text-slate-400 mb-2">{data.arti}</p>
            <div className="flex justify-center gap-4 text-sm text-slate-500">
              <span>{data.jumlahAyat} ayat</span>
              <span>•</span>
              <span>{data.tempatTurun}</span>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          {data.ayat.map((ayat) => {
            const isAyatBookmarked = bookmarkedAyats.some(
              (b) => b.ayat === ayat.nomorAyat
            );
            return (
              <div
                key={ayat.nomorAyat}
                className="bg-slate-800 rounded-lg p-6 border border-slate-700"
              >
                {/* Ayat Number and Play Button */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center justify-center h-8 w-8 bg-slate-700 rounded-full text-sm font-bold">
                    {ayat.nomorAyat}
                  </div>
                  <button
                    onClick={() => playAudio(ayat.audio["01"], ayat.nomorAyat)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      currentlyPlaying === ayat.nomorAyat
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "bg-slate-700 hover:bg-slate-600 text-slate-300"
                    }`}
                    title={
                      currentlyPlaying === ayat.nomorAyat
                        ? "stop Audio"
                        : "Play Audio"
                    }
                  >
                    {currentlyPlaying === ayat.nomorAyat ? (
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                    <span className="text-sm">
                      {currentlyPlaying === ayat.nomorAyat ? "Stop" : "Play"}
                    </span>
                  </button>
                </div>
                {/* Arabic Text */}
                <div className="text-right mb-4">
                  <p
                    className="text-2xl leading-loose font-mono text-slate-200"
                    dir="rtl"
                  >
                    {ayat.teksArab}
                  </p>
                </div>
                {/*Latin Text */}
                <div className="mb-4">
                  <p className="text-slate-400 italic leading-relaxed">
                    {ayat.teksLatin}
                  </p>
                </div>
                {/* Indonesia TRanslation */}
                <div className="mb-4">
                  <p className="text-slate-200 leading-relaxed">
                    {ayat.teksIndonesia}
                  </p>
                </div>
                <div className="flex items-center justify-end gap-4">
                  <button
                    onClick={() => toggleBookmarkAyat(ayat.nomorAyat)}
                    title={
                      isAyatBookmarked ? "Hapus Bookmark Ayat" : "Bookmark Ayat"
                    }
                    className={`px-3 py-2 rounded-lg ${
                      isAyatBookmarked
                        ? "bg-yellow-400 text-slate-900 hover:bg-yellow-300"
                        : "bg-slate-700 text-white hover:bg-slate-600"
                    }`}
                  >
                    {isAyatBookmarked ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        className="w-6 h-6"
                      >
                        <path d="M5 3a2 2 0 0 0-2 2v16l7-5 7 5V5a2 2 0 0 0-2-2H5z" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                        className="w-6 h-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 3a2 2 0 0 0-2 2v16l7-5 7 5V5a2 2 0 0 0-2-2H5z"
                        />
                      </svg>
                    )}
                  </button>
                  <Link
                    href={`/surah/${nomorSurah}/${ayat.nomorAyat}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white border border-slate-700 rounded-full hover: bg-slate-700 hover:text-white hover:border-slate-400 transition-all duration-200"
                  >
                    <span>Detail Ayat</span>
                    {/* <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12H3m12 01-4 4m4-4l-4-4m8 8V8"
                      />
                    </svg> */}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
