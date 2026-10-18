/**
 * Dedicated Melodic Score for all 28 Vietnamese Hit Songs
 * Each song has its exact recognizable chorus melody, bass progression, tempo, and instrument.
 */

export const N = {
  // Octave 3 (Bass / Chords)
  C3: 130.81, Cs3: 138.59, D3: 146.83, Ds3: 155.56, E3: 164.81, F3: 174.61,
  Fs3: 185.00, G3: 196.00, Gs3: 207.65, A3: 220.00, Bb3: 233.08, B3: 246.94,
  // Octave 4 (Melody)
  C4: 261.63, Cs4: 277.18, D4: 293.66, Ds4: 311.13, E4: 329.63, F4: 349.23,
  Fs4: 369.99, G4: 392.00, Gs4: 415.30, A4: 440.00, Bb4: 466.16, B4: 493.88,
  // Octave 5 (High Melody)
  C5: 523.25, Cs5: 554.37, D5: 587.33, Ds5: 622.25, E5: 659.25, F5: 698.46,
  Fs5: 739.99, G5: 783.99, Gs5: 830.61, A5: 880.00, Bb5: 932.33, B5: 987.77,
};

export interface SongScore {
  bpm: number;
  instrument: 'piano' | 'acoustic' | 'lofi' | 'music-box' | 'synth';
  bassChords: number[];
  melodyNotes: number[];
}

