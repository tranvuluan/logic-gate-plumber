export type Language = 'vi' | 'en';

export interface Translations {
  // Menu
  menu_subtitle: string;
  btn_continue: string;
  btn_play_new: string;
  btn_select_level: string;
  btn_tutorial: string;
  footer_text: string;
  tutorial_title: string;
  tutorial_body: string;
  btn_close: string;

  // Level Select
  level_select_title: string;
  progress_label: string;
  btn_back_menu: string;
  ch1_name: string;
  ch2_name: string;
  ch3_name: string;
  ch4_name: string;
  ch5_name: string;

  // Game HUD & Controls
  btn_back_levels: string;
  moves_label: string;
  par_label: string;
  moves_rem_label: string;
  moves_warning: string;
  btn_next_level: string;
  btn_next_endless: string;
  led_outputs: string;
  led_complete: string;
  clock_cycle: string;
  btn_rotate_left: string;
  btn_rotate_right: string;
  btn_hint: string;
  btn_cheat_sheet: string;
  btn_fit_screen: string;
  badge_rotate_left: string;
  badge_rotate_right: string;
  toast_all_correct: string;
  toast_hint_used: string;
  toast_short_circuit: string;

  // Out of Moves Modal
  out_of_moves_title: string;
  out_of_moves_desc: string;
  btn_retry: string;
  btn_levels_list: string;

  // Victory Modal
  win_title: string;
  win_endless_title: string;
  rating_3_stars: string;
  rating_2_stars: string;
  rating_1_star: string;
  win_moves_stat: string;
  btn_continue_next: string;
  btn_replay: string;

  // Cheat Sheet
  cheat_sheet_title: string;
  cheat_not_name: string;
  cheat_not_desc: string;
  cheat_and_name: string;
  cheat_and_desc: string;
  cheat_nand_name: string;
  cheat_nand_desc: string;
  cheat_or_name: string;
  cheat_or_desc: string;
  cheat_nor_name: string;
  cheat_nor_desc: string;
  cheat_xor_name: string;
  cheat_xor_desc: string;
  cheat_xnor_name: string;
  cheat_xnor_desc: string;
  cheat_diode_name: string;
  cheat_diode_desc: string;
  cheat_bridge_name: string;
  cheat_bridge_desc: string;
  cheat_split_name: string;
  cheat_split_desc: string;
}

