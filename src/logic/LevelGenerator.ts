import { GateType, Direction, GateDefinition, LevelDefinition } from '../utils/Constants';
import { getDefaultPorts } from './GateTypes';

/**
 * 20 Progressive Levels from beginner tutorials to master Cyber CPU circuits.
 */
export function getLevels(): LevelDefinition[] {
  return [
    // ==========================================
    // LEVEL 1: Tutorial - Dây Dẫn Thẳng (Wire Intro)
    // ==========================================
    {
      id: 1,
      name: 'Màn 1: Khởi Động',
      subtitle: 'Nối dây dẫn thẳng',
      gridWidth: 3,
      gridHeight: 3,
      tutorialText: '👆 Chạm vào DÂY DẪN ở giữa để xoay nối thông mạch từ Nguồn (1) đến Đèn LED!',
      timeLimit: 60,
      cells: createGrid(3, 3, [
        { r: 1, c: 0, type: GateType.SOURCE, rotation: 0, correctRotation: 0, fixed: true },
        { r: 1, c: 1, type: GateType.WIRE, rotation: 1, correctRotation: 0, fixed: false },
        { r: 1, c: 2, type: GateType.LED, rotation: 0, correctRotation: 0, fixed: true },
      ]),
      sources: [{ row: 1, col: 0, value: 1 }],
      leds: [{ row: 1, col: 2 }],
    },

    // ==========================================
    // LEVEL 2: Tutorial - Cổng Đảo NOT (Inverter)
    // ==========================================
    {
      id: 2,
      name: 'Màn 2: Cổng Đảo NOT',
      subtitle: 'Đảo tín hiệu 0 thành 1',
      gridWidth: 3,
      gridHeight: 3,
      tutorialText: '⚡ Cổng NOT (▷○) đảo 0 thành 1. Hãy xoay cổng hướng về phía đèn LED để thắp sáng!',
      timeLimit: 60,
      cells: createGrid(3, 3, [
        { r: 1, c: 0, type: GateType.SOURCE, rotation: 0, correctRotation: 0, fixed: true },
        { r: 1, c: 1, type: GateType.NOT, rotation: 1, correctRotation: 0, fixed: false },
        { r: 1, c: 2, type: GateType.LED, rotation: 0, correctRotation: 0, fixed: true },
      ]),
      sources: [{ row: 1, col: 0, value: 0 }],
      leds: [{ row: 1, col: 2 }],
    },

    // ==========================================
    // LEVEL 3: Tutorial - Dây Góc L (Corner Wire)
    // ==========================================
    {
      id: 3,
      name: 'Màn 3: Uốn Mạch',
      subtitle: 'Dây góc chuyển hướng',
      gridWidth: 3,
      gridHeight: 3,
      tutorialText: '🔄 Dây góc (L) đổi hướng dòng điện! Xoay các khớp nối để uốn dòng điện xuống đèn LED.',
      timeLimit: 70,
      cells: createGrid(3, 3, [
        { r: 0, c: 0, type: GateType.SOURCE, rotation: 0, correctRotation: 0, fixed: true },
        { r: 0, c: 1, type: GateType.WIRE_CORNER, rotation: 2, correctRotation: 0, fixed: false },
        { r: 1, c: 1, type: GateType.WIRE, rotation: 0, correctRotation: 1, fixed: false },
        { r: 2, c: 1, type: GateType.WIRE_CORNER, rotation: 1, correctRotation: 2, fixed: false },
        { r: 2, c: 2, type: GateType.LED, rotation: 0, correctRotation: 0, fixed: true },
      ]),
      sources: [{ row: 0, col: 0, value: 1 }],
      leds: [{ row: 2, col: 2 }],
    },

    // ==========================================
    // LEVEL 4: Tutorial - Cổng OR (Hoặc)
    // ==========================================
    {
      id: 4,
      name: 'Màn 4: Cổng OR',
      subtitle: 'Chỉ cần một nhánh có điện',
      gridWidth: 3,
      gridHeight: 3,
      tutorialText: '⚡ Cổng OR (≥1): Nhận 2 nhánh điện (Trên & Dưới). Chỉ cần ít nhất 1 nhánh là 1, đầu ra sẽ bật!',
      timeLimit: 75,
      cells: createGrid(3, 3, [
        { r: 0, c: 0, type: GateType.SOURCE, rotation: 0, correctRotation: 0, fixed: true },
        { r: 0, c: 1, type: GateType.WIRE_CORNER, rotation: 1, correctRotation: 0, fixed: false },
        { r: 1, c: 1, type: GateType.OR, rotation: 2, correctRotation: 0, fixed: false },
        { r: 1, c: 2, type: GateType.LED, rotation: 0, correctRotation: 0, fixed: true },
        { r: 2, c: 0, type: GateType.SOURCE, rotation: 0, correctRotation: 0, fixed: true },
        { r: 2, c: 1, type: GateType.WIRE_CORNER, rotation: 0, correctRotation: 1, fixed: false },
      ]),
      sources: [
        { row: 0, col: 0, value: 1 },
        { row: 2, col: 0, value: 0 },
      ],
      leds: [{ row: 1, col: 2 }],
    },

    // ==========================================
    // LEVEL 5: Tutorial - Phân Nhánh T-Split
    // ==========================================
    {
      id: 5,
      name: 'Màn 5: Phân Nhánh (T)',
      subtitle: 'Chia nguồn sáng 2 đèn LED',
      gridWidth: 4,
      gridHeight: 3,
      tutorialText: '🔱 Bộ phân nhánh (T) chia đôi dòng điện. Hãy nối dây để thắp sáng CẢ HAI đèn LED!',
      timeLimit: 80,
      cells: createGrid(3, 4, [
        { r: 1, c: 0, type: GateType.SOURCE, rotation: 0, correctRotation: 0, fixed: true },
        { r: 1, c: 1, type: GateType.WIRE, rotation: 1, correctRotation: 0, fixed: false },
        { r: 1, c: 2, type: GateType.SPLIT, rotation: 2, correctRotation: 0, fixed: false },
        { r: 1, c: 3, type: GateType.LED, rotation: 0, correctRotation: 0, fixed: true },
        { r: 2, c: 2, type: GateType.WIRE_CORNER, rotation: 0, correctRotation: 2, fixed: false },
        { r: 2, c: 3, type: GateType.LED, rotation: 0, correctRotation: 0, fixed: true },
      ]),
      sources: [{ row: 1, col: 0, value: 1 }],
      leds: [
        { row: 1, col: 3 },
        { row: 2, col: 3 },
      ],
    },

    // ==========================================
    // LEVEL 6: Tutorial - Cổng AND (Và)
    // ==========================================
    {
      id: 6,
      name: 'Màn 6: Cổng AND',
      subtitle: 'Cả hai đầu vào phải là 1',
      gridWidth: 3,
      gridHeight: 3,
      tutorialText: '⚡ Cổng AND (&): Bắt buộc CẢ HAI nhánh (Trên & Dưới) đều phải là 1 thì đèn mới sáng!',
      timeLimit: 80,
      cells: createGrid(3, 3, [
        { r: 0, c: 0, type: GateType.SOURCE, rotation: 0, correctRotation: 0, fixed: true },
        { r: 0, c: 1, type: GateType.WIRE_CORNER, rotation: 2, correctRotation: 0, fixed: false },
        { r: 1, c: 1, type: GateType.AND, rotation: 1, correctRotation: 0, fixed: false },
        { r: 1, c: 2, type: GateType.LED, rotation: 0, correctRotation: 0, fixed: true },
        { r: 2, c: 0, type: GateType.SOURCE, rotation: 0, correctRotation: 0, fixed: true },
        { r: 2, c: 1, type: GateType.WIRE_CORNER, rotation: 3, correctRotation: 1, fixed: false },
      ]),
      sources: [
        { row: 0, col: 0, value: 1 },
        { row: 2, col: 0, value: 1 },
      ],
      leds: [{ row: 1, col: 2 }],
    },

    // ==========================================
    // LEVEL 7: Logic Ghép - NOT + AND
    // ==========================================
    {
      id: 7,
      name: 'Màn 7: Đảo & Ghép',
      subtitle: 'Biến đổi 0 thành 1 trước khi vào AND',
      gridWidth: 4,
      gridHeight: 3,
      tutorialText: '💡 Nhánh dưới mang điện 0! Hãy xoay cổng NOT để đảo thành 1 trước khi đưa vào cổng AND.',
      timeLimit: 85,
      cells: createGrid(3, 4, [
        { r: 0, c: 0, type: GateType.SOURCE, rotation: 0, correctRotation: 0, fixed: true },
        { r: 0, c: 1, type: GateType.WIRE, rotation: 1, correctRotation: 0, fixed: false },
        { r: 0, c: 2, type: GateType.WIRE_CORNER, rotation: 2, correctRotation: 0, fixed: false },

        { r: 1, c: 2, type: GateType.AND, rotation: 3, correctRotation: 0, fixed: false },
        { r: 1, c: 3, type: GateType.LED, rotation: 0, correctRotation: 0, fixed: true },

        { r: 2, c: 0, type: GateType.SOURCE, rotation: 0, correctRotation: 0, fixed: true },
        { r: 2, c: 1, type: GateType.NOT, rotation: 2, correctRotation: 0, fixed: false },
        { r: 2, c: 2, type: GateType.WIRE_CORNER, rotation: 0, correctRotation: 1, fixed: false },
      ]),
      sources: [
        { row: 0, col: 0, value: 1 },
        { row: 2, col: 0, value: 0 },
      ],
      leds: [{ row: 1, col: 3 }],
    },

    // ==========================================
    // LEVEL 8: Tutorial - Cổng XOR (Khác Biệt)
    // ==========================================
    {
      id: 8,
      name: 'Màn 8: Cổng XOR',
      subtitle: 'Đầu vào khác nhau mới sáng',
      gridWidth: 4,
      gridHeight: 3,
      tutorialText: '⚡ Cổng XOR (=1): Cho ra 1 khi hai đầu vào KHÁC NHAU (1 và 0). Nếu giống nhau (1 & 1) sẽ tắt!',
      timeLimit: 85,
      cells: createGrid(3, 4, [
        { r: 0, c: 0, type: GateType.SOURCE, rotation: 0, correctRotation: 0, fixed: true },
        { r: 0, c: 1, type: GateType.WIRE_CORNER, rotation: 1, correctRotation: 0, fixed: false },

        { r: 1, c: 1, type: GateType.XOR, rotation: 1, correctRotation: 0, fixed: false },
        { r: 1, c: 2, type: GateType.WIRE, rotation: 1, correctRotation: 0, fixed: false },
        { r: 1, c: 3, type: GateType.LED, rotation: 0, correctRotation: 0, fixed: true },

        { r: 2, c: 0, type: GateType.SOURCE, rotation: 0, correctRotation: 0, fixed: true },
        { r: 2, c: 1, type: GateType.WIRE_CORNER, rotation: 3, correctRotation: 1, fixed: false },
      ]),
      sources: [
        { row: 0, col: 0, value: 1 },
        { row: 2, col: 0, value: 0 },
      ],
      leds: [{ row: 1, col: 3 }],
    },

    // ==========================================
    // LEVEL 9: Mạch Phức Hợp (OR + NOT + AND)
    // ==========================================
    {
      id: 9,
      name: 'Màn 9: Mạch Liên Hoàn',
      subtitle: 'Kết hợp cổng logic đa tầng',
      gridWidth: 4,
      gridHeight: 4,
      tutorialText: '🧠 Vận dụng tất cả cổng đã học: dùng OR và NOT để tạo ra hai nguồn điện 1 đưa vào cổng AND!',
      timeLimit: 95,
      cells: createGrid(4, 4, [
        { r: 0, c: 0, type: GateType.SOURCE, rotation: 0, correctRotation: 0, fixed: true },
        { r: 0, c: 1, type: GateType.WIRE_CORNER, rotation: 2, correctRotation: 0, fixed: false },

        { r: 1, c: 1, type: GateType.OR, rotation: 1, correctRotation: 0, fixed: false },
        { r: 1, c: 2, type: GateType.WIRE_CORNER, rotation: 1, correctRotation: 0, fixed: false },

        { r: 2, c: 0, type: GateType.SOURCE, rotation: 0, correctRotation: 0, fixed: true },
        { r: 2, c: 1, type: GateType.WIRE_CORNER, rotation: 3, correctRotation: 1, fixed: false },
        { r: 2, c: 2, type: GateType.AND, rotation: 2, correctRotation: 0, fixed: false },
        { r: 2, c: 3, type: GateType.LED, rotation: 0, correctRotation: 0, fixed: true },

        { r: 3, c: 0, type: GateType.SOURCE, rotation: 0, correctRotation: 0, fixed: true },
        { r: 3, c: 1, type: GateType.NOT, rotation: 2, correctRotation: 0, fixed: false },
        { r: 3, c: 2, type: GateType.WIRE_CORNER, rotation: 0, correctRotation: 1, fixed: false },
      ]),
      sources: [
        { row: 0, col: 0, value: 0 },
        { row: 2, col: 0, value: 1 },
        { row: 3, col: 0, value: 0 },
      ],
      leds: [{ row: 2, col: 3 }],
    },

    // ==========================================
    // LEVEL 10: Trái Tim Kỹ Thuật Số (10-Gate Climax)
    // ==========================================
    {
      id: 10,
      name: 'Màn 10: Trái Tim Số',
      subtitle: 'Thử thách đỉnh cao 3 đèn LED',
      gridWidth: 5,
      gridHeight: 4,
      tutorialText: '👑 Xoay thông minh các cổng AND, OR, XOR, NOT để đồng thời thắp sáng cả 3 đèn LED!',
      timeLimit: 110,
      cells: createGrid(4, 5, [
        { r: 0, c: 0, type: GateType.SOURCE, rotation: 0, correctRotation: 0, fixed: true },
        { r: 0, c: 1, type: GateType.SPLIT, rotation: 2, correctRotation: 0, fixed: false },
        { r: 0, c: 2, type: GateType.WIRE, rotation: 1, correctRotation: 0, fixed: false },
        { r: 0, c: 3, type: GateType.WIRE, rotation: 1, correctRotation: 0, fixed: false },
        { r: 0, c: 4, type: GateType.LED, rotation: 0, correctRotation: 0, fixed: true },

        { r: 1, c: 1, type: GateType.XOR, rotation: 1, correctRotation: 0, fixed: false },
        { r: 1, c: 2, type: GateType.WIRE, rotation: 1, correctRotation: 0, fixed: false },
        { r: 1, c: 3, type: GateType.WIRE, rotation: 1, correctRotation: 0, fixed: false },
        { r: 1, c: 4, type: GateType.LED, rotation: 0, correctRotation: 0, fixed: true },

        { r: 2, c: 0, type: GateType.SOURCE, rotation: 0, correctRotation: 0, fixed: true },
        { r: 2, c: 1, type: GateType.WIRE_CORNER, rotation: 3, correctRotation: 1, fixed: false },

        { r: 3, c: 0, type: GateType.SOURCE, rotation: 0, correctRotation: 0, fixed: true },
        { r: 3, c: 1, type: GateType.NOT, rotation: 3, correctRotation: 0, fixed: false },
        { r: 3, c: 2, type: GateType.WIRE, rotation: 1, correctRotation: 0, fixed: false },
        { r: 3, c: 3, type: GateType.WIRE, rotation: 1, correctRotation: 0, fixed: false },
        { r: 3, c: 4, type: GateType.LED, rotation: 0, correctRotation: 0, fixed: true },
      ]),
      sources: [
        { row: 0, col: 0, value: 1 },
        { row: 2, col: 0, value: 0 },
        { row: 3, col: 0, value: 0 },
      ],
      leds: [
        { row: 0, col: 4 },
        { row: 1, col: 4 },
        { row: 3, col: 4 },
      ],
    },

    // ==========================================
    // LEVEL 11: Mạch Bán Cộng (Half Adder)
    // ==========================================
    {
      id: 11,
      name: 'Màn 11: Mạch Bán Cộng',
      subtitle: 'Tính tổng (XOR) và nhớ (AND)',
      gridWidth: 4,
      gridHeight: 4,
      tutorialText: '🔬 Mạch bán cộng trong máy tính: Nhánh trên tính Tổng (XOR), nhánh dưới tính Nhớ (AND)!',
      timeLimit: 90,
      cells: createGrid(4, 4, [
        { r: 0, c: 0, type: GateType.SOURCE, rotation: 0, correctRotation: 0, fixed: true },
        { r: 0, c: 1, type: GateType.WIRE_CORNER, rotation: 2, correctRotation: 0, fixed: false },

        { r: 1, c: 1, type: GateType.XOR, rotation: 2, correctRotation: 0, fixed: false },
        { r: 1, c: 2, type: GateType.SPLIT, rotation: 1, correctRotation: 0, fixed: false },
        { r: 1, c: 3, type: GateType.LED, rotation: 0, correctRotation: 0, fixed: true },

        { r: 2, c: 0, type: GateType.SOURCE, rotation: 0, correctRotation: 0, fixed: true },
        { r: 2, c: 1, type: GateType.WIRE_CORNER, rotation: 3, correctRotation: 1, fixed: false },
        { r: 2, c: 2, type: GateType.AND, rotation: 1, correctRotation: 0, fixed: false },
        { r: 2, c: 3, type: GateType.LED, rotation: 0, correctRotation: 0, fixed: true },

        { r: 3, c: 0, type: GateType.SOURCE, rotation: 0, correctRotation: 0, fixed: true },
        { r: 3, c: 1, type: GateType.WIRE, rotation: 1, correctRotation: 0, fixed: false },
        { r: 3, c: 2, type: GateType.WIRE_CORNER, rotation: 0, correctRotation: 1, fixed: false },
      ]),
      sources: [
        { row: 0, col: 0, value: 1 },
        { row: 2, col: 0, value: 0 },
        { row: 3, col: 0, value: 1 },
      ],
      leds: [
        { row: 1, col: 3 },
        { row: 2, col: 3 },
      ],
    },

    // ==========================================
    // LEVEL 12: Đảo Nhánh Song Hành
    // ==========================================
    {
      id: 12,
      name: 'Màn 12: Đảo Song Hành',
      subtitle: 'Đảo ngược hai nhánh âm',
      gridWidth: 4,
      gridHeight: 4,
      tutorialText: '⚡ Cả hai nguồn đều là 0! Dùng 2 cổng NOT để biến đổi trước khi hội tụ vào cổng AND.',
      timeLimit: 90,
      cells: createGrid(4, 4, [
        { r: 0, c: 0, type: GateType.SOURCE, rotation: 0, correctRotation: 0, fixed: true },
        { r: 0, c: 1, type: GateType.NOT, rotation: 2, correctRotation: 0, fixed: false },
        { r: 0, c: 2, type: GateType.WIRE_CORNER, rotation: 1, correctRotation: 0, fixed: false },

        { r: 1, c: 2, type: GateType.AND, rotation: 3, correctRotation: 0, fixed: false },
        { r: 1, c: 3, type: GateType.LED, rotation: 0, correctRotation: 0, fixed: true },

        { r: 2, c: 0, type: GateType.SOURCE, rotation: 0, correctRotation: 0, fixed: true },
        { r: 2, c: 1, type: GateType.NOT, rotation: 1, correctRotation: 0, fixed: false },
        { r: 2, c: 2, type: GateType.WIRE_CORNER, rotation: 2, correctRotation: 1, fixed: false },
      ]),
      sources: [
        { row: 0, col: 0, value: 0 },
        { row: 2, col: 0, value: 0 },
      ],
      leds: [{ row: 1, col: 3 }],
    },

    // ==========================================
    // LEVEL 13: Kiểm Tra Tính Chẵn Lẻ (Parity)
    // ==========================================
    {
      id: 13,
      name: 'Màn 13: Kiểm Tra Chẵn Lẻ',
      subtitle: 'XOR hai tầng kiểm tra bit lẻ',
      gridWidth: 4,
      gridHeight: 4,
      tutorialText: '🎯 Cổng XOR ghép tầng kiểm tra số bit 1 là chẵn hay lẻ trong truyền tin viễn thông.',
      timeLimit: 95,
      cells: createGrid(4, 4, [
        { r: 0, c: 0, type: GateType.SOURCE, rotation: 0, correctRotation: 0, fixed: true },
        { r: 0, c: 1, type: GateType.WIRE_CORNER, rotation: 3, correctRotation: 0, fixed: false },

        { r: 1, c: 1, type: GateType.XOR, rotation: 2, correctRotation: 0, fixed: false },
        { r: 1, c: 2, type: GateType.WIRE_CORNER, rotation: 1, correctRotation: 0, fixed: false },

        { r: 2, c: 0, type: GateType.SOURCE, rotation: 0, correctRotation: 0, fixed: true },
        { r: 2, c: 1, type: GateType.WIRE_CORNER, rotation: 3, correctRotation: 1, fixed: false },
        { r: 2, c: 2, type: GateType.XOR, rotation: 1, correctRotation: 0, fixed: false },
        { r: 2, c: 3, type: GateType.LED, rotation: 0, correctRotation: 0, fixed: true },

        { r: 3, c: 0, type: GateType.SOURCE, rotation: 0, correctRotation: 0, fixed: true },
        { r: 3, c: 1, type: GateType.WIRE, rotation: 1, correctRotation: 0, fixed: false },
        { r: 3, c: 2, type: GateType.WIRE_CORNER, rotation: 0, correctRotation: 1, fixed: false },
      ]),
      sources: [
        { row: 0, col: 0, value: 1 },
        { row: 2, col: 0, value: 0 },
        { row: 3, col: 0, value: 0 },
      ],
      leds: [{ row: 2, col: 3 }],
    },

    // ==========================================
    // LEVEL 14: Bộ Chọn Kênh (Multiplexer 2-to-1)
    // ==========================================
    {
      id: 14,
      name: 'Màn 14: Bộ Chọn Kênh MUX',
      subtitle: 'Chọn dữ liệu bằng tín hiệu điều khiển',
      gridWidth: 5,
      gridHeight: 4,
      tutorialText: '📡 Dùng cổng NOT và 2 cổng AND để định tuyến tín hiệu đúng vào cổng OR cuối!',
      timeLimit: 100,
      cells: createGrid(4, 5, [
        { r: 0, c: 0, type: GateType.SOURCE, rotation: 0, correctRotation: 0, fixed: true },
        { r: 0, c: 1, type: GateType.WIRE, rotation: 1, correctRotation: 0, fixed: false },
        { r: 0, c: 2, type: GateType.WIRE_CORNER, rotation: 2, correctRotation: 0, fixed: false },

        { r: 1, c: 2, type: GateType.AND, rotation: 2, correctRotation: 0, fixed: false },
        { r: 1, c: 3, type: GateType.WIRE_CORNER, rotation: 1, correctRotation: 0, fixed: false },

        { r: 2, c: 0, type: GateType.SOURCE, rotation: 0, correctRotation: 0, fixed: true },
        { r: 2, c: 1, type: GateType.NOT, rotation: 1, correctRotation: 0, fixed: false },
        { r: 2, c: 2, type: GateType.WIRE_CORNER, rotation: 3, correctRotation: 1, fixed: false },
        { r: 2, c: 3, type: GateType.OR, rotation: 2, correctRotation: 0, fixed: false },
        { r: 2, c: 4, type: GateType.LED, rotation: 0, correctRotation: 0, fixed: true },

        { r: 3, c: 0, type: GateType.SOURCE, rotation: 0, correctRotation: 0, fixed: true },
        { r: 3, c: 1, type: GateType.WIRE, rotation: 1, correctRotation: 0, fixed: false },
        { r: 3, c: 2, type: GateType.WIRE, rotation: 1, correctRotation: 0, fixed: false },
        { r: 3, c: 3, type: GateType.WIRE_CORNER, rotation: 0, correctRotation: 1, fixed: false },
      ]),
      sources: [
        { row: 0, col: 0, value: 1 },
        { row: 2, col: 0, value: 0 },
        { row: 3, col: 0, value: 0 },
      ],
      leds: [{ row: 2, col: 4 }],
    },

    // ==========================================
    // LEVEL 15: Mạch Cầu Đa Hướng (Labyrinth)
    // ==========================================
    {
      id: 15,
      name: 'Màn 15: Mê Cung Mạch Cầu',
      subtitle: 'Đan xen các đường truyền',
      gridWidth: 5,
      gridHeight: 4,
      tutorialText: '🔄 Dòng điện đan xen giữa hai nhánh độc lập. Cần xoay khớp nối chuẩn để không chập mạch!',
      timeLimit: 105,
      cells: createGrid(4, 5, [
        { r: 0, c: 0, type: GateType.SOURCE, rotation: 0, correctRotation: 0, fixed: true },
        { r: 0, c: 1, type: GateType.NOT, rotation: 1, correctRotation: 0, fixed: false },
        { r: 0, c: 2, type: GateType.WIRE_CORNER, rotation: 3, correctRotation: 0, fixed: false },
        { r: 0, c: 3, type: GateType.WIRE_CORNER, rotation: 1, correctRotation: 3, fixed: false },
        { r: 0, c: 4, type: GateType.LED, rotation: 0, correctRotation: 0, fixed: true },

        { r: 1, c: 2, type: GateType.WIRE_CORNER, rotation: 0, correctRotation: 2, fixed: false },
        { r: 1, c: 3, type: GateType.WIRE_CORNER, rotation: 3, correctRotation: 1, fixed: false },

        { r: 3, c: 0, type: GateType.SOURCE, rotation: 0, correctRotation: 0, fixed: true },
        { r: 3, c: 1, type: GateType.WIRE, rotation: 1, correctRotation: 0, fixed: false },
        { r: 3, c: 2, type: GateType.WIRE, rotation: 1, correctRotation: 0, fixed: false },
        { r: 3, c: 3, type: GateType.WIRE, rotation: 1, correctRotation: 0, fixed: false },
        { r: 3, c: 4, type: GateType.LED, rotation: 0, correctRotation: 0, fixed: true },
      ]),
      sources: [
        { row: 0, col: 0, value: 0 },
        { row: 3, col: 0, value: 1 },
      ],
      leds: [
        { row: 0, col: 4 },
        { row: 3, col: 4 },
      ],
    },

    // ==========================================
    // LEVEL 16: Cổng NAND & NOR Ảo
    // ==========================================
    {
      id: 16,
      name: 'Màn 16: Cổng Phổ Quát',
      subtitle: 'AND và OR kết hợp cổng đảo',
      gridWidth: 5,
      gridHeight: 4,
      tutorialText: '⚡ Cổng NAND (AND + NOT) và NOR (OR + NOT) là hai cổng nền tảng cấu tạo chip hiện đại.',
      timeLimit: 105,
      cells: createGrid(4, 5, [
        { r: 0, c: 0, type: GateType.SOURCE, rotation: 0, correctRotation: 0, fixed: true },
        { r: 0, c: 1, type: GateType.WIRE_CORNER, rotation: 2, correctRotation: 0, fixed: false },

        { r: 1, c: 1, type: GateType.AND, rotation: 1, correctRotation: 0, fixed: false },
        { r: 1, c: 2, type: GateType.NOT, rotation: 3, correctRotation: 0, fixed: false },
        { r: 1, c: 3, type: GateType.WIRE, rotation: 1, correctRotation: 0, fixed: false },
        { r: 1, c: 4, type: GateType.LED, rotation: 0, correctRotation: 0, fixed: true },

        { r: 2, c: 0, type: GateType.SOURCE, rotation: 0, correctRotation: 0, fixed: true },
        { r: 2, c: 1, type: GateType.WIRE_CORNER, rotation: 3, correctRotation: 1, fixed: false },
      ]),
      sources: [
        { row: 0, col: 0, value: 1 },
        { row: 2, col: 0, value: 0 },
      ],
      leds: [{ row: 1, col: 4 }],
    },

    // ==========================================
    // LEVEL 17: Mạch Cộng Toàn Phần (Full Adder)
    // ==========================================
    {
      id: 17,
      name: 'Màn 17: Bộ Cộng Toàn Phần',
      subtitle: 'Xử lý 3 đầu vào đồng thời',
      gridWidth: 5,
      gridHeight: 5,
      tutorialText: '💻 3 đầu vào: Thắp sáng cả LED Tổng (Sum) và LED Nhớ (Carry)!',
      timeLimit: 120,
      cells: createGrid(5, 5, [
        { r: 0, c: 0, type: GateType.SOURCE, rotation: 0, correctRotation: 0, fixed: true },
        { r: 0, c: 1, type: GateType.WIRE_CORNER, rotation: 1, correctRotation: 0, fixed: false },

        { r: 1, c: 1, type: GateType.XOR, rotation: 3, correctRotation: 0, fixed: false },
        { r: 1, c: 2, type: GateType.WIRE, rotation: 1, correctRotation: 0, fixed: false },
        { r: 1, c: 3, type: GateType.WIRE, rotation: 1, correctRotation: 0, fixed: false },
        { r: 1, c: 4, type: GateType.LED, rotation: 0, correctRotation: 0, fixed: true },

        { r: 2, c: 0, type: GateType.SOURCE, rotation: 0, correctRotation: 0, fixed: true },
        { r: 2, c: 1, type: GateType.SPLIT, rotation: 0, correctRotation: 2, fixed: false },
        { r: 2, c: 2, type: GateType.NOT, rotation: 2, correctRotation: 0, fixed: false },
        { r: 2, c: 3, type: GateType.WIRE_CORNER, rotation: 1, correctRotation: 0, fixed: false },

        { r: 3, c: 3, type: GateType.AND, rotation: 2, correctRotation: 0, fixed: false },
        { r: 3, c: 4, type: GateType.LED, rotation: 0, correctRotation: 0, fixed: true },

        { r: 4, c: 0, type: GateType.SOURCE, rotation: 0, correctRotation: 0, fixed: true },
        { r: 4, c: 1, type: GateType.WIRE, rotation: 1, correctRotation: 0, fixed: false },
        { r: 4, c: 2, type: GateType.WIRE, rotation: 1, correctRotation: 0, fixed: false },
        { r: 4, c: 3, type: GateType.WIRE_CORNER, rotation: 3, correctRotation: 1, fixed: false },
      ]),
      sources: [
        { row: 0, col: 0, value: 1 },
        { row: 2, col: 0, value: 0 },
        { row: 4, col: 0, value: 1 },
      ],
      leds: [
        { row: 1, col: 4 },
        { row: 3, col: 4 },
      ],
    },

    // ==========================================
    // LEVEL 18: Bộ Giải Mã Nhị Phân (2-to-4 Decoder)
    // ==========================================
    {
      id: 18,
      name: 'Màn 18: Bộ Giải Mã',
      subtitle: 'Kích hoạt chân ra tương ứng',
      gridWidth: 5,
      gridHeight: 5,
      tutorialText: '🎛️ Giải mã tín hiệu nhị phân: Biến tổ hợp đầu vào thành tín hiệu sáng đúng 3 đèn LED.',
      timeLimit: 120,
      cells: createGrid(5, 5, [
        { r: 0, c: 0, type: GateType.SOURCE, rotation: 0, correctRotation: 0, fixed: true },
        { r: 0, c: 1, type: GateType.SPLIT, rotation: 2, correctRotation: 0, fixed: false },
        { r: 0, c: 2, type: GateType.WIRE, rotation: 1, correctRotation: 0, fixed: false },
        { r: 0, c: 3, type: GateType.WIRE, rotation: 1, correctRotation: 0, fixed: false },
        { r: 0, c: 4, type: GateType.LED, rotation: 0, correctRotation: 0, fixed: true },

        { r: 1, c: 1, type: GateType.AND, rotation: 2, correctRotation: 0, fixed: false },
        { r: 1, c: 2, type: GateType.WIRE, rotation: 1, correctRotation: 0, fixed: false },
        { r: 1, c: 3, type: GateType.WIRE, rotation: 1, correctRotation: 0, fixed: false },
        { r: 1, c: 4, type: GateType.LED, rotation: 0, correctRotation: 0, fixed: true },

        { r: 2, c: 0, type: GateType.SOURCE, rotation: 0, correctRotation: 0, fixed: true },
        { r: 2, c: 1, type: GateType.SPLIT, rotation: 0, correctRotation: 2, fixed: false },
        { r: 2, c: 2, type: GateType.WIRE_CORNER, rotation: 2, correctRotation: 0, fixed: false },

        { r: 3, c: 2, type: GateType.OR, rotation: 1, correctRotation: 0, fixed: false },
        { r: 3, c: 3, type: GateType.WIRE, rotation: 1, correctRotation: 0, fixed: false },
        { r: 3, c: 4, type: GateType.LED, rotation: 0, correctRotation: 0, fixed: true },

        { r: 4, c: 0, type: GateType.SOURCE, rotation: 0, correctRotation: 0, fixed: true },
        { r: 4, c: 1, type: GateType.NOT, rotation: 2, correctRotation: 0, fixed: false },
        { r: 4, c: 2, type: GateType.WIRE_CORNER, rotation: 3, correctRotation: 1, fixed: false },
      ]),
      sources: [
        { row: 0, col: 0, value: 1 },
        { row: 2, col: 0, value: 1 },
        { row: 4, col: 0, value: 0 },
      ],
      leds: [
        { row: 0, col: 4 },
        { row: 1, col: 4 },
        { row: 3, col: 4 },
      ],
    },

    // ==========================================
    // LEVEL 19: Lưới Ma Trận Logic
    // ==========================================
    {
      id: 19,
      name: 'Màn 19: Ma Trận Logic',
      subtitle: 'Thử thách 3 đèn LED phân tầng',
      gridWidth: 5,
      gridHeight: 5,
      tutorialText: '🧩 Ma trận 5x5 phức tạp: Xoay các cổng AND, NOT để thắp sáng toàn bộ 3 đèn LED!',
      timeLimit: 135,
      cells: createGrid(5, 5, [
        { r: 0, c: 0, type: GateType.SOURCE, rotation: 0, correctRotation: 0, fixed: true },
        { r: 0, c: 1, type: GateType.SPLIT, rotation: 2, correctRotation: 0, fixed: false },
        { r: 0, c: 2, type: GateType.WIRE, rotation: 1, correctRotation: 0, fixed: false },
        { r: 0, c: 3, type: GateType.WIRE, rotation: 1, correctRotation: 0, fixed: false },
        { r: 0, c: 4, type: GateType.LED, rotation: 0, correctRotation: 0, fixed: true },

        { r: 1, c: 1, type: GateType.AND, rotation: 1, correctRotation: 0, fixed: false },
        { r: 1, c: 2, type: GateType.WIRE, rotation: 1, correctRotation: 0, fixed: false },
        { r: 1, c: 3, type: GateType.WIRE, rotation: 1, correctRotation: 0, fixed: false },
        { r: 1, c: 4, type: GateType.LED, rotation: 0, correctRotation: 0, fixed: true },

        { r: 2, c: 0, type: GateType.SOURCE, rotation: 0, correctRotation: 0, fixed: true },
        { r: 2, c: 1, type: GateType.WIRE_CORNER, rotation: 3, correctRotation: 1, fixed: false },

        { r: 4, c: 0, type: GateType.SOURCE, rotation: 0, correctRotation: 0, fixed: true },
        { r: 4, c: 1, type: GateType.NOT, rotation: 2, correctRotation: 0, fixed: false },
        { r: 4, c: 2, type: GateType.WIRE, rotation: 1, correctRotation: 0, fixed: false },
        { r: 4, c: 3, type: GateType.WIRE, rotation: 1, correctRotation: 0, fixed: false },
        { r: 4, c: 4, type: GateType.LED, rotation: 0, correctRotation: 0, fixed: true },
      ]),
      sources: [
        { row: 0, col: 0, value: 1 },
        { row: 2, col: 0, value: 1 },
        { row: 4, col: 0, value: 0 },
      ],
      leds: [
        { row: 0, col: 4 },
        { row: 1, col: 4 },
        { row: 4, col: 4 },
      ],
    },

    // ==========================================
    // LEVEL 20: Siêu Vi Xử Lý (Cyber CPU Core)
    // ==========================================
    {
      id: 20,
      name: 'Màn 20: Cyber CPU Core',
      subtitle: 'Màn chung kết: Trái tim siêu máy tính',
      gridWidth: 5,
      gridHeight: 5,
      tutorialText: '👑 MÀN ĐỈNH CAO: Tích hợp đầy đủ AND, OR, XOR, NOT, SPLIT để hoàn thành cỗ máy logic hoàn hảo!',
      timeLimit: 150,
      cells: createGrid(5, 5, [
        { r: 0, c: 0, type: GateType.SOURCE, rotation: 0, correctRotation: 0, fixed: true },
        { r: 0, c: 1, type: GateType.SPLIT, rotation: 1, correctRotation: 0, fixed: false },
        { r: 0, c: 2, type: GateType.WIRE, rotation: 1, correctRotation: 0, fixed: false },
        { r: 0, c: 3, type: GateType.WIRE, rotation: 1, correctRotation: 0, fixed: false },
        { r: 0, c: 4, type: GateType.LED, rotation: 0, correctRotation: 0, fixed: true },

        { r: 1, c: 1, type: GateType.XOR, rotation: 2, correctRotation: 0, fixed: false },
        { r: 1, c: 2, type: GateType.WIRE, rotation: 1, correctRotation: 0, fixed: false },
        { r: 1, c: 3, type: GateType.WIRE, rotation: 1, correctRotation: 0, fixed: false },
        { r: 1, c: 4, type: GateType.LED, rotation: 0, correctRotation: 0, fixed: true },

        { r: 2, c: 0, type: GateType.SOURCE, rotation: 0, correctRotation: 0, fixed: true },
        { r: 2, c: 1, type: GateType.SPLIT, rotation: 0, correctRotation: 2, fixed: false },
        { r: 2, c: 2, type: GateType.NOT, rotation: 3, correctRotation: 0, fixed: false },
        { r: 2, c: 3, type: GateType.WIRE, rotation: 1, correctRotation: 0, fixed: false },
        { r: 2, c: 4, type: GateType.LED, rotation: 0, correctRotation: 0, fixed: true },

        { r: 3, c: 0, type: GateType.SOURCE, rotation: 0, correctRotation: 0, fixed: true },
        { r: 3, c: 1, type: GateType.WIRE_CORNER, rotation: 2, correctRotation: 0, fixed: false },
        { r: 3, c: 2, type: GateType.OR, rotation: 1, correctRotation: 0, fixed: false },
        { r: 3, c: 3, type: GateType.WIRE, rotation: 1, correctRotation: 0, fixed: false },
        { r: 3, c: 4, type: GateType.LED, rotation: 0, correctRotation: 0, fixed: true },

        { r: 4, c: 1, type: GateType.WIRE_CORNER, rotation: 0, correctRotation: 2, fixed: false },
        { r: 4, c: 2, type: GateType.WIRE_CORNER, rotation: 3, correctRotation: 1, fixed: false },
      ]),
      sources: [
        { row: 0, col: 0, value: 1 },
        { row: 2, col: 0, value: 0 },
        { row: 3, col: 0, value: 1 },
      ],
      leds: [
        { row: 0, col: 4 },
        { row: 1, col: 4 },
        { row: 2, col: 4 },
        { row: 3, col: 4 },
      ],
    },
  ];
}

/**
 * Grid initialization helper.
 */
function createGrid(
  rows: number,
  cols: number,
  placements: {
    r: number;
    c: number;
    type: GateType;
    rotation: number;
    correctRotation: number;
    fixed: boolean;
  }[]
): (GateDefinition | null)[][] {
  const grid: (GateDefinition | null)[][] = [];

  for (let r = 0; r < rows; r++) {
    grid[r] = [];
    for (let c = 0; c < cols; c++) {
      grid[r][c] = null;
    }
  }

  for (const p of placements) {
    grid[p.r][p.c] = {
      type: p.type,
      rotation: p.rotation,
      correctRotation: p.correctRotation,
      fixed: p.fixed,
      ports: getDefaultPorts(p.type),
    };
  }

  return grid;
}
