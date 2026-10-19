// Card template types and shared interfaces

export interface CardTemplate {
  id: string;
  title: string;
  titleVi: string;
  category: '20-10' | 'love' | 'birthday' | 'gratitude' | 'friends';
  description: string;
  descriptionVi: string;
  effectType: EffectType;
  thumbnail: string;
  icon: string;
  gradient: string;
  defaultConfig: CardConfig;
  stats: {
    views: number;
    hearts: number;
    uses: number;
  };
}

export type EffectType =
  | 'PASSCODE_ENVELOPE'
  | 'GALAXY_3D'
  | 'PETAL_RAIN'
  | 'VINYL_PLAYER'
  | 'SCRATCH_CARD'
  | 'LANTERN_3D'
  | 'CRYSTAL_CAROUSEL'
  | 'CINEMA_FILM'
  | 'BOUQUET_3D'
  // 5 TikTok Hot Trend Interactive Templates
  | 'HOLD_TO_REVEAL'
  | 'FOGGY_MIRROR'
  | 'BLOW_MIC'
  | 'POLAROID_SWIPE'
  | 'AI_GESTURE';

export interface CardConfig {
  recipientName: string;
  senderName: string;
  mainText: string;
  passcode?: string;
  passcodeHint?: string;
  audioUrl?: string;
  musicPreset?: string;
  audioStartTime?: number;
  audioEndTime?: number;
  images?: string[];
  themeColor?: string;
  fontFamily?: string;
  backgroundColor?: string;
  // Crystal Carousel 3D Customizations
  crystalTheme?: 'cyan' | 'purple' | 'rose' | 'gold' | 'midnight';
  crystalCenterpiece?: 'rose' | 'heart' | 'swans' | 'castle' | 'teddy';
  crystalWeather?: 'snow' | 'sparkles' | 'petals' | 'hearts' | 'notes';
  crystalQuotes?: string[];
  crystalBaseTitle?: string;
  crystalBaseSubtitle?: string;
  // Cinema Filmstrip Customizations
  cinemaCaptions?: string[];
}