const DICTIONARY: Record<Language, Translations> = {
  vi: {
    menu_subtitle: '— Nối mạch Kỹ thuật số —',
    btn_continue: '▶  CHƠI TIẾP (MÀN {level})',
    btn_play_new: '▶  BẮT ĐẦU CHƠI',
    btn_select_level: '📋  CHỌN MÀN CHƠI',
    btn_tutorial: '📖  HƯỚNG DẪN',
    footer_text: 'v1.0.0 • Made by Tran Vu Luan',
    tutorial_title: '📖 HƯỚNG DẪN CHƠI',
    tutorial_body:
      '1. Mục tiêu:\nNối dòng điện từ Nguồn (Source) qua các cổng logic đến Đèn LED đầu ra.\n\n' +
      '2. Cách điều khiển:\n' +
      '• Chạm nửa TRÁI ô để xoay Trái (↺).\n' +
      '• Chạm nửa PHẢI ô để xoay Phải (↻).\n' +
      '• Hoặc chọn ô rồi bấm 2 nút [↺ TRÁI] / [↻ PHẢI] ở góc dưới.\n' +
      '• Trên PC: Chuột phải = Xoay Trái, Chuột trái = Xoay Phải, phím Q / E.\n\n' +
      '3. Cổng Logic:\n' +
      '• NOT: Đảo bit (0 thành 1, 1 thành 0).\n' +
      '• AND: Chỉ ra 1 khi CẢ HAI ngõ vào là 1.\n' +
      '• OR: Ra 1 khi ÍT NHẤT 1 ngõ vào là 1.\n' +
      '• XOR: Ra 1 khi hai ngõ vào KHÁC NHAU.\n' +
      '• NAND/NOR/XNOR: Các cổng đảo của AND, OR, XOR.\n\n' +
      '4. Tiêu chuẩn 3 Sao:\n' +
      'Giải mạch trong số lượt xoay tối ưu (Par Moves) để đạt 3 Sao!',
    btn_close: '[ ✕ ĐÓNG ]',

    level_select_title: 'CHỌN MÀN CHƠI',
    progress_label: 'TIẾN ĐỘ: {unlocked}/100  ★ {stars}/300',
    btn_back_menu: '← MENU',
    ch1_name: 'Khởi Nguyên',
    ch2_name: 'Cổng Đảo & Vượt Cáp',
    ch3_name: 'Khóa Cứng & Đa Trạng Thái',
    ch4_name: 'Xung Nhịp Chân Trị',
    ch5_name: 'Bậc Thầy Vi Mạch',

    btn_back_levels: '← CHỌN MÀN',
    moves_label: 'LƯỢT',
    par_label: 'CHUẨN',
    moves_rem_label: 'CÒN',
    moves_warning: '⚠️ NGUY HIỂM: CÒN {rem} LƯỢT!',
    btn_next_level: '⏩ QUA MÀN {next} ➔',
    btn_next_endless: '⏩ MÀN VÔ TẬN TIẾP ➔',
    led_outputs: '💡 ĐẦU RA',
    led_complete: '✅ HOÀN TẤT',
    clock_cycle: '⏱️ CHU KỲ',
    btn_rotate_left: '↺ TRÁI (Q)',
    btn_rotate_right: '↻ PHẢI (E)',
    btn_hint: 'GỢI Ý',
    btn_cheat_sheet: 'TRA CỨU',
    btn_fit_screen: '⛶ VỪA MÀN',
    badge_rotate_left: '↺ XOAY TRÁI',
    badge_rotate_right: '↻ XOAY PHẢI',
    toast_all_correct: '✅ Mọi cổng đã đúng chiều!',
    toast_hint_used: '✨ Đã sửa đúng & khóa 1 cổng!',
    toast_short_circuit: '⚡ CẢNH BÁO: ĐOẢN MẠCH! HÃY TÁCH NGÕ RA!',

    out_of_moves_title: 'HẾT LƯỢT XOAY!',
    out_of_moves_desc:
      'Bạn đã sử dụng hết {moves}/{max} lượt xoay!\nTiêu chuẩn 3 Sao của màn này là {par} lượt.\nHãy tính toán đường dẫn kỹ thuật số trước khi xoay.',
    btn_retry: '🔄 THỬ LẠI NGAY',
    btn_levels_list: '📋 DANH SÁCH MÀN CHƠI',

    win_title: 'HOÀN THÀNH MÀN {level}!',
    win_endless_title: 'MÀN VÔ TẬN #{level}!',
    rating_3_stars: '🏆 ĐẠT TIÊU CHUẨN HOÀN HẢO (3 SAO)!',
    rating_2_stars: '⚡ XUẤT SẮC (2 SAO)!',
    rating_1_star: '👍 HOÀN THÀNH (1 SAO)!',
    win_moves_stat: 'LƯỢT XOAY: {moves}/{max} (Chuẩn 3★: {par} lượt)',
    btn_continue_next: '▶  TIẾP TỤC QUA MÀN {next}',
    btn_replay: '🔄 CHƠI LẠI',

    cheat_sheet_title: '📖 BẢNG TRA CỨU CỔNG LOGIC',
    cheat_not_name: 'CỔNG NOT (▷○)',
    cheat_not_desc: 'Đảo bit: 0 ➜ 1  |  1 ➜ 0',
    cheat_and_name: 'CỔNG AND (&)',
    cheat_and_desc: 'VÀ: Cả hai đầu vào đều là 1 mới ra 1',
    cheat_nand_name: 'CỔNG NAND (⊼)',
    cheat_nand_desc: 'Đảo AND: Ra 0 khi cả hai là 1, còn lại ra 1',
    cheat_or_name: 'CỔNG OR (≥1)',
    cheat_or_desc: 'HOẶC: Ít nhất 1 đầu vào là 1 thì ra 1',
    cheat_nor_name: 'CỔNG NOR (⊽)',
    cheat_nor_desc: 'Đảo OR: Chỉ ra 1 khi cả hai đầu vào là 0',
    cheat_xor_name: 'CỔNG XOR (=1)',
    cheat_xor_desc: 'KHÁC NHAU: Hai đầu khác nhau (1 & 0) ra 1',
    cheat_xnor_name: 'CỔNG XNOR (≡)',
    cheat_xnor_desc: 'GIỐNG NHAU: Hai đầu giống nhau (1&1, 0&0) ra 1',
    cheat_diode_name: 'DIODE (▷|)',
    cheat_diode_desc: '1 CHIỀU: Dòng điện chỉ đi xuôi theo mũi tên',
    cheat_bridge_name: 'CẦU VƯỢT (┼)',
    cheat_bridge_desc: 'VƯỢT CÁP: Tín hiệu ngang và dọc đi xuyên không chập',
    cheat_split_name: 'CHIA NGÃ 4 (✚)',
    cheat_split_desc: 'PHÂN TOẢ: Tín hiệu vào 1 chân sẽ tỏa ra cả 3 chân',
  },
  en: {
    menu_subtitle: '— Digital Circuit Puzzle —',
    btn_continue: '▶  CONTINUE (LEVEL {level})',
    btn_play_new: '▶  START GAME',
    btn_select_level: '📋  SELECT LEVEL',
    btn_tutorial: '📖  HOW TO PLAY',
    footer_text: 'v1.0.0 • Made by Tran Vu Luan',
    tutorial_title: '📖 HOW TO PLAY',
    tutorial_body:
      '1. Objective:\nRoute power from Sources through logic gates to satisfy target LEDs.\n\n' +
      '2. Controls:\n' +
      '• Tap LEFT side of cell to rotate Counter-Clockwise (↺).\n' +
      '• Tap RIGHT side of cell to rotate Clockwise (↻).\n' +
      '• Or select cell and use [↺ LEFT] / [↻ RIGHT] buttons below.\n' +
      '• On Desktop: Right click = Left rotate, Left click = Right rotate, Q / E keys.\n\n' +
      '3. Logic Gates:\n' +
      '• NOT: Inverts signal (0 to 1, 1 to 0).\n' +
      '• AND: Outputs 1 only if BOTH inputs are 1.\n' +
      '• OR: Outputs 1 if AT LEAST ONE input is 1.\n' +
      '• XOR: Outputs 1 if inputs are DIFFERENT.\n' +
      '• NAND/NOR/XNOR: Inverted versions of AND, OR, XOR.\n\n' +
      '4. 3-Star Rating:\n' +
      'Solve within the optimal Par Moves limit to earn 3 Stars!',
    btn_close: '[ ✕ CLOSE ]',

    level_select_title: 'SELECT LEVEL',
    progress_label: 'PROGRESS: {unlocked}/100  ★ {stars}/300',
    btn_back_menu: '← MENU',
    ch1_name: 'Genesis',
    ch2_name: 'Inversion & Bridges',
    ch3_name: 'Locked Tiles & Multi-State',
    ch4_name: 'Clock & Truth Tables',
    ch5_name: 'Master Engineer',

    btn_back_levels: '← LEVELS',
    moves_label: 'MOVES',
    par_label: 'PAR',
    moves_rem_label: 'LEFT',
    moves_warning: '⚠️ DANGER: {rem} MOVES LEFT!',
    btn_next_level: '⏩ NEXT LEVEL {next} ➔',
    btn_next_endless: '⏩ NEXT ENDLESS ➔',
    led_outputs: '💡 OUTPUTS',
    led_complete: '✅ READY',
    clock_cycle: '⏱️ CYCLE',
    btn_rotate_left: '↺ LEFT (Q)',
    btn_rotate_right: '↻ RIGHT (E)',
    btn_hint: 'HINT',
    btn_cheat_sheet: 'GUIDE',
    btn_fit_screen: '⛶ FIT ZOOM',
    badge_rotate_left: '↺ ROTATE LEFT',
    badge_rotate_right: '↻ ROTATE RIGHT',
    toast_all_correct: '✅ All gates are in correct positions!',
    toast_hint_used: '✨ Solved and locked 1 gate!',
    toast_short_circuit: '⚡ WARNING: SHORT CIRCUIT! SEPARATE OUTPUTS!',

    out_of_moves_title: 'OUT OF MOVES!',
    out_of_moves_desc:
      'You have used all {moves}/{max} moves!\nOptimal par for 3 Stars on this level is {par} moves.\nPlan your digital path before rotating.',
    btn_retry: '🔄 RETRY NOW',
    btn_levels_list: '📋 SELECT LEVEL',

    win_title: 'LEVEL {level} COMPLETED!',
    win_endless_title: 'ENDLESS #{level}!',
    rating_3_stars: '🏆 PERFECT 3-STAR SCORE!',
    rating_2_stars: '⚡ EXCELLENT (2 STARS)!',
    rating_1_star: '👍 LEVEL PASSED (1 STAR)!',
    win_moves_stat: 'MOVES: {moves}/{max} (Par 3★: {par} moves)',
    btn_continue_next: '▶  CONTINUE TO LEVEL {next}',
    btn_replay: '🔄 REPLAY',

    cheat_sheet_title: '📖 LOGIC GATE CHEAT SHEET',
    cheat_not_name: 'NOT GATE (▷○)',
    cheat_not_desc: 'Invert: 0 ➜ 1  |  1 ➜ 0',
    cheat_and_name: 'AND GATE (&)',
    cheat_and_desc: 'AND: Outputs 1 only when BOTH inputs are 1',
    cheat_nand_name: 'NAND GATE (⊼)',
    cheat_nand_desc: 'Inverted AND: Outputs 0 when both are 1, else 1',
    cheat_or_name: 'OR GATE (≥1)',
    cheat_or_desc: 'OR: Outputs 1 if at least one input is 1',
    cheat_nor_name: 'NOR GATE (⊽)',
    cheat_nor_desc: 'Inverted OR: Outputs 1 only when both inputs are 0',
    cheat_xor_name: 'XOR GATE (=1)',
    cheat_xor_desc: 'DIFFERENT: Outputs 1 when inputs differ (1 & 0)',
    cheat_xnor_name: 'XNOR GATE (≡)',
    cheat_xnor_desc: 'EQUAL: Outputs 1 when inputs match (1&1, 0&0)',
    cheat_diode_name: 'DIODE (▷|)',
    cheat_diode_desc: 'ONE-WAY: Current only flows in the arrow direction',
    cheat_bridge_name: 'CROSSOVER BRIDGE (┼)',
    cheat_bridge_desc: 'BRIDGE: Horizontal & vertical signals cross safely',
    cheat_split_name: '4-WAY SPLITTER (✚)',
    cheat_split_desc: 'DISTRIBUTOR: 1 input fans out to all 3 outputs',
  },
};

