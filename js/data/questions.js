/**
 * KOPI TUBRUK - TTS Questions & Grids Data
 * Categories: Pengetahuan Umum, Sejarah, IPTEK, Geografi, Seni & Budaya
 */

const TTS_DATA = {
  level1: {
    id: "level1",
    title: "Pengetahuan Umum",
    icon: "💡",
    cols: 9,
    rows: 9,
    grid: [
      ['K', 'O', 'P', 'I', '#', 'B', 'A', 'T', 'I'],
      ['#', '#', 'A', '#', 'M', '#', '#', '#', 'N'],
      ['S', 'U', 'M', 'A', 'T', 'R', 'A', '#', 'D'],
      ['#', '#', 'P', '#', 'A', '#', 'I', '#', 'O'],
      ['K', 'E', 'U', 'A', 'N', 'G', 'A', 'N', 'N'],
      ['#', '#5', 'N', '#', 'T', '#', '#', '#', 'E'],
      ['A', 'S', 'I', 'A', '#', 'K', 'O me', 'T', 'S'],
      ['#', '#', 'A', '#', 'B', '#', '#', '#', '#'],
      ['R', 'O me', 'T', 'O', 'R', '#', '#', '#', '#']
    ],
    // Clean text grid matrix (null = black cell)
    solution: [
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
        { num: 3, row: 0, col: 8, len: 7, clue: "Negara kepulauan tetangga di utara Kalimantan (Singkatan/Nama)" },
        { num: 4, row: 0, col: 4, len: 6, clue: "Mata uang negara Thailand" }
      ]
    }
  },

  level2: {
    id: "level2",
    title: "Sejarah & Peradaban",
    icon: "🏛️",
    cols: 9,
    rows: 9,
    solution: [
      ['S', 'O', 'E', 'K', 'A', 'R', 'N', 'O', null],
      [null, null, 'G', null, 'C', null, null, null, null],
      ['B', 'O me', 'R', 'O', 'B', 'U', 'D', 'U', 'R'],
      [null, null, 'E', null, 'E', null, null, null, 'E'],
      ['P', 'E me', 'M', 'B', 'A', 'N me', 'G', 'U', 'N'],
      [null, null, 'A', null, 'H', null, null, null, 'R'],
      ['M', 'A', 'J', 'A', 'P', 'A', 'H', 'I', 'T'],
      [null, null, 'A', null, '#', null, null, null, null],
      ['N', 'A', 'S', 'I', 'O', 'N', 'A', 'L', null]
    ],
    // Clean matrix for solution
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
        { num: 6, row: 4, col: 0, len: 9, clue: "Naskah pernyataan kemerdekaan Indonesia tanggal 17 Agustus 1945" },
        { num: 7, row: 6, col: 0, len: 9, clue: "Kerajaan bahari terbesar di Nusantara berpusat di Jawa Timur" },
        { num: 8, row: 8, col: 0, len: 8, clue: "Skala wawasan kebangsaan tanah air (Kebangsaan...)" }
      ],
      down: [
        { num: 2, row: 0, col: 2, len: 8, clue: "Gelar pahlawan wanita dari Jepara pelopor emansipasi" },
        { num: 3, row: 0, col: 4, len: 7, clue: "Provinsi berjuluk Serambi Mekkah di ujung barat Indonesia" },
        { num: 5, row: 2, col: 8, len: 5, clue: "Kerajaan kuno penggagas Sumpah Palapa di bawah Gajah Mada" }
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
        { num: 5, row: 4, col: 0, len: 9, clue: "Seluruh ruang waktu kontinu beserta materi dan energi di dalamnya" },
        { num: 6, row: 6, col: 0, len: 8, clue: "Metode pengamanan data dengan mengubah teks menjadi sandi acak" },
        { num: 7, row: 8, col: 0, len: 8, clue: "Cabang teknologi yang merancang dan membuat mesin otomatis" }
      ],
      down: [
        { num: 1, row: 0, col: 0, len: 8, clue: "Perangkat elektronik pengolah data berkecepatan tinggi" },
        { num: 2, row: 0, col: 4, len: 7, clue: "Jaringan gas pembawa cahaya warna-warni pada papan reklame modern" },
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
      ['R', 'I me', 'N me', me, null, null, null, null, null],
      ['O', 'K', 'S', 'I', 'G', 'E', 'N', null, null],
      ['N', null, null, null, 'E', null, null, null, null],
      ['S', 'A', 'M me', 'U', 'D', 'R', 'A', null, null],
      ['A', null, null, null, 'O', null, null, null, null],
      ['M', 'E', 'R', 'A', 'P', 'I', null, null, null],
      ['U', null, null, null, 'I', null, null, null, null],
      ['R', 'A me', 'N me', me, null, null, null, null, null],
      ['N me', me, null, null, null, null, null, null, null]
    ],
    // Correct grid clean layout
    solutionClean: [
      ['O', 'K', 'S', 'I', 'G', 'E', 'N', null, null],
      ['K', null, null, null, 'U', null, null, null, null],
      ['S', 'A', 'M', 'U', 'D', 'R', 'A', null, null],
      ['I', null, null, null, 'U', null, null, null, null],
      ['G', me, null, null, 'N', null, null, null, null],
      ['E', 'V', 'E', 'R', 'E', 'S', 'T', null, null],
      ['N', null, null, null, 'G', null, null, null, null],
      ['M', 'E', 'R', 'A', 'P', 'I', null, null, null],
      [null, null, null, null, null, null, null, null, null]
    ],
    // Corrected 9x9 Layout for Level 4
    solutionClean: [
      ['O', 'K', 'S', 'I', 'G', 'E', 'N', null, null],
      [null, null, null, null, 'U', null, null, null, null],
      ['S', 'A', 'M', 'U', 'D', 'R', 'A', null, null],
      [null, null, null, null, 'N', null, null, null, null],
      ['E', 'V', 'E', 'R', 'E', 'S', 'T', null, null],
      [null, null, null, null, 'U', null, null, null, null],
      ['M', 'E', 'R', 'A', 'P', 'I', null, null, null],
      [null, null, null, null, 'A', null, null, null, null],
      ['H', 'I me', 'M', 'A', 'L', 'A', 'Y', 'A', null]
    ],
    solutionCleanFixed: [
      ['O', 'K', 'S', 'I', 'G', 'E', 'N', null, null],
      ['A', null, null, null, 'U', null, null, null, null],
      ['S', 'A', 'M', 'U', 'D', 'R', 'A', null, null],
      ['I', null, null, null, 'N', null, null, null, null],
      ['A', null, null, null, 'U', null, null, null, null],
      ['M', 'E', 'R', 'A', 'P', 'I', null, null, null],
      ['A', null, null, null, 'A', null, null, null, null],
      ['N', 'A', 'S', 'I', 'O', 'N', 'A', 'L', null],
      [null, null, null, null, null, null, null, null, null]
    ],
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
        { num: 4, row: 4, col: 0, len: 7, clue: "Puncak gunung tertinggi di dunia yang berada di perbatasan Nepal & Tibet" },
        { num: 5, row: 6, col: 0, len: 6, clue: "Gunung berapi teraktif di pulau Jawa yang berada di Yogyakarta" },
        { num: 6, row: 8, col: 0, len: 8, clue: "Pegunungan tertinggi di benua Asia" }
      ],
      down: [
        { num: 2, row: 0, col: 4, len: 9, clue: "Gunung tertinggi di pulau Sumatra (Gunung...)" }
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
      ['R', 'E', 'O', 'G', 'G', 'U', 'N', 'U', 'N'],
      ['U', null, null, null, me, null, null, null, null],
      ['D', 'A me', 'M me', 'A me', 'R me', null, null, null, null],
      ['A', null, null, null, null, null, null, null, null],
      ['K', 'E me', 'R me', 'I me', 'S me', null, null, null, null],
      [null, null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null, null]
    ],
    solutionClean: [
      ['G', 'A', 'M', 'E', 'L', 'A', 'N', null, null],
      ['A', null, null, null, 'E', null, null, null, null],
      ['R', 'E', 'O', 'G', 'G', 'U me', null, null, null],
      ['U', null, null, null, me, null, null, null, null],
      ['D', 'A me', 'M me', null, null, null, null, null, null]
    ],
    solutionClean: [
      ['G', 'A', 'M', 'E', 'L', 'A', 'N', null, null],
      ['A', null, null, null, 'E', null, null, null, null],
      ['R', 'E', 'O', 'G', 'G', null, null, null, null],
      ['U', null, null, null, 'E', null, null, null, null],
      ['D', 'A me', 'M me', null, 'N', null, null, null, null],
      ['A', null, null, null, 'D', null, null, null, null],
      ['K', 'E', 'R', 'I', 'S', null, null, null, null],
      [null, null, null, null, null, null, null, null, null],
      ['W', 'A', 'Y', 'A', 'N', 'G', null, null, null]
    ],
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
        { num: 3, row: 2, col: 0, len: 4, clue: "Tarian tradisional Ponorogo berwujud topeng merak besar (Reog)" },
        { num: 4, row: 4, col: 0, len: 5, clue: "Lampu penerangan tradisional berisikan minyak kelapa" },
        { num: 5, row: 6, col: 0, len: 5, clue: "Senjata tradisional berlekuk khas Nusantara warisan UNESCO" },
        { num: 6, row: 8, col: 0, len: 6, clue: "Seni pertunjukan bayangan kulit boneka khas Indonesia" }
      ],
      down: [
        { num: 1, row: 0, col: 0, len: 6, clue: "Burung mitologi gagah lambang negara Indonesia" },
        { num: 2, row: 0, col: 4, len: 7, clue: "Kisah dongeng rakyat tradisional yang diwariskan lisan" }
      ]
    }
  }
};
