"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";

type Ayat = {
  nomorAyat: number;
  teksArab: string;
  teksLatin: string;
  teksIndonesia: string;
  audio: {
    [key: string]: string;
  };
};

export default function AyatDetailPage() {
  const params = useParams();
  const numberParam = params?.number || "";
  const ayatParam = params?.ayat || "";

  const number = Array.isArray(numberParam)
    ? numberParam[0]
    : numberParam || "";
  const ayat = Array.isArray(ayatParam) ? ayatParam[0] : ayatParam || "";

  const [ayatData, setAyatData] = useState<Ayat | null>(null);
  const [namaLatin, setNamaLatin] = useState("");
  const [nama, setNama] = useState("");
  const [jumlahAyat, setJumlahAyat] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Ambil data ayat dari API
  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(`https://equran.id/api/v2/surat/${number}`);
      const result = await res.json();

      const ayatDetail = result.data.ayat.find(
        (a: Ayat) => String(a.nomorAyat) === ayat
      );

      setAyatData(ayatDetail);
      setNamaLatin(result.data.namaLatin);
      setNama(result.data.nama);
      setJumlahAyat(result.data.jumlahAyat);
    };

    fetchData();
  }, [number, ayat]);

  // Cek apakah ayat ini sudah di-bookmark
  useEffect(() => {
    const savedBookmarks = JSON.parse(
      localStorage.getItem("bookmarkedAyats") || "[]"
    );
    const exists = savedBookmarks.some(
      (b: { surah: string; ayat: string }) =>
        b.surah === number && b.ayat === ayat
    );
    setIsBookmarked(exists);
  }, [number, ayat]);

  // Toggle bookmark
  const toggleBookmark = () => {
    const key = "bookmarkedAyats";
    let current = JSON.parse(localStorage.getItem(key) || "[]");

    if (isBookmarked) {
      //hapus dari bookmark
      current = current.filter(
        (b: { surah: string; ayat: string }) =>
          !(b.surah === number && b.ayat === ayat)
      );
    } else {
      //Tambah ke bookmark
      current.push({ surah: number, ayat: ayat });
    }

    localStorage.setItem(key, JSON.stringify(current));
    setIsBookmarked(!isBookmarked);
  };

  // play / pause audio
  const handleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  if (!ayatData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white animate-pulse">
        Memuat data ayat...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-3xl w-full bg-slate-800/80 backdrop-blur-md shadow-xl rounded-2xl p-8 border border-slate-600 transition-all hover:shadow-2xl">
        <div className="mb-6 flex justify-between items-center">
          <Link
            href={`/surah/${number}`}
            className="inline-flex items-center px-3 py-2 text-slate-300 rounded-lg hover:text-white hover:bg-slate-700/60 transition-all"
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
            Kembali
          </Link>

          {/* Tombol bookmark*/}
          {/* <button
            onClick={toggleBookmark}
            className={`p-2 rounded-lg transition-all shadow-sm ${
              isBookmarked
                ? "bg-yellow-500 text-black hover:bg-yellow-600"
                : "bg-slate-600 text-white hover:bg-slate-500"
            }`}
            title={isBookmarked ? "Hapus Bookmark" : "Simpan Bookmark"}
          >
            {isBookmarked ? (
              // icon bookmark aktif
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M5 3a2 2 0 00-2 2v13l7-4 7 4V5a2 2 0 00-2-2H5z" />
              </svg>
            ) : (
              //Ikon bookmark Kosong
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-4-8 4V5z"
                />
              </svg>
            )}
          </button> */}
        </div>

        {/* Judul */}
        <h1 className="text-3xl font-bold text-center mb-4 text-white tracking-wider">
          {namaLatin} <span className="text-slate-400"> ({nama}) </span>
        </h1>
        <p className="text-center text-gray-400 mb-6 text-sm">
          Ayat ke-{ayat} dari {jumlahAyat}
        </p>

        {/* Teks Arab */}
        <p className="text-right text-4xl font-arabic leading-loose text-white mb-6 tracking-wider">
          {ayatData.teksArab}
        </p>

        {/* Tombol Audio */}
        {ayatData.audio?.["01"] && (
          <div className="flex justify-center mb-6">
            <button
              onClick={handleAudio}
              className="px-5 py-2 bg-emerald-600 text-white rounded-lg shadow hover:bg-emerald-500 transition-all"
            >
              {isPlaying ? "⏸ Pause Audio" : "▶ Putar Audio"}
            </button>
            <audio
              ref={audioRef}
              src={ayatData.audio["01"]}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
            />
          </div>
        )}

        {/* Teks Latin */}
        <p className="italic text-white/80 mb-4 text-lg">
          {ayatData.teksLatin}
        </p>

        {/* Teks Indonesia */}
        <p className="text-lg text-gray-900 bg-gray-50/90 p-4 rounded-xl border border-gray-200 shadow-inner leading-relaxed">
          {ayatData.teksIndonesia}
        </p>
        <div className="flex justify-between mt-8">
          {parseInt(ayat) > 1 ? (
            <Link
              href={`/surah/${number}/${parseInt(ayat) - 1}`}
              className="px-5 py-2 bg-slate-700 text-white rounded-lg shadow hover:bg-white hover:text-slate-800 transition-all"
            >
              Ayat Sebelumnya
            </Link>
          ) : (
            <div></div>
          )}
          {parseInt(ayat) < jumlahAyat ? (
            <Link
              href={`/surah/${number}/${parseInt(ayat) + 1}`}
              className="px-5 py-2 bg-slate-700 text-white rounded-lg dhadow hover:text-slate-800 hover:bg-white transition-all"
            >
              Ayat Selanjutnya
            </Link>
          ) : (
            <div></div>
          )}
        </div>
      </div>
    </div>
  );
}