const STORAGE_KEY = 'logic_gate_language';

class I18nManager {
  private currentLang: Language = 'vi';

  constructor() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Language;
      if (saved === 'vi' || saved === 'en') {
        this.currentLang = saved;
      } else {
        const sysLang = navigator.language || '';
        this.currentLang = sysLang.toLowerCase().startsWith('vi') ? 'vi' : 'en';
      }
    } catch {
      this.currentLang = 'vi';
    }
  }

  getLanguage(): Language {
    return this.currentLang;
  }

  setLanguage(lang: Language): void {
    this.currentLang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {}
  }

  toggleLanguage(): Language {
    const nextLang: Language = this.currentLang === 'vi' ? 'en' : 'vi';
    this.setLanguage(nextLang);
    return nextLang;
  }

  t(key: keyof Translations, params?: Record<string, string | number>): string {
    const dict = DICTIONARY[this.currentLang] || DICTIONARY.vi;
    let text = dict[key] || DICTIONARY.vi[key] || '';
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }
    }
    return text;
  }

  translateLevelName(id: number, viName: string): string {
    if (this.currentLang === 'vi') return viName;
    return `Level ${id}: ${this.getEnglishLevelTitle(id, viName)}`;
  }

  translateLevelSubtitle(id: number, viSubtitle: string): string {
    if (this.currentLang === 'vi') return viSubtitle;
    return this.getEnglishLevelSubtitle(id, viSubtitle);
  }

  translateTutorialText(id: number, viTutorial: string): string {
    if (this.currentLang === 'vi') return viTutorial;
    return this.getEnglishTutorial(id, viTutorial);
  }

  private getEnglishLevelTitle(id: number, fallback: string): string {
    const EN_TITLES: Record<number, string> = {
      1: 'Getting Started',
      2: 'NOT Inverter',
      3: 'Corner Routing',
      4: 'OR Gate',
      5: 'T-Splitter',
      6: 'AND Gate',
      7: 'Invert & Combine',
      8: 'XOR Gate',
      9: 'Multi-Gate Cascade',
      10: 'Digital Heart',
      11: 'Half Adder Circuit',
      12: 'Dual Inversion',
      13: 'Parity Checker',
      14: 'Multiplexer MUX',
      15: 'Bridge Labyrinth',
      16: 'NAND Inverter',
      17: 'NOR Gate',
      18: 'XNOR & Diode',
      19: 'Wire Crossover',
      20: 'Two-Tier Array',
      21: 'Bridge & Inversion',
      22: 'NOR Convergence',
      23: 'Dual Rail Split',
      24: 'X-Cross Junction',
      25: 'XNOR Matching Tree',
    };
    return EN_TITLES[id] || fallback.replace(/^Màn \d+:\s*/, '');
  }

  private getEnglishLevelSubtitle(id: number, fallback: string): string {
    const EN_SUBS: Record<number, string> = {
      1: 'Straight wire trace',
      2: 'Invert 0 into 1',
      3: 'Corner redirection',
      4: 'At least one live input',
      5: 'Split 1 source to 2 LEDs',
      6: 'Both inputs must be 1',
      7: 'Turn 0 to 1 before AND',
      8: 'Different inputs required',
      9: 'Sequential logic gates',
      10: 'Master 3 output LEDs',
      11: 'Sum (XOR) & Carry (AND)',
      12: 'Invert two negative rails',
      13: 'Two-stage parity check',
      14: 'Route data with selector',
      15: 'Complex crossover bridge',
      16: 'Universal NAND gate',
      17: 'Inverted OR logic',
      18: 'Equality gate & one-way diode',
      19: 'Non-interfering wire bridge',
      20: 'Cascaded digital logic',
      21: 'Horizontal NAND, vertical NOR',
      22: 'XOR & AND converge to NOR',
      23: 'Single source dual branch',
      24: 'Intersection of 1 and 0',
      25: 'Equivalence condition tree',
    };
    return EN_SUBS[id] || fallback;
  }

  private getEnglishTutorial(id: number, fallback: string): string {
    const EN_TUTS: Record<number, string> = {
      1: '👆 Tap the middle WIRE to connect Source (1) to the LED!',
      2: '⚡ NOT gate (▷○) inverts 0 to 1. Rotate it toward the LED!',
      3: '🔄 Corner wire (L) turns current. Route it down into the LED.',
      4: '⚡ OR gate (≥1): Needs at least one live input (Top or Bottom).',
      5: '🔱 T-Splitter divides current. Connect both output LEDs!',
      6: '⚡ AND gate (&): BOTH Top and Bottom inputs must be 1.',
      7: '💡 Bottom rail carries 0! Rotate NOT to invert it to 1 before AND.',
      8: '⚡ XOR gate (=1): Outputs 1 when inputs DIFFER (1 & 0).',
      9: '🧩 Multi-stage circuit: Balance both gates to light the LED.',
      10: '👑 Master AND, OR, XOR, NOT to light all 3 LEDs simultaneously!',
    };
    return EN_TUTS[id] || fallback;
  }
}

export const i18n = new I18nManager();