export interface CreatedCard {
  id: string;
  creatorId: string | null;
  templateId: string;
  title: string;
  cardData: CardConfig;
  viewsCount: number;
  heartsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PresetWish {
  id: string;
  target: 'mom' | 'wife' | 'crush' | 'teacher' | 'colleague';
  label: string;
  text: string;
}

export interface MusicPreset {
  id: string;
  name: string;
  desc: string;
  icon: string;
  type: 'procedural' | 'url';
}

export interface User {
  id: string;
  username?: string;
  email?: string;
  displayName: string;
  avatarUrl: string;
  createdAt: string;
}

export const TEMPLATES: CardTemplate[] = [
  {
    id: 'passcode-envelope',
    title: 'Love Passcode Envelope',
    titleVi: 'Thư Mật Mã Tình Yêu',
    category: '20-10',
    description: 'A sealed envelope requiring a secret PIN to unlock beautiful messages and layered photos',
    descriptionVi: 'Phong bì niêm phong sáp cần mật mã bí mật để mở bức thư kẹp ảnh kỷ niệm',
    effectType: 'PASSCODE_ENVELOPE',
    thumbnail: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&auto=format&fit=crop&q=85',
    icon: '💌',
    gradient: 'from-rose-500/80 via-pink-600/70 to-rose-950',
    stats: { views: 0, hearts: 0, uses: 0 },
    defaultConfig: {
      recipientName: 'Em yêu',
      senderName: 'Người yêu em',
      mainText: 'Ngày 20/10, anh muốn nói với em rằng em là điều tuyệt vời nhất đến với cuộc đời anh. Cảm ơn em vì tất cả! 🌹',
      passcode: '2010',
      passcodeHint: 'Ngày Phụ Nữ Việt Nam 20/10',
      themeColor: '#FB7185',
      fontFamily: 'Be Vietnam Pro',
      musicPreset: 'anh-nang-cua-anh',
      images: [],
    },
  },
  {
    id: 'galaxy-memories',
    title: 'Galaxy of Memories',
    titleVi: 'Thiên Hà Lời Chúc 3D',
    category: 'love',
    description: 'Interactive 3D spiral galaxy with rotating volumetric memory crystals and glowing constellations',
    descriptionVi: 'Vũ trụ xoắn ốc 3D với khối pha lê kỷ niệm lơ lửng và sao phát sáng 360°',
    effectType: 'GALAXY_3D',
    thumbnail: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800&auto=format&fit=crop&q=80',
    icon: '✨',
    gradient: 'from-indigo-900 via-purple-900/90 to-slate-950',
    stats: { views: 0, hearts: 0, uses: 0 },
    defaultConfig: {
      recipientName: 'Em yêu',
      senderName: 'Anh',
      mainText: 'Mỗi ngôi sao trên bầu trời là một kỷ niệm đẹp của chúng mình. Em là vũ trụ duy nhất của anh! ✨',
      themeColor: '#818CF8',
      fontFamily: 'Playfair Display',
      musicPreset: 'nang-tho',
      images: [],
    },
  },
  {
    id: 'blossom-rain',
    title: 'Blossom & Spring Rain',
    titleVi: 'Mưa Hoa & Mùa Xuân 20/10',
    category: '20-10',
    description: 'Pressed-flower glass frame floating over water ripples with accumulated resting petals physics',
    descriptionVi: 'Khung kính hoa ép nghệ thuật trên mặt hồ với cánh hoa rơi tích tụ và gió xoáy',
    effectType: 'PETAL_RAIN',
    thumbnail: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=800&auto=format&fit=crop&q=80',
    icon: '🌸',
    gradient: 'from-pink-500/80 via-rose-400/80 to-amber-700/60',
    stats: { views: 0, hearts: 0, uses: 0 },
    defaultConfig: {
      recipientName: 'Người phụ nữ tuyệt vời',
      senderName: 'Người ngưỡng mộ em',
      mainText: 'Chúc em ngày 20/10 thật rạng rỡ như mùa xuân, đẹp tựa cánh hoa và ấm áp như nắng mai. Em xứng đáng được yêu thương! 🌸',
      themeColor: '#F472B6',
      fontFamily: 'Be Vietnam Pro',
      musicPreset: 'noi-nay-co-anh',
      images: [],
    },
  },
  {
    id: 'vinyl-player',
    title: 'Retro Vinyl & Mixtape',
    titleVi: 'Đĩa Hát Kỷ Niệm',
    category: 'love',
    description: 'Turntable with custom photo label, gatefold album sleeve and DJ scratch interactions',
    descriptionVi: 'Máy hát đĩa than lồng ảnh tâm đĩa, kèm bìa album lật ảnh và cần kim cơ học',
    effectType: 'VINYL_PLAYER',
    thumbnail: 'https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?w=800&auto=format&fit=crop&q=80',
    icon: '🎵',
    gradient: 'from-amber-900/90 via-stone-900 to-black',
    stats: { views: 0, hearts: 0, uses: 0 },
    defaultConfig: {
      recipientName: 'My Love',
      senderName: 'Yours Forever',
      mainText: 'Nếu tình yêu là một bản nhạc, thì em chính là giai điệu đẹp nhất mà anh từng được nghe. Mỗi khoảnh khắc bên em là một nốt nhạc ngọt ngào 🎵',
      themeColor: '#F59E0B',
      fontFamily: 'Playfair Display',
      musicPreset: 'mot-nha',
      images: [],
    },
  },
  {
    id: 'scratch-card',
    title: 'Scratch & Surprise',
    titleVi: 'Thiệp Cào Bất Ngờ',
    category: 'birthday',
    description: 'Shimmering metallic gold scratch card revealing romantic postage collage with sparkle trail',
    descriptionVi: 'Cào lớp nhũ vàng bạc óng ánh khám phá bức thư tem cổ và kỷ niệm bí mật',
    effectType: 'SCRATCH_CARD',
    thumbnail: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80',
    icon: '🎁',
    gradient: 'from-amber-600/90 via-yellow-700/80 to-stone-900',
    stats: { views: 0, hearts: 0, uses: 0 },
    defaultConfig: {
      recipientName: 'Em',
      senderName: 'Người bí ẩn',
      mainText: 'Bất ngờ chưa! 🎉 Em là món quà quý giá nhất mà cuộc đời dành tặng anh. Chúc em ngày đặc biệt ngập tràn hạnh phúc! 💕',
      themeColor: '#FBBF24',
      fontFamily: 'Be Vietnam Pro',
      musicPreset: 'cuoi-thoi',
      images: [],
    },
  },
  {
    id: 'lantern-festival',
    title: 'Lantern Wish Festival 3D',
    titleVi: 'Đèn Trời Ước Nguyện 3D',
    category: 'gratitude',
    description: 'Warm glowing 3D paper sky lantern with translucent photos and calligraphic blessings',
    descriptionVi: 'Đèn trời 3D tỏa sáng 4 mặt giấy lụa in ảnh và lời chúc, thả bay lên bầu trời sao',
    effectType: 'LANTERN_3D',
    thumbnail: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&auto=format&fit=crop&q=80',
    icon: '🏮',
    gradient: 'from-orange-700/90 via-amber-900/90 to-slate-950',
    stats: { views: 0, hearts: 0, uses: 0 },
    defaultConfig: {
      recipientName: 'Mẹ kính yêu',
      senderName: 'Con của Mẹ',
      mainText: 'Gửi ngọn đèn trời mang theo ngàn lời chúc bình an, sức khỏe và hạnh phúc nhất đến Mẹ kính yêu. Cảm ơn Mẹ đã luôn là ánh sáng dịu dàng của đời con! 🏮',
      themeColor: '#F97316',
      fontFamily: 'Be Vietnam Pro',
      musicPreset: 'chua-bao-gio-me-ke',
      images: [],
    },
  },
  {
    id: 'crystal-carousel',
    title: 'Crystal Music Box Carousel',
    titleVi: 'Hộp Nhạc Pha Lê Vòng Quay 3D',
    category: 'love',
    description: 'Luxurious snow globe music box with cylindrical 3D rotating photo carousel and crystal rose',
    descriptionVi: 'Quả cầu tuyết pha lê với vòng quay ảnh 3D 360 độ xoay quanh đóa hồng pha lê',
    effectType: 'CRYSTAL_CAROUSEL',
    thumbnail: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800&auto=format&fit=crop&q=85',
    icon: '🎠',
    gradient: 'from-cyan-900/90 via-sky-900/80 to-indigo-950',
    stats: { views: 0, hearts: 0, uses: 0 },
    defaultConfig: {
      recipientName: 'Công Chúa Của Anh',
      senderName: 'Hoàng tử của em',
      mainText: 'Vòng quay thời gian có thể không ngừng chuyển động, nhưng tình yêu anh dành cho em sẽ mãi vẹn nguyên và lấp lánh như đóa hồng pha lê này 🌹✨',
      themeColor: '#06B6D4',
      fontFamily: 'Playfair Display',
      musicPreset: 'ngay-dau-tien',
      images: [],
      crystalTheme: 'cyan',
      crystalCenterpiece: 'rose',
      crystalWeather: 'snow',
      crystalQuotes: [
        'Mỗi khoảnh khắc bên em đều lấp lánh như viên pha lê.',
        'Em là điều ngọt ngào nhất mà số phận đã sắp đặt.',
        'Chúc em ngày 20/10 ngập tràn niềm vui và bình yên.',
        'Nụ cười của em thắp sáng cả thế giới xung quanh.',
        'Mãi yêu thương và trân trọng từng phút giây bên nhau.',
        'Gửi tặng công chúa đóa hồng vĩnh cửu không tàn 🌹',
      ],
      crystalBaseTitle: 'HỘP NHẠC PHA LÊ',
      crystalBaseSubtitle: 'Dành tặng Công Chúa Của Anh',
    },
  },
  {
    id: 'cinema-filmstrip',
    title: 'Cinema Filmstrip of Memories',
    titleVi: 'Cuộn Phim Điện Ảnh Thời Gian',
    category: 'friends',
    description: 'Retro 35mm film reel projector with grain, light leaks, film frames and movie subtitles',
    descriptionVi: 'Máy chiếu phim vintage 35mm chiếu cuộn phim kỷ niệm uốn lượn kèm phụ đề điện ảnh',
    effectType: 'CINEMA_FILM',
    thumbnail: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80',
    icon: '🎞️',
    gradient: 'from-stone-900 via-amber-950/80 to-black',
    stats: { views: 0, hearts: 0, uses: 0 },
    defaultConfig: {
      recipientName: 'Bạn Thân Ơi',
      senderName: 'Đồng bọn của bạn',
      mainText: 'Mỗi khoảnh khắc chúng ta bên nhau đều xứng đáng là một thước phim kinh điển. Cảm ơn vì đã luôn đồng hành và làm cho thanh xuân rực rỡ đến thế! 🎬',
      themeColor: '#D97706',
      fontFamily: 'Plus Jakarta Sans',
      musicPreset: 'co-gai-den-tu-hom-qua',
      images: [],
      cinemaCaptions: [
        'Phân cảnh 1: Ngày định mệnh ta gặp nhau giữa thế gian muôn màu.',
        'Phân cảnh 2: Nụ cười của bạn là ánh nắng rạng rỡ nhất trong đời.',
        'Phân cảnh 3: Dù cuộc đời có ra sao, chúng ta vẫn luôn đồng hành.',
        'Phân cảnh 4: Chúc bạn ngày 20/10 ngập tràn hạnh phúc và rạng rỡ! 🎬',
      ],
    },
  },
  {
    id: 'interactive-bouquet',
    title: 'Blooming 3D Flower Bouquet',
    titleVi: 'Bó Hoa 3D Nở Rộ & Charm Ảnh',
    category: '20-10',
    description: 'Interactive floral bouquet with double-sided photo charms and blooming petals',
    descriptionVi: 'Bó hoa tươi 3D bọc giấy lụa với charm ảnh 2 mặt lật mở từng đóa hoa tỏa hương',
    effectType: 'BOUQUET_3D',
    thumbnail: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=800&auto=format&fit=crop&q=80',
    icon: '🌷',
    gradient: 'from-rose-700/90 via-pink-900/80 to-emerald-950',
    stats: { views: 0, hearts: 0, uses: 0 },
    defaultConfig: {
      recipientName: 'Cô Giáo Kính Yêu',
      senderName: 'Tập thể học sinh',
      mainText: 'Nhân ngày 20/10, chúng em xin dâng tặng Cô bó hoa tươi thắm nhất cùng lòng biết ơn sâu sắc. Kính chúc Cô luôn trẻ đẹp, hạnh phúc và dồi dào nhiệt huyết! 💐',
      themeColor: '#10B981',
      fontFamily: 'Be Vietnam Pro',
      musicPreset: 'uoc-mo-cua-me',
      images: [],
    },
  },
  // =========================================================
  // 5 MẪU TIKTOK HOT TREND MỚI (Interactive / AI)
  // =========================================================
  {
    id: 'hold-to-reveal',
    title: 'Charging Station of Love',
    titleVi: 'Trạm Sạc Yêu Thương (Nhấn Giữ)',
    category: '20-10',
    description: 'Press and hold the fingerprint sensor to charge 100% love energy and unlock the secret letter',
    descriptionVi: 'Nhấn giữ cảm biến vân tay để sạc đầy 100% năng lượng yêu thương và mở khóa bức thư bí mật',
    effectType: 'HOLD_TO_REVEAL',
    thumbnail: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&auto=format&fit=crop&q=85',
    icon: '🔋',
    gradient: 'from-violet-600/80 via-fuchsia-700/70 to-rose-950',
    stats: { views: 0, hearts: 0, uses: 0 },
    defaultConfig: {
      recipientName: 'Em yêu',
      senderName: 'Người thương em',
      mainText: 'Em là nguồn năng lượng vô tận của anh. Mỗi ngày bên em, trái tim anh luôn được sạc đầy 100% hạnh phúc! Chúc em ngày 20/10 thật rực rỡ và tươi đẹp nhé! 🔋💖',
      themeColor: '#A855F7',
      fontFamily: 'Be Vietnam Pro',
      musicPreset: 'anh-nang-cua-anh',
      images: [],
    },
  },
  {
    id: 'foggy-mirror',
    title: 'Foggy Mirror Secret',
    titleVi: 'Lăng Kính Sương Mờ (Chạm & Lau)',
    category: '20-10',
    description: 'Wipe the foggy mirror with your finger to reveal hidden memories and the secret love letter',
    descriptionVi: 'Dùng ngón tay lau lớp hơi sương mờ trên gương để lộ ảnh kỷ niệm và tâm thư ẩn giấu',
    effectType: 'FOGGY_MIRROR',
    thumbnail: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80',
    icon: '🪞',
    gradient: 'from-slate-600/80 via-blue-900/70 to-indigo-950',
    stats: { views: 0, hearts: 0, uses: 0 },
    defaultConfig: {
      recipientName: 'Em',
      senderName: 'Anh',
      mainText: 'Đằng sau lớp sương mờ của cuộc sống, em luôn là ánh sáng rõ ràng nhất mà anh nhìn thấy. Yêu em rất nhiều! 🪞✨',
      themeColor: '#6366F1',
      fontFamily: 'Playfair Display',
      musicPreset: 'nang-tho',
      images: [],
    },
  },
  {
    id: 'blow-mic-reveal',
    title: 'Dandelion Wish Blow',
    titleVi: 'Điều Ước Bồ Công Anh (Thổi vào Mic)',
    category: '20-10',
    description: 'Blow into the microphone to scatter dandelion petals and reveal your 20/10 wishes',
    descriptionVi: 'Thổi vào micro điện thoại để làm bay cánh hoa bồ công anh và đánh thức lời chúc 20/10',
    effectType: 'BLOW_MIC',
    thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=85',
    icon: '🌬️',
    gradient: 'from-emerald-600/70 via-teal-800/70 to-cyan-950',
    stats: { views: 0, hearts: 0, uses: 0 },
    defaultConfig: {
      recipientName: 'Người phụ nữ xinh đẹp',
      senderName: 'Người luôn nghĩ về em',
      mainText: 'Hãy thổi nhẹ và gửi điều ước của mình theo những cánh hoa nhé! Chúc em ngày 20/10 viên mãn, hạnh phúc và mãi mãi tươi trẻ như hoa bồ công anh! 🌼💨',
      themeColor: '#10B981',
      fontFamily: 'Be Vietnam Pro',
      musicPreset: 'noi-nay-co-anh',
      images: [],
    },
  },
  {
    id: 'polaroid-swipe',
    title: 'Polaroid Memory Stack',
    titleVi: 'Trạm Ký Ức Polaroid (Vuốt Thẻ)',
    category: '20-10',
    description: 'Swipe through stacked Polaroid memory cards to read heartfelt messages leading to a final surprise',
    descriptionVi: 'Vuốt từng bức ảnh kỷ niệm Polaroid để đọc từng dòng tâm sự dẫn đến bất ngờ cuối cùng',
    effectType: 'POLAROID_SWIPE',
    thumbnail: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=800&auto=format&fit=crop&q=85',
    icon: '📸',
    gradient: 'from-amber-700/80 via-orange-900/70 to-rose-950',
    stats: { views: 0, hearts: 0, uses: 0 },
    defaultConfig: {
      recipientName: 'Em gái thân yêu',
      senderName: 'Người luôn bên em',
      mainText: 'Mỗi tấm ảnh là một kỷ niệm đẹp mà chúng ta đã cùng nhau tạo ra. Cảm ơn em vì luôn xuất hiện trong cuốn phim cuộc đời này! 📸❤️',
      themeColor: '#F97316',
      fontFamily: 'Plus Jakarta Sans',
      musicPreset: 'see-tinh',
      images: [],
    },
  },
  {
    id: 'ai-gesture-unlock',
    title: 'Smile to Unlock AI',
    titleVi: 'Mật Mã Nụ Cười (Camera AI)',
    category: '20-10',
    description: 'Smile or make a heart gesture in front of the camera to unlock the secret 3D gift box',
    descriptionVi: 'Mỉm cười hoặc ghép tay thả tim trước camera AI để tự động mở hộp quà 3D bí mật',
    effectType: 'AI_GESTURE',
    thumbnail: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=800&auto=format&fit=crop&q=85',
    icon: '🤖',
    gradient: 'from-rose-500/80 via-pink-700/70 to-purple-950',
    stats: { views: 0, hearts: 0, uses: 0 },
    defaultConfig: {
      recipientName: 'Công chúa của anh',
      senderName: 'Người yêu em',
      mainText: 'AI đã nhận ra nụ cười đẹp nhất thế giới rồi đó! 🤖💗 Ngày 20/10, chúc em luôn tỏa sáng và hạnh phúc như nụ cười vừa rồi nhé!',
      themeColor: '#EC4899',
      fontFamily: 'Be Vietnam Pro',
      musicPreset: 'cuoi-thoi',
      images: [],
    },
  },
];
