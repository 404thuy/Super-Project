import type { PresetWish } from '../types';

export const PRESET_WISHES: PresetWish[] = [
  // ================= MẸ =================
  {
    id: 'mom-1',
    target: 'mom',
    label: 'Cảm ơn tình yêu thương bao la',
    text: 'Nhân ngày 20/10, con chúc Mẹ yêu luôn mạnh khỏe, bình an và ngập tràn niềm vui. Cảm ơn Mẹ đã luôn hy sinh và là điểm tựa ấm áp nhất của cuộc đời con. Con yêu Mẹ rất nhiều! 🌹',
  },
  {
    id: 'mom-2',
    target: 'mom',
    label: 'Mẹ là kỳ quan đẹp nhất',
    text: 'Chúc người phụ nữ tuyệt vời nhất trần đời ngày 20/10 thật rạng rỡ. Mong nụ cười luôn nở trên môi Mẹ và mọi lo toan nhường chỗ cho bình yên, hạnh phúc! 💕',
  },
  {
    id: 'mom-3',
    target: 'mom',
    label: 'Lời hứa của con',
    text: 'Cảm ơn Mẹ vì tất cả những bữa cơm ấm áp, những ân cần chăm sóc. Ngày 20/10 con chỉ mong Mẹ luôn an vui, bớt vất vả, chúng con sẽ luôn cố gắng để Mẹ tự hào! 🌸',
  },
  {
    id: 'mom-4',
    target: 'mom',
    label: 'Mẹ mãi là điểm tựa',
    text: 'Dù đi xa đến đâu, vòng tay của Mẹ vẫn là nơi bình yên nhất. Chúc Mẹ 20/10 thật nhiều sức khỏe, luôn tươi trẻ và mãi là bông hoa thơm ngát của gia đình! 💐',
  },

  // ================= VỢ =================
  {
    id: 'wife-1',
    target: 'wife',
    label: 'Vợ là mảnh ghép hoàn hảo',
    text: 'Chúc vợ yêu ngày 20/10 thật rạng ngời và hạnh phúc. Cảm ơn em đã cùng anh vun đắp tổ ấm, chia sẻ ngọt bùi. Có em bên cạnh là điều may mắn nhất đời anh! 🌹',
  },
  {
    id: 'wife-2',
    target: 'wife',
    label: 'Yêu em như ngày đầu',
    text: 'Ngày 20/10, anh chỉ muốn ôm em thật chặt và nói rằng anh yêu em nhiều hơn mỗi ngày. Mọi sự dịu dàng và yêu thương của anh mãi mãi dành riêng cho em! 💖',
  },
  {
    id: 'wife-3',
    target: 'wife',
    label: 'Tri ân người bạn đời',
    text: 'Cảm ơn em vì đã luôn chu đáo, kiên nhẫn và đồng hành cùng anh qua mọi chặng đường. Chúc bà xã xinh đẹp của anh một ngày 20/10 tràn ngập tiếng cười! ✨',
  },
  {
    id: 'wife-4',
    target: 'wife',
    label: 'Nụ cười của em',
    text: 'Nếu được chọn lại một ngàn lần, anh vẫn chọn nắm tay em đi qua cuộc đời này. Chúc vợ yêu ngày 20/10 ngập tràn quà tặng và hạnh phúc ngập tràn! 🎁',
  },

  // ================= NGƯỜI YÊU / CRUSH =================
  {
    id: 'crush-1',
    target: 'crush',
    label: 'Em là vũ trụ của anh',
    text: 'Ngày 20/10, chúc em bé của anh luôn xinh đẹp, đáng yêu và ngập tràn hạnh phúc. Nụ cười của em chính là điều kỳ diệu nhất thắp sáng mỗi ngày của anh! 🌹',
  },
  {
    id: 'crush-2',
    target: 'crush',
    label: 'Ngọt ngào lãng mạn',
    text: 'Nếu thế giới có hàng tỷ bông hoa, thì em vẫn là bông hoa rực rỡ và ngọt ngào nhất. Chúc em ngày 20/10 thật trọn vẹn, và nhớ là anh luôn ở đây thương em! 💕',
  },
  {
    id: 'crush-3',
    target: 'crush',
    label: 'Bật đèn xanh (Tỏ tình)',
    text: 'Nhân ngày 20/10, anh muốn mượn tấm thiệp này để bày tỏ: Anh thích nụ cười của em từ rất lâu rồi. Chúc em một ngày thật vui vẻ và mong sớm được chăm sóc em mỗi ngày! ✨',
  },
  {
    id: 'crush-4',
    target: 'crush',
    label: 'Giai điệu tình yêu',
    text: 'Mỗi khoảnh khắc bên em đều dịu dàng tựa một khúc ca mùa thu. Chúc công chúa của anh 20/10 nhận được muôn vàn điều ngọt ngào nhất nhé! 🎵',
  },

  // ================= CÔ GIÁO =================
  {
    id: 'teacher-1',
    target: 'teacher',
    label: 'Tri ân người lái đò',
    text: 'Nhân ngày Phụ nữ Việt Nam 20/10, chúng em xin kính chúc Cô luôn mạnh khỏe, hạnh phúc và tràn đầy nhiệt huyết để tiếp tục dìu dắt bao thế hệ học trò cập bến tri thức! 🌹',
  },
  {
    id: 'teacher-2',
    target: 'teacher',
    label: 'Kính yêu và biết ơn',
    text: 'Cảm ơn Cô vì những bài giảng truyền cảm hứng và sự bao dung, tận tụy. Kính chúc Cô có một ngày 20/10 thật nhiều niềm vui, hoa và những lời chúc tốt đẹp nhất! 🌸',
  },
  {
    id: 'teacher-3',
    target: 'teacher',
    label: 'Bông hoa tri thức',
    text: 'Kính chúc Cô giáo kính yêu luôn tươi trẻ, bình an và gặt hái thêm nhiều thành công trong sự nghiệp trồng người cao quý. Chúng em luôn nhớ ơn Cô! 💐',
  },

  // ================= ĐỒNG NGHIỆP NỮ =================
  {
    id: 'colleague-1',
    target: 'colleague',
    label: 'Rạng rỡ và thăng tiến',
    text: 'Chúc người chị/bạn đồng nghiệp tuyệt vời ngày 20/10 thật rạng rỡ, xinh đẹp, công việc hanh thông, KPI vượt chỉ tiêu và luôn giữ nguồn năng lượng tích cực! 🎉',
  },
  {
    id: 'colleague-2',
    target: 'colleague',
    label: 'Thanh xuân rực rỡ',
    text: 'Mừng ngày 20/10! Chúc phái đẹp của team chúng ta luôn tươi trẻ như hoa mùa xuân, công việc nhẹ nhàng, lương thưởng ngập tràn và luôn được yêu thương! 🌹',
  },
  {
    id: 'colleague-3',
    target: 'colleague',
    label: 'Tỏa sáng nơi công sở',
    text: 'Cảm ơn bạn đã luôn là người đồng hành đáng tin cậy và mang lại nhiều tiếng cười cho văn phòng. Chúc bạn ngày 20/10 tràn ngập hoa, quà và hạnh phúc! ✨',
  },
];
