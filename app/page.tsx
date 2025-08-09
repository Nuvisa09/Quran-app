"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";

interface Surah {
  nomor: number;
  nama: string;
  namaLatin: string;
  jumlahAyat: number;
  arti: string;
  audio: {
    full: string;
  };
}

type Bookmark = {
  surah: string;
  ayat: number;
  namaLatin: string;
  arti: string;
};

export default function HomePage() {
  const { data, isLoading, isError } = useQuery<Surah[]>({
    queryKey: ["daftar-surah"],
    queryFn: async () => {
      const response = await axios.get("https://equran.id/api/v2/surat");
      return response.data.data;
    },
  });

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("bookmarkedAyats");
    if (saved) {
      const parsed: Bookmark[] = JSON.parse(saved);

      // Bersihkan duplikat berdasarkan surah + ayat
      const uniqueBookmarks = parsed.filter(
        (bookmark, index, self) =>
          index ===
          self.findIndex(
            (b) => b.surah === bookmark.surah && b.ayat === bookmark.ayat
          )
      );

      setBookmarks(uniqueBookmarks);

      // Optional: Simpan lagi yang sudah bersih ke localStorage
      localStorage.setItem("bookmarkedAyats", JSON.stringify(uniqueBookmarks));
    }
  }, []);

  const removeBookmark = (index: number) => {
    const updated = bookmarks.filter((_, i) => i !== index);
    setBookmarks(updated);
    localStorage.setItem("bookmarkedAyats", JSON.stringify(updated));
  };

  const getSurahName = (nomor: string) => {
    const surahFound = data?.find((surah) => surah.nomor === parseInt(nomor));
    return surahFound ? surahFound.namaLatin : "Unknown Surah";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex justify-center items-center text-white">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full size-16 border-4 border-white mx-auto mb-4"></div>
          <p className="text-lg font-semibold animate-pulse">Loading Data</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-slate-900 flex justify-center items-center text-white">
        <div className="border border-red-400 text-red-700 px-6 py-4 rounded shadow-md text-center">
          <div className="text-5xl mb-2">⚠️</div>
          <h2 className="text-xl font-bold mb-2">Oops! Gagal Memuat Data</h2>
          <p className="mb-4">
            Terjadi kesalahan saat mengambil data. Silakan coba lagi.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans">
      <main className="container mx-auto p-6 py-8 lg:p-12">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-extrabold mb-3 tracking-tight drop-shadow-lg">
            {"Al-Qur'an"}
          </h1>
          <p className="text-lg text-white max-w-xl mx-auto">
            Daftar Surah {"Al-Qur'an"} dengan Terjemahan Indonesia
          </p>
        </header>
        {bookmarks.length > 0 && (
          <section className="mb-10 max-w-4xl mx-auto bg-slate-800 bg-opacity-10 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white border-opacity-20">
            <h2 className="text-3xl font-semibold mb-5 flex items-center gap-3">
              <span className="text-yellow-400">📌 Bookmark Ayat </span>
            </h2>
            <ul className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent ">
              {/* Daftar Bookmark*/}
              {bookmarks.map((bookmark, index) => (
                <li
                  key={index}
                  className="flex justify-between items-center bg-slate-600 bg-opacity-10 hover:bg-yellow-400 hover:bg-opacity-30 transition rounded-lg p-3  shadow-md cursor-pointer "
                >
                  <Link
                    href={`/surah/${bookmark.surah}/${bookmark.ayat}`}
                    className="flex justify-between items-center text-white font-medium hover:text-slate-700"
                  >
                    <span>
                      Surah {bookmark.surah} -{" "}
                      <span className="italic">
                        {getSurahName(bookmark.surah)}{" "}
                      </span>
                      Ayat {bookmark.ayat}
                    </span>
                  </Link>

                  {/* Tombol Hapus */}
                  <button
                    onClick={() => removeBookmark(index)}
                    className="ml-3 p-1 rounded-full hover:text-red-500 transition"
                    title="Hapus Bookmark"
                  >
                    <Trash2
                      size={18}
                      className="text-red-400 hover:text-red-800"
                    />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {data?.map((surah) => (
            <Link
              key={surah.nomor}
              href={`/surah/${surah.nomor}`}
              className="block p-6 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors duration-200 border border-slate-700 hover:border-slate-600"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center justify-center h-12 w-12 bg-slate-700 rounded-full text-sm font-bold">
                    {surah.nomor}
                  </div>
                  <div>
                    <h2 className="font-bold text-xl">{surah.namaLatin}</h2>
                    <p className="text-sm text-slate-400">{surah.arti}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {surah.jumlahAyat} ayat
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-2xl text-slate-300">
                    {surah.nama}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