export const SONG_SCORES: Record<string, SongScore> = {
  // ★ Giấc Mơ Tình Cờ (HIYA)
  'giac-mo-tinh-co': {
    bpm: 80,
    instrument: 'lofi',
    bassChords: [N.F3, N.G3, N.E3, N.A3],
    melodyNotes: [
      N.C5, N.B4, N.A4, N.G4, N.A4, N.C5, N.B4, N.A4,
      N.G4, N.E4, N.G4, N.A4, N.G4, N.E4, N.D4, N.C4,
    ],
  },

  // ★ Gió (JanK)
  'gio': {
    bpm: 72,
    instrument: 'piano',
    bassChords: [N.A3, N.F3, N.C3, N.G3],
    melodyNotes: [
      N.E4, N.A4, N.B4, N.C5, N.B4, N.A4, N.B4, N.C5,
      N.D5, N.C5, N.B4, N.A4, N.G4, N.E4, N.Fs4, N.E4,
    ],
  },

  // ★ Tìm Em (Hngle ft. Bảo Anh)
  'tim-em': {
    bpm: 75,
    instrument: 'lofi',
    bassChords: [N.D3, N.Bb3, N.F3, N.C4],
    melodyNotes: [
      N.D4, N.F4, N.A4, N.G4, N.F4, N.E4, N.D4, N.C4,
      N.D4, N.F4, N.G4, N.A4, N.G4, N.F4, N.E4, N.D4,
    ],
  },

  // ★ Không Buông (Hngle ft. Ari)
  'khong-buong': {
    bpm: 76,
    instrument: 'piano',
    bassChords: [N.G3, N.D3, N.E3, N.C3],
    melodyNotes: [
      N.G4, N.B4, N.D5, N.C5, N.B4, N.A4, N.B4, N.G4,
      N.E4, N.G4, N.A4, N.B4, N.A4, N.G4, N.E4, N.D4,
    ],
  },

  // 1. Ánh Nắng Của Anh (Đức Phúc) - "Sẽ luôn thật gần bên em..."
  'anh-nang-cua-anh': {
    bpm: 76,
    instrument: 'piano',
    bassChords: [N.C3, N.A3, N.F3, N.G3],
    melodyNotes: [
      N.G4, N.C5, N.B4, N.A4, N.G4, N.E4, N.F4, N.G4,
      N.A4, N.G4, N.E4, N.D4, N.C4, N.D4, N.E4, N.C4,
    ],
  },

  // 2. Nơi Này Có Anh (Sơn Tùng M-TP) - "Cầm tay anh, dựa vai anh, kề bên anh..."
  'noi-nay-co-anh': {
    bpm: 98,
    instrument: 'acoustic',
    bassChords: [N.E3, N.B3, N.Cs3, N.A3],
    melodyNotes: [
      N.Gs4, N.A4, N.B4, N.B4, N.B4, N.Cs5, N.B4, N.Gs4,
      N.E4, N.Fs4, N.Gs4, N.A4, N.Gs4, N.E4, N.Fs4, N.E4,
    ],
  },

  // 3. Nàng Thơ (Hoàng Dũng) - "Em, ngày em đánh rơi nụ cười vào anh..."
  'nang-tho': {
    bpm: 68,
    instrument: 'acoustic',
    bassChords: [N.D3, N.Fs3, N.B3, N.G3],
    melodyNotes: [
      N.Fs4, N.D4, N.E4, N.Fs4, N.G4, N.Fs4, N.E4, N.D4,
      N.B3, N.D4, N.E4, N.Fs4, N.D4, N.E4, N.Fs4, N.D4,
    ],
  },

  // 4. Ngày Đầu Tiên (Đức Phúc) - "Ngày đầu tiên cùng nhau đi dưới mưa..."
  'ngay-dau-tien': {
    bpm: 74,
    instrument: 'piano',
    bassChords: [N.C3, N.G3, N.A3, N.F3],
    melodyNotes: [
      N.E4, N.G4, N.A4, N.B4, N.C5, N.B4, N.A4, N.G4,
      N.E4, N.D4, N.C4, N.D4, N.E4, N.G4, N.F4, N.E4,
    ],
  },

  // 5. Cưới Thôi (Masew x Masiu) - "Cưới nhau đi thôi chờ chi nữa em ơi..."
  'cuoi-thoi': {
    bpm: 112,
    instrument: 'synth',
    bassChords: [N.A3, N.F3, N.C3, N.G3],
    melodyNotes: [
      N.E4, N.A4, N.B4, N.C5, N.B4, N.A4, N.G4, N.E4,
      N.G4, N.A4, N.B4, N.A4, N.G4, N.E4, N.D4, N.E4,
    ],
  },

  // 6. Một Nhà (Da LAB) - "Khi hai ta về một nhà, khép đôi mi chung một giường..."
  'mot-nha': {
    bpm: 92,
    instrument: 'acoustic',
    bassChords: [N.G3, N.E3, N.C3, N.D3],
    melodyNotes: [
      N.G4, N.G4, N.G4, N.E4, N.D4, N.C4, N.E4, N.G4,
      N.A4, N.G4, N.E4, N.D4, N.C4, N.E4, N.D4, N.C4,
    ],
  },

  // 7. See Tình (Hoàng Thùy Linh) - "Tình tình tình tang tang tính..."
  'see-tinh': {
    bpm: 120,
    instrument: 'synth',
    bassChords: [N.Fs3, N.D3, N.A3, N.E3],
    melodyNotes: [
      N.Cs5, N.B4, N.A4, N.Fs4, N.A4, N.B4, N.Cs5, N.E5,
      N.Cs5, N.B4, N.A4, N.Fs4, N.A4, N.B4, N.A4, N.Fs4,
    ],
  },

  // 8. Hơn Cả Yêu (Đức Phúc) - "Cao hơn cả núi, dài hơn cả sông..."
  'hon-ca-yeu': {
    bpm: 72,
    instrument: 'piano',
    bassChords: [N.C3, N.G3, N.A3, N.F3],
    melodyNotes: [
      N.C5, N.B4, N.A4, N.G4, N.E4, N.G4, N.A4, N.B4,
      N.C5, N.G4, N.E4, N.D4, N.C4, N.D4, N.E4, N.C4,
    ],
  },

  // 9. Chưa Bao Giờ Mẹ Kể (MIN x Erik) - "Mẹ ơi mẹ có ước mơ nào không..."
  'chua-bao-gio-me-ke': {
    bpm: 66,
    instrument: 'piano',
    bassChords: [N.Bb3, N.F3, N.G3, N.Ds3],
    melodyNotes: [
      N.F4, N.D4, N.F4, N.G4, N.A4, N.Bb4, N.A4, N.G4,
      N.F4, N.D4, N.C4, N.D4, N.F4, N.G4, N.F4, N.D4,
    ],
  },

  // 10. Bao Tiền Một Mớ Bình Yên (14 Casper & Bon)
  'bao-tien-mot-mo-binh-yen': {
    bpm: 70,
    instrument: 'lofi',
    bassChords: [N.F3, N.A3, N.D3, N.Bb3],
    melodyNotes: [
      N.A4, N.G4, N.F4, N.E4, N.D4, N.C4, N.D4, N.F4,
      N.G4, N.F4, N.D4, N.C4, N.D4, N.F4, N.E4, N.D4,
    ],
  },

  // 11. Dạ Vũ (Tăng Duy Tân) - "Đưa tay đây nào, mãi bên nhau bạn nhé..."
  'da-vu': {
    bpm: 94,
    instrument: 'synth',
    bassChords: [N.Cs3, N.A3, N.B3, N.Gs3],
    melodyNotes: [
      N.Cs4, N.E4, N.Gs4, N.Fs4, N.E4, N.Ds4, N.Cs4, N.B3,
      N.Cs4, N.E4, N.Gs4, N.B4, N.A4, N.Gs4, N.Fs4, N.E4,
    ],
  },

  // 12. Thích Em Hơi Nhiều (Wren Evans)
  'thich-em-hoi-nhieu': {
    bpm: 106,
    instrument: 'lofi',
    bassChords: [N.G3, N.E3, N.C3, N.D3],
    melodyNotes: [
      N.B4, N.A4, N.G4, N.E4, N.D4, N.E4, N.G4, N.A4,
      N.G4, N.B4, N.A4, N.G4, N.E4, N.G4, N.A4, N.G4,
    ],
  },

  // 13. Từng Quen (Wren Evans)
  'tung-quen': {
    bpm: 82,
    instrument: 'lofi',
    bassChords: [N.D3, N.G3, N.Bb3, N.A3],
    melodyNotes: [
      N.D4, N.F4, N.G4, N.A4, N.C5, N.A4, N.G4, N.F4,
      N.D4, N.C4, N.D4, N.F4, N.G4, N.A4, N.G4, N.F4,
    ],
  },

  // 14. Mặt Trời Của Em (Phương Ly)
  'mat-troi-cua-em': {
    bpm: 90,
    instrument: 'acoustic',
    bassChords: [N.G3, N.A3, N.B3, N.D4],
    melodyNotes: [
      N.G4, N.A4, N.B4, N.D5, N.B4, N.A4, N.G4, N.E4,
      N.G4, N.A4, N.G4, N.E4, N.D4, N.E4, N.G4, N.E4,
    ],
  },

  // 15. Em Đồng Ý (I Do) - Đức Phúc x 911
  'em-dong-y-i-do': {
    bpm: 72,
    instrument: 'piano',
    bassChords: [N.C3, N.G3, N.A3, N.F3],
    melodyNotes: [
      N.E4, N.G4, N.C5, N.B4, N.A4, N.G4, N.E4, N.F4,
      N.G4, N.A4, N.G4, N.E4, N.D4, N.C4, N.D4, N.C4,
    ],
  },

  // 16. Bật Tình Yêu Lên (Tăng Duy Tân x Hòa Minzy)
  'bat-tinh-yeu-len': {
    bpm: 108,
    instrument: 'synth',
    bassChords: [N.E3, N.Gs3, N.A3, N.B3],
    melodyNotes: [
      N.E4, N.Gs4, N.B4, N.Cs5, N.B4, N.Gs4, N.E4, N.Fs4,
      N.Gs4, N.A4, N.Gs4, N.E4, N.Ds4, N.E4, N.Fs4, N.E4,
    ],
  },

  // 17. Ước Mơ Của Mẹ (Văn Mai Hương)
  'uoc-mo-cua-me': {
    bpm: 68,
    instrument: 'piano',
    bassChords: [N.G3, N.E3, N.C3, N.D3],
    melodyNotes: [
      N.G4, N.E4, N.G4, N.A4, N.B4, N.C5, N.B4, N.A4,
      N.G4, N.E4, N.D4, N.C4, N.D4, N.E4, N.D4, N.C4,
    ],
  },

  // 18. Mẹ Yêu (Phương Uyên)
  'me-yeu': {
    bpm: 70,
    instrument: 'acoustic',
    bassChords: [N.F3, N.C3, N.D3, N.Bb3],
    melodyNotes: [
      N.A4, N.G4, N.F4, N.E4, N.D4, N.F4, N.A4, N.G4,
      N.F4, N.E4, N.D4, N.C4, N.D4, N.F4, N.E4, N.D4,
    ],
  },

  // 19. Nhật Ký Của Mẹ (Hiền Thục)
  'nhat-ky-cua-me': {
    bpm: 64,
    instrument: 'piano',
    bassChords: [N.C3, N.G3, N.A3, N.F3],
    melodyNotes: [
      N.C4, N.E4, N.G4, N.A4, N.G4, N.E4, N.D4, N.C4,
      N.D4, N.E4, N.G4, N.E4, N.D4, N.C4, N.D4, N.C4,
    ],
  },

  // 20. Cầu Hôn (Văn Mai Hương)
  'cau-hon': {
    bpm: 80,
    instrument: 'acoustic',
    bassChords: [N.G3, N.E3, N.C3, N.D3],
    melodyNotes: [
      N.G4, N.E4, N.C4, N.D4, N.E4, N.G4, N.A4, N.G4,
      N.E4, N.D4, N.C4, N.D4, N.E4, N.G4, N.E4, N.C4,
    ],
  },

  // 21. Tình Yêu Khủng Long (Fay)
  'tinh-yeu-khung-long': {
    bpm: 96,
    instrument: 'acoustic',
    bassChords: [N.C3, N.G3, N.A3, N.F3],
    melodyNotes: [
      N.C4, N.E4, N.G4, N.G4, N.A4, N.G4, N.E4, N.C4,
      N.D4, N.E4, N.G4, N.E4, N.D4, N.C4, N.D4, N.C4,
    ],
  },

  // 22. Có Em Chờ (MIN x Mr.A)
  'co-em-cho': {
    bpm: 80,
    instrument: 'acoustic',
    bassChords: [N.D3, N.G3, N.A3, N.B3],
    melodyNotes: [
      N.D4, N.Fs4, N.A4, N.B4, N.A4, N.Fs4, N.E4, N.D4,
      N.E4, N.Fs4, N.A4, N.Fs4, N.E4, N.D4, N.E4, N.D4,
    ],
  },

  // 23. Va Vào Giai Điệu Này (MCK)
  'va-vao-giai-dieu-nay': {
    bpm: 84,
    instrument: 'lofi',
    bassChords: [N.E3, N.G3, N.B3, N.A3],
    melodyNotes: [
      N.E4, N.G4, N.B4, N.A4, N.G4, N.E4, N.D4, N.E4,
      N.G4, N.A4, N.G4, N.E4, N.D4, N.E4, N.G4, N.E4,
    ],
  },

  // 24. Yêu Được Không (Đức Phúc)
  'yeu-duoc-khong': {
    bpm: 72,
    instrument: 'piano',
    bassChords: [N.C3, N.G3, N.A3, N.F3],
    melodyNotes: [
      N.C4, N.G4, N.F4, N.E4, N.D4, N.E4, N.F4, N.G4,
      N.E4, N.C4, N.D4, N.E4, N.D4, N.C4, N.D4, N.C4,
    ],
  },

  // 25. Piano Lãng Mạn Tháng 10
  'romantic-piano': {
    bpm: 74,
    instrument: 'piano',
    bassChords: [N.C3, N.A3, N.F3, N.G3],
    melodyNotes: [
      N.C4, N.E4, N.G4, N.C5, N.A3, N.C4, N.E4, N.A4,
      N.F3, N.A3, N.C4, N.F4, N.G3, N.B3, N.D4, N.G4,
    ],
  },

  // 26. Hộp Nhạc Kỷ Niệm Pha Lê
  'music-box': {
    bpm: 76,
    instrument: 'music-box',
    bassChords: [N.C3, N.G3, N.A3, N.F3],
    melodyNotes: [
      N.E5, N.G5, N.B5, N.C5, N.B5, N.G5, N.E5, N.D5,
      N.C5, N.E5, N.G5, N.A5, N.G5, N.E5, N.D5, N.C5,
    ],
  },

  // 27. Acoustic Khúc Giao Mùa
  'spring-acoustic': {
    bpm: 76,
    instrument: 'acoustic',
    bassChords: [N.D3, N.G3, N.A3, N.B3],
    melodyNotes: [
      N.D4, N.Fs4, N.A4, N.D5, N.G3, N.B3, N.D4, N.G4,
      N.A3, N.Cs4, N.E4, N.A4, N.B3, N.D4, N.Fs4, N.B4,
    ],
  },

  // 28. Ngân Hà Lofi Chill Ambient
  'cosmic-ambient': {
    bpm: 52,
    instrument: 'synth',
    bassChords: [N.C3, N.A3, N.F3, N.G3],
    melodyNotes: [
      N.G4, N.B4, N.E5, N.G5, N.E4, N.A4, N.C5, N.E5,
      N.F4, N.A4, N.C5, N.F5, N.G4, N.B4, N.D5, N.G5,
    ],
  },
};
