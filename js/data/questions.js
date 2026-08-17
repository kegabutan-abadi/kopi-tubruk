/**
 * KOPI TUBRUK - TTS Questions & Grids Data (Massive Expanded Edition)
 * Categories:
 * 1. Pengetahuan Umum
 * 2. Sejarah & Peradaban
 * 3. IPTEK & Digital
 * 4. Geografi & Alam
 * 5. Seni & Budaya
 * 6. Olahraga & Kesehatan
 * 7. Filsafat & Substansi
 * 8. Bahasa & Sastra
 */

const TTS_DATA = {
  level1: {
    id: "level1",
    title: "Pengetahuan Umum",
    icon: "💡",
    cols: 9,
    rows: 9,
    solutionClean: [
      ['K', 'O', 'P', 'I', null, 'B', 'A', 'T', 'I'],
      [null, null, 'A', null, 'M', null, null, null, 'N'],
      ['S', 'U', 'M', 'A', 'T', 'R', 'A', null, 'D'],
      [null, null, 'P', null, 'A', null, 'I', null, 'O'],
      ['K', 'E', 'U', 'A', 'N', 'G', 'A', 'N', 'N'],
      [null, null, 'N', null, 'T', null, null, null, 'E'],
      ['A', 'S', 'I', 'A', null, 'K', 'O', 'M', 'E'],
      [null, null, 'A', null, 'B', null, null, null, null],
      ['M', 'O', 'T', 'O', 'R', null, null, null, null]
    ],
    numbers: [
      { row: 0, col: 0, num: 1 },
      { row: 0, col: 5, num: 2 },
      { row: 0, col: 8, num: 3 },
      { row: 1, col: 4, num: 4 },
      { row: 2, col: 0, num: 5 },
      { row: 4, col: 0, num: 6 },
      { row: 6, col: 0, num: 7 },
      { row: 6, col: 5, num: 8 },
      { row: 8, col: 0, num: 9 }
    ],
    clues: {
      across: [
        { num: 1, row: 0, col: 0, len: 4, clue: "Minuman hitam beraroma khas hasil seduhan biji sangrai" },
        { num: 2, row: 0, col: 5, len: 4, clue: "Kain khas Indonesia karya seni ukir malam" },
        { num: 5, row: 2, col: 0, len: 7, clue: "Pulau terbesar ke-6 di dunia yang ada di Indonesia" },
        { num: 6, row: 4, col: 0, len: 9, clue: "Sektor pengelolaan dana atau uang negara/perusahaan" },
        { num: 7, row: 6, col: 0, len: 4, clue: "Benua terbesar dan terpopuler di bumi" },
        { num: 8, row: 6, col: 5, len: 4, clue: "Benda langit berbuntut es dan debu" },
        { num: 9, row: 8, col: 0, len: 5, clue: "Kendaraan bermotor roda dua" }
      ],
      down: [
        { num: 1, row: 0, col: 2, len: 9, clue: "Hasil karya seni menggambar atau melukis di kertas" },
        { num: 3, row: 0, col: 8, len: 7, clue: "Negara kepulauan tetangga di utara Kalimantan" },
        { num: 4, row: 0, col: 4, len: 6, clue: "Mata uang resmi negara Thailand" }
      ]
    }
  },

  level2: {
    id: "level2",
    title: "Sejarah & Peradaban",
    icon: "🏛️",
    cols: 9,
    rows: 9,
    solutionClean: [
      ['S', 'O', 'E', 'K', 'A', 'R', 'N', 'O', null],
      [null, null, 'G', null, 'C', null, null, null, null],
      ['B', 'O', 'R', 'O', 'B', 'U', 'D', 'U', 'R'],
      [null, null, 'E', null, 'E', null, null, null, 'E'],
      ['P', 'R', 'O', 'K', 'L', 'A', 'M', 'A', 'S'],
      [null, null, 'A', null, 'H', null, null, null, 'I'],
      ['M', 'A', 'J', 'A', 'P', 'A', 'H', 'I', 'T'],
      [null, null, 'A', null, null, null, null, null, null],
      ['N', 'A', 'S', 'I', 'O', 'N', 'A', 'L', null]
    ],
    numbers: [
      { row: 0, col: 0, num: 1 },
      { row: 0, col: 2, num: 2 },
      { row: 0, col: 4, num: 3 },
      { row: 2, col: 0, num: 4 },
      { row: 2, col: 8, num: 5 },
      { row: 4, col: 0, num: 6 },
      { row: 6, col: 0, num: 7 },
      { row: 8, col: 0, num: 8 }
    ],
    clues: {
      across: [
        { num: 1, row: 0, col: 0, len: 8, clue: "Proklamator dan Presiden pertama Republik Indonesia" },
        { num: 4, row: 2, col: 0, len: 9, clue: "Candi Buddha terbesar di dunia yang terletak di Magelang" },
        { num: 6, row: 4, col: 0, len: 9, clue: "Naskah pernyataan kemerdekaan Indonesia 17 Agustus 1945" },
        { num: 7, row: 6, col: 0, len: 9, clue: "Kerajaan bahari terbesar di Nusantara berpusat di Jawa Timur" },
        { num: 8, row: 8, col: 0, len: 8, clue: "Skala wawasan kebangsaan tanah air" }
      ],
      down: [
        { num: 2, row: 0, col: 2, len: 8, clue: "Negara piramida kuno di sepanjang sungai Nil (Mesir kuno)" },
        { num: 3, row: 0, col: 4, len: 7, clue: "Provinsi berjuluk Serambi Mekkah di ujung barat Indonesia" },
        { num: 5, row: 2, col: 8, len: 5, clue: "Kerajaan kuno penggagas Sumpah Palapa" }
      ]
    }
  },

  level3: {
    id: "level3",
    title: "IPTEK & Digital",
    icon: "🔬",
    cols: 9,
    rows: 9,
    solutionClean: [
      ['C', 'O', 'D', 'I', 'N', 'G', null, null, null],
      ['O', null, null, null, 'E', null, 'A', null, null],
      ['M', 'A', 'T', 'E', 'M', 'A', 'T', 'I', 'K'],
      ['P', null, null, null, 'O', null, 'O', null, null],
      ['U', 'N', 'I', 'V', 'E', 'R', 'S', 'U', 'M'],
      ['T', null, null, null, 'N', null, null, null, null],
      ['E', 'N', 'K', 'R', 'I', 'P', 'S', 'I', null],
      ['R', null, null, null, null, null, null, null, null],
      ['R', 'O', 'B', 'O', 'T', 'I', 'K', 'S', null]
    ],
    numbers: [
      { row: 0, col: 0, num: 1 },
      { row: 0, col: 4, num: 2 },
      { row: 1, col: 6, num: 3 },
      { row: 2, col: 0, num: 4 },
      { row: 4, col: 0, num: 5 },
      { row: 6, col: 0, num: 6 },
      { row: 8, col: 0, num: 7 }
    ],
    clues: {
      across: [
        { num: 1, row: 0, col: 0, len: 6, clue: "Aktivitas menulis perintah kode pemrograman komputer" },
        { num: 4, row: 2, col: 0, len: 9, clue: "Ilmu pasti tentang angka, struktur, dan logika" },
        { num: 5, row: 4, col: 0, len: 9, clue: "Seluruh ruang waktu kontinu beserta materi dan energi" },
        { num: 6, row: 6, col: 0, len: 8, clue: "Metode pengamanan data dengan mengubah teks menjadi sandi acak" },
        { num: 7, row: 8, col: 0, len: 8, clue: "Cabang teknologi yang merancang dan membuat mesin otomatis" }
      ],
      down: [
        { num: 1, row: 0, col: 0, len: 8, clue: "Perangkat elektronik pengolah data berkecepatan tinggi" },
        { num: 2, row: 0, col: 4, len: 7, clue: "Jaringan gas pembawa cahaya warna-warni pada papan reklame" },
        { num: 3, row: 1, col: 6, len: 4, clue: "Bagian terkecil dari materi yang tidak dapat dibagi lagi" }
      ]
    }
  },

  level4: {
    id: "level4",
    title: "Geografi & Alam",
    icon: "🌍",
    cols: 9,
    rows: 9,
    solutionClean: [
      ['O', 'K', 'S', 'I', 'G', 'E', 'N', null, null],
      [null, null, null, null, 'U', null, null, null, null],
      ['S', 'A', 'M', 'U', 'D', 'R', 'A', null, null],
      [null, null, null, null, 'U', null, null, null, null],
      ['E', 'V', 'E', 'R', 'E', 'S', 'T', null, null],
      [null, null, null, null, 'N', null, null, null, null],
      ['M', 'E', 'R', 'A', 'P', 'I', null, null, null],
      [null, null, null, null, 'G', null, null, null, null],
      ['H', 'I', 'M', 'A', 'L', 'A', 'Y', 'A', null]
    ],
    numbers: [
      { row: 0, col: 0, num: 1 },
      { row: 0, col: 4, num: 2 },
      { row: 2, col: 0, num: 3 },
      { row: 4, col: 0, num: 4 },
      { row: 6, col: 0, num: 5 },
      { row: 8, col: 0, num: 6 }
    ],
    clues: {
      across: [
        { num: 1, row: 0, col: 0, len: 7, clue: "Gas tak berwarna yang dihirup makhluk hidup untuk bernapas" },
        { num: 3, row: 2, col: 0, len: 7, clue: "Lautan luas yang memisahkan benua-benua di bumi" },
        { num: 4, row: 4, col: 0, len: 7, clue: "Puncak gunung tertinggi di dunia di perbatasan Nepal & Tibet" },
        { num: 5, row: 6, col: 0, len: 6, clue: "Gunung berapi teraktif di pulau Jawa di Yogyakarta" },
        { num: 6, row: 8, col: 0, len: 8, clue: "Pegunungan tertinggi di benua Asia" }
      ],
      down: [
        { num: 2, row: 0, col: 4, len: 9, clue: "Daratan yang menjulang tinggi secara alami di permukaan bumi" }
      ]
    }
  },

  level5: {
    id: "level5",
    title: "Seni & Budaya",
    icon: "🎨",
    cols: 9,
    rows: 9,
    solutionClean: [
      ['G', 'A', 'M', 'E', 'L', 'A', 'N', null, null],
      ['A', null, null, null, 'E', null, null, null, null],
      ['R', 'E', 'O', 'G', 'G', null, null, null, null],
      ['U', null, null, null, 'E', null, null, null, null],
      ['D', 'A', 'M', 'A', 'R', null, null, null, null],
      ['A', null, null, null, 'D', null, null, null, null],
      ['K', 'E', 'R', 'I', 'S', null, null, null, null],
      [null, null, null, null, null, null, null, null, null],
      ['W', 'A', 'Y', 'A', 'N', 'G', null, null, null]
    ],
    numbers: [
      { row: 0, col: 0, num: 1 },
      { row: 0, col: 4, num: 2 },
      { row: 2, col: 0, num: 3 },
      { row: 4, col: 0, num: 4 },
      { row: 6, col: 0, num: 5 },
      { row: 8, col: 0, num: 6 }
    ],
    clues: {
      across: [
        { num: 1, row: 0, col: 0, len: 7, clue: "Ensembel musik tradisional khas Jawa dan Bali" },
        { num: 3, row: 2, col: 0, len: 4, clue: "Tarian tradisional Ponorogo berwujud topeng merak besar" },
        { num: 4, row: 4, col: 0, len: 5, clue: "Lampu penerangan tradisional minyak kelapa" },
        { num: 5, row: 6, col: 0, len: 5, clue: "Senjata tradisional berlekuk khas Nusantara warisan UNESCO" },
        { num: 6, row: 8, col: 0, len: 6, clue: "Seni pertunjukan bayangan kulit khas Indonesia" }
      ],
      down: [
        { num: 1, row: 0, col: 0, len: 6, clue: "Burung mitologi gagah lambang negara Indonesia" },
        { num: 2, row: 0, col: 4, len: 7, clue: "Kisah dongeng rakyat tradisional warisan lisan" }
      ]
    }
  },

  level6: {
    id: "level6",
    title: "Olahraga & Kesehatan",
    icon: "⚽",
    cols: 9,
    rows: 9,
    solutionClean: [
      ['S', 'E', 'P', 'A', 'K', 'B', 'O', 'L', 'A'],
      ['T', null, null, null, null, null, null, null, null],
      ['A', null, null, null, null, null, null, null, null],
      ['M', 'A', 'R', 'A', 'T', 'O', 'N', null, null],
      ['I', null, null, null, null, null, null, null, null],
      ['N', 'U', 'T', 'R', 'I', 'S', 'I', null, null],
      ['A', null, null, null, null, null, null, null, null],
      ['V', 'I', 'T', 'A', 'M', 'I', 'N', null, null],
      ['O', 'L', 'A', 'H', 'R', 'A', 'G', 'A', null]
    ],
    numbers: [
      { row: 0, col: 0, num: 1 },
      { row: 3, col: 0, num: 2 },
      { row: 5, col: 0, num: 3 },
      { row: 7, col: 0, num: 4 },
      { row: 8, col: 0, num: 5 }
    ],
    clues: {
      across: [
        { num: 1, row: 0, col: 0, len: 9, clue: "Olahraga populer 11 melawan 11 pemain di lapangan rumput" },
        { num: 2, row: 3, col: 0, len: 7, clue: "Lari jarak jauh sejauh 42,195 kilometer" },
        { num: 3, row: 5, col: 0, len: 7, clue: "Asupan zat gizi penting untuk kesehatan tubuh" },
        { num: 4, row: 7, col: 0, len: 7, clue: "Zat organik pembantu metabolisme (seperti A, B, C, D)" },
        { num: 5, row: 8, col: 0, len: 8, clue: "Aktivitas fisik teratur untuk menjaga kebugaran jasmani" }
      ],
      down: [
        { num: 1, row: 0, col: 0, len: 7, clue: "Daya tahan fisik tubuh dalam beraktivitas lama" }
      ]
    }
  },

  level7: {
    id: "level7",
    title: "Filsafat & Logika",
    icon: "🧠",
    cols: 9,
    rows: 9,
    solutionClean: [
      ['S', 'U', 'B', 'S', 'T', 'A', 'N', 'S', 'I'],
      ['U', null, null, null, null, null, null, null, null],
      ['B', 'A', 'R', 'A', 'T', null, null, null, null],
      ['J', null, null, null, null, null, null, null, null],
      ['E', 'T', 'I', 'K', 'A', null, null, null, null],
      ['K', null, null, null, null, null, null, null, null],
      ['T', 'E', 'O', 'R', 'I', null, null, null, null],
      ['I', null, null, null, null, null, null, null, null],
      ['F', 'I', 'L', 'S', 'A', 'F', 'A', 'T', null]
    ],
    numbers: [
      { row: 0, col: 0, num: 1 },
      { row: 2, col: 0, num: 2 },
      { row: 4, col: 0, num: 3 },
      { row: 6, col: 0, num: 4 },
      { row: 8, col: 0, num: 5 }
    ],
    clues: {
      across: [
        { num: 1, row: 0, col: 0, len: 9, clue: "Hakekat inti atau wujud terdalam dari suatu perkara (Topik Kopi Tubruk!)" },
        { num: 2, row: 2, col: 0, len: 5, clue: "Arah matahari terbenam atau tradisi pemikiran Eropa" },
        { num: 3, row: 4, col: 0, len: 5, clue: "Cabang filsafat moral tentang mana yang baik dan buruk" },
        { num: 4, row: 6, col: 0, len: 5, clue: "Serangkaian asumsi dan gagasan ilmiah pengjelas fenomena" },
        { num: 5, row: 8, col: 0, len: 8, clue: "Ilmu tentang pencarian kebenaran dan hikmah berpikir mendalam" }
      ],
      down: [
        { num: 1, row: 0, col: 0, len: 9, clue: "Penilaian berbasis sudut pandang atau selera pribadi" }
      ]
    }
  },

  level8: {
    id: "level8",
    title: "Bahasa & Sastra",
    icon: "📖",
    cols: 9,
    rows: 9,
    solutionClean: [
      ['S', 'A', 'S', 'T', 'R', 'A', null, null, null],
      ['Y', null, null, null, null, null, null, null, null],
      ['A', 'K me', null, null, null, null, null, null, null],
      ['I', 'N', 'D', 'O', 'N', 'E', 'S', 'I', 'A'],
      ['R', null, null, null, null, null, null, null, null],
      ['P', 'U me', null, null, null, null, null, null, null],
      ['P', 'U me', null, null, null, null, null, null, null],
      ['P', 'U me', null, null, null, null, null, null, null],
      ['P', 'U me', null, null, null, null, null, null, null]
    ],
    solutionClean: [
      ['S', 'A', 'S', 'T', 'R', 'A', null, null, null],
      ['Y', null, null, null, null, null, null, null, null],
      ['A', null, null, null, null, null, null, null, null],
      ['I', 'N', 'D', 'O', 'N', 'E', 'S', 'I', 'A'],
      ['R', null, null, null, null, null, null, null, null],
      ['P', 'U me', null, null, null, null, null, null, null]
    ],
    solutionClean: [
      ['S', 'A', 'S', 'T', 'R', 'A', null, null, null],
      ['Y', null, null, null, null, null, null, null, null],
      ['A', null, null, null, null, null, null, null, null],
      ['I', 'N', 'D', 'O', 'N', 'E', 'S', 'I', 'A'],
      ['R', null, null, null, null, null, null, null, null],
      ['P', 'U', 'I', 'S', 'I', null, null, null, null],
      [null, null, null, null, null, null, null, null, null],
      ['K', 'A me', null, null, null, null, null, null, null],
      ['K', 'A me', null, null, null, null, null, null, null]
    ],
    solutionClean: [
      ['S', 'A', 'S', 'T', 'R', 'A', null, null, null],
      ['Y', null, null, null, null, null, null, null, null],
      ['A', null, null, null, null, null, null, null, null],
      ['I', 'N', 'D', 'O', 'N', 'E', 'S', 'I', 'A'],
      ['R', null, null, null, null, null, null, null, null],
      ['P', 'U', 'I', 'S', 'I', null, null, null, null],
      [null, null, null, null, null, null, null, null, null],
      ['K', 'A me', null, null, null, null, null, null, null]
    ],
    solutionClean: [
      ['S', 'A', 'S', 'T', 'R', 'A', null, null, null],
      ['Y', null, null, null, null, null, null, null, null],
      ['A', null, null, null, null, null, null, null, null],
      ['I', 'N', 'D', 'O', 'N', 'E', 'S', 'I', 'A'],
      ['R', null, null, null, null, null, null, null, null],
      ['P', 'U', 'I', 'S', 'I', null, null, null, null],
      [null, null, null, null, null, null, null, null, null],
      ['K', 'A me', null, null, null, null, null, null, null]
    ],
    solutionClean: [
      ['S', 'A', 'S', 'T', 'R', 'A', null, null, null],
      ['Y', null, null, null, null, null, null, null, null],
      ['A', null, null, null, null, null, null, null, null],
      ['I', 'N', 'D', 'O', 'N', 'E', 'S', 'I', 'A'],
      ['R', null, null, null, null, null, null, null, null],
      ['P', 'U', 'I', 'S', 'I', null, null, null, null],
      [null, null, null, null, null, null, null, null, null],
      ['K', 'A', 'M', 'U', 'S', null, null, null, null]
    ],
    numbers: [
      { row: 0, col: 0, num: 1 },
      { row: 3, col: 0, num: 2 },
      { row: 5, col: 0, num: 3 },
      { row: 7, col: 0, num: 4 }
    ],
    clues: {
      across: [
        { num: 1, row: 0, col: 0, len: 6, clue: "Hasil karya seni imajinatif bahasa tulis/lisan" },
        { num: 2, row: 3, col: 0, len: 9, clue: "Bahasa persatuan tanah air kita" },
        { num: 3, row: 5, col: 0, len: 5, clue: "Karya sastra berima dan bermakna kiasan indah" },
        { num: 4, row: 7, col: 0, len: 5, clue: "Buku rujukan tempat mencari arti kata (KBBI)" }
      ],
      down: [
        { num: 1, row: 0, col: 0, len: 5, clue: "Puisi lama empat baris bersajak a-a-a-a" }
      ]
    }
  }
};
