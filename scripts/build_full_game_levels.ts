import * as fs from 'fs';
import { GateType, Direction, GateDefinition, LevelDefinition, TestCase } from '../src/utils/Constants';
import { getDefaultPorts } from '../src/logic/GateTypes';
import { SignalEngine } from '../src/logic/SignalEngine';
import {
  PlacementDef,
  createGrid,
  testLevelSolvability,
  buildSingleGateLevel,
  buildCrossoverHighwayLevel,
  buildCascadeTreeLevel,
  buildSplitDistributionLevel,
  buildCrossSplitter4Level,
  buildControlledInverterLevel,
} from './build_full_100_levels';
import { buildDynamicClockedTreeLevel } from './test_dynamic_tree';

// Read existing handcrafted levels 1-15
const oldContent = fs.readFileSync('src/logic/LevelGenerator.ts', 'utf8');
const lines = oldContent.split('\n');
const lvl1Start = lines.findIndex(l => l.includes('id: 1,'));
const lvl16Start = lines.findIndex(l => l.includes('id: 16,'));
const levels1to15Raw = lines.slice(lvl1Start - 1, lvl16Start - 1).join('\n');

console.log('Handcrafted levels 1-15 loaded.');

export function generateAllLevels(): LevelDefinition[] {
  const levels: LevelDefinition[] = [];

  // ========================================================
  // CHAPTER 2: Cổng Đảo, Cầu Vượt & Dòng Chảy Đan Xen (16 - 35)
  // ========================================================
  // 16: NAND Intro (5x4)
  levels.push(buildSingleGateLevel(
    16, 2, "Màn 16: Cổng Đảo NAND", "Ngược lại hoàn toàn với AND",
    "⚡ Cổng NAND (○ ở đầu ra) xuất mức 1 khi có ít nhất một đầu vào là 0. Hãy xoay cổng để thắp sáng đèn!",
    GateType.NAND, 1, 0, 1
  ));

  // 17: NOR Intro (5x4)
  levels.push(buildSingleGateLevel(
    17, 2, "Màn 17: Cổng Đảo NOR", "Chỉ xuất 1 khi cả hai đầu vào đều là 0",
    "⚡ Cổng NOR: Đầu vào (0, 0) sẽ xuất ra 1! Hãy xoay cổng hướng về đèn LED.",
    GateType.NOR, 0, 0, 1
  ));

  // 18: XNOR & Diode (5x4)
  levels.push(buildSingleGateLevel(
    18, 2, "Màn 18: Cổng XNOR & Diode", "Bộ so sánh bằng & Van 1 chiều",
    "⚡ Cổng XNOR xuất 1 khi hai đầu vào GIỐNG NHAU (1-1 hoặc 0-0). Diode (▷|) chỉ cho phép điện đi 1 chiều.",
    GateType.XNOR, 1, 1, 1, { type: GateType.DIODE, col: 2 }
  ));

  // 19: Cầu Vượt Cáp Đầu Tiên (CROSSOVER) (6x6)
  levels.push(buildCrossoverHighwayLevel(
    19, 2, "Màn 19: Cầu Vượt Cáp", "Giao lộ hai làn không chập mạch",
    "🌉 CẦU VƯỢT CÁP: Cho phép 2 dòng điện ngang và dọc đi xuyên qua nhau mà không bị chập! Xoay các khớp để dẫn cả 2 đèn sáng.",
    { W: 6, H: 6, rh: 2, cc: 2, sh: 1, sv: 1, gateH: GateType.WIRE, gateV: GateType.WIRE, targetH: 1, targetV: 1 }
  ));

  // 20: Cây Ghép 2 Tầng (Tree Cascade) (6x6)
  levels.push(buildCascadeTreeLevel(
    20, 2, "Màn 20: Cây Ghép 2 Tầng", "AND & OR hội tụ về NAND",
    "🌳 CÂY GHÉP 2 TẦNG: Tầng 1 gồm 2 cổng AND & OR xử lý 4 nguồn điện, rồi hội tụ vào cổng NAND ở tầng 2!",
    { W: 6, H: 6, g1: GateType.AND, g2: GateType.OR, g3: GateType.NAND, s: [1, 1, 0, 0], targetSignal: 1 }
  ));

  // 21: Cầu Vượt & Cổng Đảo Song Song (6x6)
  levels.push(buildCrossoverHighwayLevel(
    21, 2, "Màn 21: Cầu Vượt & Cổng Đảo", "NAND ngang và NOR dọc",
    "⚡ Hai đường truyền tín hiệu đan xen qua cầu vượt: Nhánh ngang qua cổng NOT, nhánh dọc qua cổng DIODE.",
    { W: 6, H: 6, rh: 2, cc: 3, sh: 0, sv: 1, gateH: GateType.NOT, gateV: GateType.DIODE, targetH: 1, targetV: 1 }
  ));

  // 22: Cây Ghép: Cổng NOR Kết Thúc (6x6)
  levels.push(buildCascadeTreeLevel(
    22, 2, "Màn 22: Phân Tầng NOR", "XOR & AND hội tụ về NOR",
    "💡 Hai cổng tầng 1 phải tạo ra hai số 0 để cổng NOR ở tầng 2 thắp sáng đèn LED!",
    { W: 6, H: 6, g1: GateType.XOR, g2: GateType.AND, g3: GateType.NOR, s: [1, 1, 1, 0], targetSignal: 1 }
  ));

  // 23: Phân Nhánh T-Split Đôi (6x5)
  levels.push(buildSplitDistributionLevel(
    23, 2, "Màn 23: Phân Nhánh Song Tuyến", "Một nguồn cấp 2 nhánh",
    "🔱 Bộ phân nhánh (T) chia đôi nguồn điện 1: Nhánh trên dẫn qua cổng NOT (thành 0), nhánh dưới qua DIODE.",
    { W: 6, H: 5, g1: GateType.NOT, g2: GateType.DIODE, s1: 1, target1: 0, target2: 1 }
  ));

  // 24: Cầu Vượt Giao Thoa Chữ X (6x6)
  levels.push(buildCrossoverHighwayLevel(
    24, 2, "Màn 24: Cầu Vượt Chữ X", "Giao điểm tín hiệu 1 và 0",
    "🌉 Nhánh ngang mang điện 1, nhánh dọc mang điện 0 đi qua cổng NOT để đạt mức 1 ở ngõ ra.",
    { W: 6, H: 6, rh: 3, cc: 2, sh: 1, sv: 0, gateH: GateType.DIODE, gateV: GateType.NOT, targetH: 1, targetV: 1 }
  ));

  // 25: Cây Ghép XNOR Cấp 2 (6x6)
  levels.push(buildCascadeTreeLevel(
    25, 2, "Màn 25: Cây Ghép XNOR", "Hội tụ điều kiện tương đồng",
    "⚡ Tầng 1 gồm NAND & OR, ngõ ra đưa vào XNOR. Đèn chỉ sáng khi cả 2 nhánh tầng 1 cho kết quả giống nhau!",
    { W: 6, H: 6, g1: GateType.NAND, g2: GateType.OR, g3: GateType.XNOR, s: [1, 0, 1, 0], targetSignal: 1 }
  ));

  // 26: Cầu Vượt & Cổng Đảo NAND (6x6)
  levels.push(buildCrossoverHighwayLevel(
    26, 2, "Màn 26: Cầu Vượt & NAND Kép", "Điều hướng xung điện không chập",
    "⚡ Đường dọc mang điện 1 đi qua DIODE, đường ngang mang điện 0 đi qua NOT.",
    { W: 6, H: 6, rh: 1, cc: 3, sh: 0, sv: 1, gateH: GateType.NOT, gateV: GateType.DIODE, targetH: 1, targetV: 1 }
  ));

  // 27: Cây Ghép Đảo Kép (6x6)
  levels.push(buildCascadeTreeLevel(
    27, 2, "Màn 27: Đảo Kép De Morgan", "NAND & NOR kết hợp AND",
    "💡 Phối hợp các cổng đảo: Hãy tính toán sao cho ngõ ra của NAND và NOR đều bằng 1 để kích hoạt cổng AND!",
    { W: 6, H: 6, g1: GateType.NAND, g2: GateType.NOR, g3: GateType.AND, s: [0, 1, 0, 0], targetSignal: 1 }
  ));

  // 28: Phân Nhánh Kép 6x5
  levels.push(buildSplitDistributionLevel(
    28, 2, "Màn 28: Phân Tách Lưỡng Cực", "Tách dòng điện đến 2 đèn",
    "🔱 Một nguồn điện 0 phân đôi: Nhánh trên qua cổng NOT thắp sáng Đèn Xanh [1], nhánh dưới giữ nguyên mức [0]!",
    { W: 6, H: 5, g1: GateType.NOT, g2: GateType.WIRE, s1: 0, target1: 1, target2: 0 }
  ));

  // 29: Cầu Vượt Lệch Trục (6x6)
  levels.push(buildCrossoverHighwayLevel(
    29, 2, "Màn 29: Cầu Vượt Lệch Trục", "Đường truyền phi đối xứng",
    "🌉 Cầu vượt nằm lệch ở cột 3. Hãy căn chỉnh các khớp nối cong để dòng điện xuôi chiều.",
    { W: 6, H: 6, rh: 3, cc: 3, sh: 1, sv: 0, gateH: GateType.WIRE, gateV: GateType.NOT, targetH: 1, targetV: 1 }
  ));

  // 30: Cây Ghép 2 Tầng Cỡ Lớn (7x7)
  levels.push(buildCascadeTreeLevel(
    30, 2, "Màn 30: Đại Cây Logic 7x7", "Mạng lưới phân nhánh rộng",
    "🌳 Ma trận 7x7 mở rộng: Hãy phân tích kỹ luồng điện từ 4 nguồn và nối thông toàn bộ 2 tầng mạch.",
    { W: 7, H: 6, g1: GateType.OR, g2: GateType.AND, g3: GateType.XNOR, s: [1, 0, 1, 1], targetSignal: 1 }
  ));

  // 31: Phân Nhánh Cổng Đảo (6x5)
  levels.push(buildSplitDistributionLevel(
    31, 2, "Màn 31: Nhánh Rẽ Nghịch Cực", "Nguồn 1 điều khiển 2 trạng thái",
    "💡 Nguồn 1 phân nhánh: Nhánh trên giữ 1 qua DIODE, nhánh dưới đảo thành 0 qua NOT để đáp ứng đúng mục tiêu!",
    { W: 6, H: 5, g1: GateType.DIODE, g2: GateType.NOT, s1: 1, target1: 1, target2: 0 }
  ));

  // 32: Cầu Vượt & Cổng Diode Kép (6x6)
  levels.push(buildCrossoverHighwayLevel(
    32, 2, "Màn 32: Cầu Vượt & Diode Kép", "Van chống ngược bảo vệ cả 2 tuyến",
    "⚡ Hai van một chiều DIODE lắp ở cả 2 nhánh sau cầu vượt để bảo vệ mạch điện.",
    { W: 6, H: 6, rh: 2, cc: 2, sh: 1, sv: 1, gateH: GateType.DIODE, gateV: GateType.DIODE, targetH: 1, targetV: 1 }
  ));

  // 33: Cây Ghép: Cổng XOR Kết Thúc (6x6)
  levels.push(buildCascadeTreeLevel(
    33, 2, "Màn 33: Xung Đột Bất Đối Xứng", "NAND & OR hội tụ vào XOR",
    "⚡ Đèn LED nối vào cổng XOR chỉ sáng khi hai nhánh tầng 1 cho ra 2 mức logic KHÁC NHAU (0 và 1)!",
    { W: 6, H: 6, g1: GateType.NAND, g2: GateType.OR, g3: GateType.XOR, s: [1, 1, 1, 0], targetSignal: 1 }
  ));

  // 34: Cầu Vượt Cao Tốc 7x7
  levels.push(buildCrossoverHighwayLevel(
    34, 2, "Màn 34: Xa Lộ Cắt Ngang 7x7", "Khoảng cách truyền dài",
    "🌉 Ma trận 7x7 với xa lộ tín hiệu dài. Cần xoay tối ưu các khúc cua và dây dẫn thẳng.",
    { W: 7, H: 6, rh: 2, cc: 3, sh: 0, sv: 1, gateH: GateType.NOT, gateV: GateType.DIODE, targetH: 1, targetV: 1 }
  ));

  // 35: Boss Chương 2: Siêu Cây Logic (7x7)
  levels.push(buildCascadeTreeLevel(
    35, 2, "Màn 35: Trùm Chương 2 - Siêu Cây Logic", "Đỉnh cao phân tích mạch ghép",
    "👑 TRÙM CHƯƠNG 2: Mạch ghép 2 tầng kết hợp cổng XNOR và Diode bảo vệ. Hoàn thành để mở khóa Chương 3!",
    { W: 7, H: 6, g1: GateType.XNOR, g2: GateType.NAND, g3: GateType.AND, s: [1, 1, 0, 1], targetSignal: 1, postGate: GateType.DIODE }
  ));

  // ========================================================
  // CHAPTER 3: Ô Khóa Kim Loại & Đa Mục Tiêu [0] & [1] (36 - 60)
  // ========================================================
  // 36: Khóa Kim Loại Đầu Tiên (6x6)
  levels.push(buildCrossoverHighwayLevel(
    36, 3, "Màn 36: Khung Thép Bất Động", "Ô khóa cố định không thể xoay",
    "🔒 Ô KHÓA CỐ ĐỊNH: Chiếc cầu vượt ở giữa đã bị khóa cứng bằng khung thép tán đinh! Bạn không thể xoay ô này mà phải xoay các dây xung quanh cho khớp.",
    { W: 6, H: 6, rh: 2, cc: 2, sh: 1, sv: 1, gateH: GateType.WIRE, gateV: GateType.WIRE, targetH: 1, targetV: 1, lockedCross: true }
  ));

  // 37: Mục Tiêu Đèn Đỏ [0] (6x5)
  levels.push(buildSplitDistributionLevel(
    37, 3, "Màn 37: Mục Tiêu Mức [0]", "Đèn xanh lam đòi hỏi mức 0",
    "🎯 ĐÈN MỤC TIÊU [0]: Đèn LED màu xanh lam (TARGET: 0) BẮT BUỘC phải nhận tín hiệu 0! Nếu đưa 1 vào sẽ thất bại.",
    { W: 6, H: 5, g1: GateType.NOT, g2: GateType.DIODE, s1: 1, target1: 0, target2: 1 }
  ));

  // 38: Âm Dương Đối Cực (6x5)
  levels.push(buildSplitDistributionLevel(
    38, 3, "Màn 38: Âm Dương Đối Cực", "Đồng thời sáng cả đèn [1] và [0]",
    "💡 Mạch phải đồng thời cấp mức 1 cho Đèn Xanh Lá và mức 0 cho Đèn Xanh Lam từ một nguồn điện duy nhất!",
    { W: 6, H: 5, g1: GateType.WIRE, g2: GateType.NOT, s1: 1, target1: 1, target2: 0 }
  ));

  // 39: Bộ Chia 4 Ngả (SPLIT_4) (7x7)
  levels.push(buildCrossSplitter4Level(
    39, 3, "Màn 39: Bộ Chia 4 Ngả (SPLIT_4)", "Phân phối 1 nguồn ra 3 hướng",
    "🔱 BỘ CHIA 4 NGẢ: Dẫn 1 nguồn điện từ bên trái và phát đồng thời ra 3 nhánh Trên, Phải, Dưới để nuôi 3 đèn LED!",
    { sVal: 1, gUp: GateType.WIRE, gRight: GateType.WIRE, gDown: GateType.WIRE, targetUp: 1, targetRight: 1, targetDown: 1 }
  ));

  // 40: Cây Ghép Thép (Locked Cascade) (6x6)
  levels.push(buildCascadeTreeLevel(
    40, 3, "Màn 40: Cây Ghép Thép", "Cổng logic trung tâm bị khóa cứng",
    "🔒 Cổng logic ở tầng 2 đã bị khóa cứng với hướng xoay cố định. Hãy điều chỉnh 2 cổng tầng 1 cho khớp!",
    { W: 6, H: 6, g1: GateType.OR, g2: GateType.AND, g3: GateType.NAND, s: [0, 1, 1, 1], targetSignal: 0, lockedAnchor: true }
  ));

  // 41: Chia 4 Ngả Đa Cực [1], [0], [1] (7x7)
  levels.push(buildCrossSplitter4Level(
    41, 3, "Màn 41: Tam Phân Đa Cực", "1 Nguồn nuôi 3 đèn với 2 mức logic",
    "🎯 Bộ chia 4 ngả cấp điện cho 3 đèn: Đèn trên đòi hỏi 0 (qua cổng NOT), 2 đèn còn lại đòi hỏi 1!",
    { sVal: 1, gUp: GateType.NOT, gRight: GateType.DIODE, gDown: GateType.WIRE, targetUp: 0, targetRight: 1, targetDown: 1 }
  ));

  // 42: Cầu Vượt Thép & Đèn Đảo Cực (6x6)
  levels.push(buildCrossoverHighwayLevel(
    42, 3, "Màn 42: Cầu Vượt Thép & Đèn [0]", "Phối hợp ô khóa và mục tiêu mức 0",
    "🔒 Cầu vượt khóa cố định. Nhánh ngang nuôi đèn [0] (qua cổng NOT), nhánh dọc nuôi đèn [1].",
    { W: 6, H: 6, rh: 2, cc: 2, sh: 1, sv: 1, gateH: GateType.NOT, gateV: GateType.WIRE, targetH: 0, targetV: 1, lockedCross: true }
  ));

  // 43: Cây Ghép 2 Tầng Mục Tiêu [0] (6x6)
  levels.push(buildCascadeTreeLevel(
    43, 3, "Màn 43: Cây Ghép Dập Tắt", "Hội tụ về mức 0 chuẩn xác",
    "🎯 Đèn LED đầu ra yêu cầu mức [0]. Hãy tính toán các cổng logic sao cho ngõ ra cuối cùng là 0!",
    { W: 6, H: 6, g1: GateType.AND, g2: GateType.OR, g3: GateType.AND, s: [1, 0, 1, 1], targetSignal: 0 }
  ));

  // 44: Phân Nhánh Khóa Cố Định (6x5)
  levels.push(buildSplitDistributionLevel(
    44, 3, "Màn 44: Khớp Phân Nhánh Thép", "Bộ chia T bị khóa cứng",
    "🔒 Khớp chia nhánh T bị khóa cố định hướng chia Lên & Xuống. Hãy căn chỉnh dây nối vào và ra cho chuẩn xác.",
    { W: 6, H: 5, g1: GateType.DIODE, g2: GateType.WIRE, s1: 1, target1: 1, target2: 1, lockedSplit: true }
  ));

  // 45: Cầu Vượt Lệch Khóa Thép (7x7)
  levels.push(buildCrossoverHighwayLevel(
    45, 3, "Màn 45: Giao Lộ Thép 7x7", "Cầu vượt khóa tại tọa độ (2, 3)",
    "🌉 Ma trận 7x7 với cầu vượt cố định. Cần định tuyến các khúc quanh chính xác.",
    { W: 7, H: 6, rh: 2, cc: 3, sh: 1, sv: 0, gateH: GateType.DIODE, gateV: GateType.NOT, targetH: 1, targetV: 1, lockedCross: true }
  ));

  // 46: Chia 4 Ngả: Hai Đèn Mức [0] (7x7)
  levels.push(buildCrossSplitter4Level(
    46, 3, "Màn 46: Tam Phân Song Âm", "Hai đèn [0] và một đèn [1]",
    "🎯 Nguồn điện 1 phân ra 3 nhánh: 2 nhánh qua cổng NOT để cấp cho 2 đèn [0], 1 nhánh qua DIODE cấp cho đèn [1].",
    { sVal: 1, gUp: GateType.NOT, gRight: GateType.DIODE, gDown: GateType.NOT, targetUp: 0, targetRight: 1, targetDown: 0 }
  ));

  // 47: Cây Ghép Khóa Thép 7x7
  levels.push(buildCascadeTreeLevel(
    47, 3, "Màn 47: Cây Ghép Thép 7x7", "Mạng logic sâu có chốt chặn",
    "🔒 Cổng logic tầng 2 bị khóa cố định. Phân tích luồng điện từ 4 nguồn để kích hoạt đèn LED.",
    { W: 7, H: 6, g1: GateType.NAND, g2: GateType.NOR, g3: GateType.OR, s: [1, 1, 0, 0], targetSignal: 1, lockedAnchor: true }
  ));

  // 48: Cầu Vượt Đôi Song Hành (7x7)
  levels.push(buildCrossoverHighwayLevel(
    48, 3, "Màn 48: Cầu Vượt & Cột Trụ Thép", "Chướng ngại vật cố định trong lưới",
    "🔒 Bản mạch có chướng ngại vật kim loại cố định bên cạnh cầu vượt. Hãy uốn dây khéo léo để né chập mạch.",
    {
      W: 7, H: 6, rh: 2, cc: 3, sh: 1, sv: 1, gateH: GateType.WIRE, gateV: GateType.WIRE, targetH: 1, targetV: 1,
      lockedAnchor: { r: 1, c: 1, type: GateType.WIRE, rot: 1 }
    }
  ));

  // 49: Phân Nhánh Thép Đa Mục Tiêu (6x5)
  levels.push(buildSplitDistributionLevel(
    49, 3, "Màn 49: Phân Nhánh Thép Lưỡng Cực", "Bộ chia khóa cấp cho 2 cực",
    "🔒 Bộ chia nhánh khóa cứng chia 1 nguồn cấp cho Đèn [1] và Đèn [0].",
    { W: 6, H: 5, g1: GateType.WIRE, g2: GateType.NOT, s1: 1, target1: 1, target2: 0, lockedSplit: true }
  ));

  // 50: Cây Ghép Đa Cực [0] (6x6)
  levels.push(buildCascadeTreeLevel(
    50, 3, "Màn 50: Cây Ghép Dập Mạch", "Mục tiêu [0] từ 4 nguồn điện",
    "🎯 4 Nguồn điện qua 2 tầng logic nhưng phải dập tắt về đúng mức [0] ở ngõ ra!",
    { W: 6, H: 6, g1: GateType.OR, g2: GateType.AND, g3: GateType.NOR, s: [1, 0, 1, 1], targetSignal: 0 }
  ));

  // 51: Chia 4 Ngả Thép Toàn Phần (7x7)
  levels.push(buildCrossSplitter4Level(
    51, 3, "Màn 51: Bộ Chia 4 Ngả Thép", "Hub phân phối bị khóa cứng",
    "🔒 Bộ chia 4 ngả ở tâm lưới bị cố định hoàn toàn. Xoay các dây xung quanh để cấp điện cho 3 đèn.",
    { sVal: 1, gUp: GateType.WIRE, gRight: GateType.DIODE, gDown: GateType.WIRE, targetUp: 1, targetRight: 1, targetDown: 1, lockedSplitter: true }
  ));

  // 52: Cầu Vượt Thép & Đèn [0] Lệch
  levels.push(buildCrossoverHighwayLevel(
    52, 3, "Màn 52: Giao Điểm Nghịch Cực", "Hai đèn mục tiêu đối lập qua cầu vượt",
    "🎯 Cầu vượt khóa cứng: Đèn ngang cần mức [1], đèn dọc cần mức [0] (qua cổng NOT).",
    { W: 6, H: 6, rh: 2, cc: 2, sh: 1, sv: 1, gateH: GateType.WIRE, gateV: GateType.NOT, targetH: 1, targetV: 0, lockedCross: true }
  ));

  // 53: Cây Ghép 2 Tầng Khóa Cổng 1 (6x6)
  levels.push(buildCascadeTreeLevel(
    53, 3, "Màn 53: Khung Thép Tầng 1", "Cổng tầng 1 bị khóa cứng",
    "🔒 Cổng logic ở tầng 1 bị khóa. Người chơi phải điều chỉnh cổng còn lại để thỏa mãn cổng NAND tầng 2.",
    { W: 6, H: 6, g1: GateType.AND, g2: GateType.OR, g3: GateType.NAND, s: [1, 1, 0, 1], targetSignal: 0, lockedAnchor: true }
  ));

  // 54: Chia 4 Ngả Ba Cực Nghịch (7x7)
  levels.push(buildCrossSplitter4Level(
    54, 3, "Màn 54: Tam Phân Toàn Âm", "Đồng thời dập tắt 2 đèn về [0]",
    "🎯 Cả hai đèn nhánh Trên và Dưới đều đòi hỏi mức [0]! Hãy xoay 2 cổng NOT để đảo xung điện.",
    { sVal: 1, gUp: GateType.NOT, gRight: GateType.WIRE, gDown: GateType.NOT, targetUp: 0, targetRight: 1, targetDown: 0, lockedSplitter: true }
  ));

  // 55: Cầu Vượt Thép 7x7 Hai Diode
  levels.push(buildCrossoverHighwayLevel(
    55, 3, "Màn 55: Xa Lộ Diode Thép", "Hai diode khóa chiều qua cầu vượt",
    "⚡ Hai van 1 chiều DIODE bảo vệ hai ngõ ra sau cầu vượt thép khóa cứng.",
    { W: 7, H: 6, rh: 2, cc: 3, sh: 1, sv: 1, gateH: GateType.DIODE, gateV: GateType.DIODE, targetH: 1, targetV: 1, lockedCross: true }
  ));

  // 56: Cây Ghép Thép Siêu Cấp 7x7
  levels.push(buildCascadeTreeLevel(
    56, 3, "Màn 56: Siêu Cây Thép 7x7", "Mạng 4 nguồn với cổng XNOR khóa",
    "🔒 Cổng XNOR tầng 2 bị khóa cố định. Tính toán 2 nhánh tầng 1 để tạo 2 tín hiệu đồng nhất!",
    { W: 7, H: 6, g1: GateType.NAND, g2: GateType.NOR, g3: GateType.XNOR, s: [1, 0, 0, 0], targetSignal: 1, lockedAnchor: true }
  ));

  // 57: Phân Nhánh Thép Kép
  levels.push(buildSplitDistributionLevel(
    57, 3, "Màn 57: Phân Nhánh Thép Kép", "Nguồn 0 nuôi Đèn [1] và Đèn [0]",
    "💡 Nguồn 0: Nhánh 1 qua NOT thành 1, nhánh 2 giữ nguyên 0 để nuôi cả 2 đèn!",
    { W: 6, H: 5, g1: GateType.NOT, g2: GateType.WIRE, s1: 0, target1: 1, target2: 0, lockedSplit: true }
  ));

  // 58: Cầu Vượt Thép Kép Labyrinth (7x7)
  levels.push(buildCrossoverHighwayLevel(
    58, 3, "Màn 58: Mê Cung Giao Lộ 7x7", "Cầu vượt khóa tại tâm lưới 7x7",
    "🌉 Ma trận rộng với cầu vượt khóa cứng. Đường truyền kéo dài qua nhiều khúc ngoặt.",
    { W: 7, H: 7, rh: 3, cc: 3, sh: 1, sv: 0, gateH: GateType.WIRE, gateV: GateType.NOT, targetH: 1, targetV: 1, lockedCross: true }
  ));

  // 59: Cây Ghép Đa Cực [0] Thép (7x7)
  levels.push(buildCascadeTreeLevel(
    59, 3, "Màn 59: Cây Ghép Thép Mức [0]", "Triệt tiêu tín hiệu qua cổng khóa",
    "🎯 Đèn LED yêu cầu mức [0]. Cổng logic tầng 2 bị khóa cứng đòi hỏi phân tích ngược chính xác.",
    { W: 7, H: 6, g1: GateType.OR, g2: GateType.AND, g3: GateType.AND, s: [0, 0, 1, 1], targetSignal: 0, lockedAnchor: true }
  ));

  // 60: Boss Chương 3: Pháo Đài Kim Loại (7x7)
  levels.push(buildCrossSplitter4Level(
    60, 3, "Màn 60: Trùm Chương 3 - Pháo Đài Kim Loại", "Đỉnh cao ô khóa và đa mục tiêu",
    "👑 TRÙM CHƯƠNG 3: Hub phân phối 4 ngả bằng thép cùng 2 cổng NOT và 1 DIODE nuôi đồng thời 3 đèn với 2 cực khác nhau!",
    { sVal: 1, gUp: GateType.NOT, gRight: GateType.DIODE, gDown: GateType.NOT, targetUp: 0, targetRight: 1, targetDown: 0, lockedSplitter: true }
  ));

  // ========================================================
  // CHAPTER 4: Bảng Chân Trị Động & Xung Nhịp Clock (61 - 85)
  // ========================================================
  // 61: Xung Nhịp Khởi Đầu (5x4)
  levels.push(buildControlledInverterLevel(
    61, 4, "Màn 61: Xung Nhịp Khởi Đầu", "Cổng đảo có điều khiển (Controlled Inverter)",
    "⏱️ BẢNG CHÂN TRỊ ĐỘNG: Nguồn phát chạy theo 2 chu kỳ xung nhịp (T0 và T1). Mạch phải thỏa mãn ĐỒNG THỜI cả 2 chu kỳ mới WIN!",
    { W: 5, H: 4, gateType: GateType.XOR }
  ));

  // 62: Xung Đảo Ngược (5x4)
  levels.push(buildControlledInverterLevel(
    62, 4, "Màn 62: Xung Đảo Ngược", "XNOR theo chu kỳ xung",
    "⏱️ Cổng XNOR hoạt động như bộ đệm có điều khiển: Khi C=1 giữ nguyên, khi C=0 thì đảo cực.",
    { W: 5, H: 4, gateType: GateType.XNOR }
  ));

  // 63: Cây Ghép Xung Nhịp (6x6)
  levels.push(buildDynamicClockedTreeLevel(
    63, 4, "Màn 63: Cây Ghép Xung Nhịp", "Mạch ghép 2 chu kỳ đồng bộ",
    "⏱️ Mạch 2 tầng 4 nguồn được kiểm tra với 2 bộ vector kiểm thử khác nhau. Hãy xoay mạch sao cho thỏa mãn cả 2 chu kỳ!",
    {
      W: 6, H: 6, g1: GateType.AND, g2: GateType.OR, g3: GateType.NOR,
      tc1: { s: [1, 0, 0, 0], target: 1, desc: 'Xung T0: S=[1,0,0,0] -> Ra 1' },
      tc2: { s: [1, 1, 0, 0], target: 0, desc: 'Xung T1: S=[1,1,0,0] -> Ra 0' },
    }
  ));

  // 64: Mạch So Sánh Động (6x6)
  levels.push(buildDynamicClockedTreeLevel(
    64, 4, "Màn 64: So Sánh Động", "Kiểm tra tính tương đồng qua xung",
    "⏱️ Tầng 2 là cổng XNOR: Chu kỳ 1 hai nhánh bằng nhau (Ra 1), Chu kỳ 2 hai nhánh lệch nhau (Ra 0)!",
    {
      W: 6, H: 6, g1: GateType.OR, g2: GateType.AND, g3: GateType.XNOR,
      tc1: { s: [1, 0, 1, 1], target: 1, desc: 'Chu kỳ T0: Nhánh 1=1, Nhánh 2=1 -> Ra 1' },
      tc2: { s: [0, 0, 1, 1], target: 0, desc: 'Chu kỳ T1: Nhánh 1=0, Nhánh 2=1 -> Ra 0' },
    }
  ));

  // 65: Xung Nhịp Khóa Thép (6x6)
  levels.push(buildControlledInverterLevel(
    65, 4, "Màn 65: Xung Nhịp Khóa Thép", "Bộ đảo có chốt cố định",
    "🔒 Cổng XOR bị khóa cứng vị trí. Xoay các dây dẫn để đảm bảo tín hiệu xung nhịp truyền thông suốt cả 2 pha.",
    { W: 6, H: 4, gateType: GateType.XOR, lockedGate: true }
  ));

  // 66: Cây Ghép NAND Động (6x6)
  levels.push(buildDynamicClockedTreeLevel(
    66, 4, "Màn 66: Cây Ghép NAND Động", "NAND 2 tầng kiểm tra 2 pha",
    "⏱️ Tầng 2 là cổng NAND: Thỏa mãn đồng thời cả điều kiện kích hoạt và dập tắt qua 2 chu kỳ xung.",
    {
      W: 6, H: 6, g1: GateType.AND, g2: GateType.OR, g3: GateType.NAND,
      tc1: { s: [1, 0, 1, 0], target: 1, desc: 'Chu kỳ T0: Ra 1' },
      tc2: { s: [1, 1, 1, 1], target: 0, desc: 'Chu kỳ T1: Ra 0' },
    }
  ));

  // 67: Xung Nhịp Có Hậu Tố NOT (5x4)
  levels.push(buildControlledInverterLevel(
    67, 4, "Màn 67: Xung Nhịp Đảo Kép", "XOR kết hợp NOT downstream",
    "⏱️ Tín hiệu sau khi qua cổng điều khiển tiếp tục đi qua cổng NOT trước khi tới đèn LED.",
    { W: 5, H: 4, gateType: GateType.XOR, postGate: GateType.NOT }
  ));

  // 68: Cây Ghép XOR Động (6x6)
  levels.push(buildDynamicClockedTreeLevel(
    68, 4, "Màn 68: Cây Ghép XOR Động", "Kiểm tra chẵn lẻ 2 tầng",
    "⏱️ Cổng XOR ở tầng 2 kiểm tra tính chẵn lẻ của 2 nhánh qua 2 chu kỳ kiểm thử.",
    {
      W: 6, H: 6, g1: GateType.XOR, g2: GateType.AND, g3: GateType.XOR,
      tc1: { s: [1, 0, 0, 0], target: 1, desc: 'Chu kỳ T0: Ra 1' },
      tc2: { s: [1, 0, 1, 1], target: 0, desc: 'Chu kỳ T1: Ra 0' },
    }
  ));

  // 69: Xung Nhịp 3 Chu Kỳ (Triple Test Cases) (6x6)
  levels.push(buildDynamicClockedTreeLevel(
    69, 4, "Màn 69: Xung Nhịp 3 Chu Kỳ", "Bảng chân trị 3 trường hợp",
    "⏱️ NÂNG CẤP: Mạch phải vượt qua tới 3 CHU KỲ KIỂM THỬ LIÊN TIẾP (T0, T1, T2)!",
    {
      W: 6, H: 6, g1: GateType.OR, g2: GateType.AND, g3: GateType.NOR,
      tc1: { s: [0, 0, 0, 0], target: 1, desc: 'T0: Cả hai nhánh 0 -> Ra 1' },
      tc2: { s: [1, 0, 0, 0], target: 0, desc: 'T1: Nhánh trên 1 -> Ra 0' },
      tc3: { s: [0, 0, 1, 1], target: 0, desc: 'T2: Nhánh dưới 1 -> Ra 0' },
    }
  ));

  // 70: Cây Ghép Xung Nhịp Khóa Thép (6x6)
  levels.push(buildDynamicClockedTreeLevel(
    70, 4, "Màn 70: Xung Nhịp Khung Thép", "Cổng tầng 2 bị chốt cứng",
    "🔒 Cổng logic ở tầng 2 bị khóa cố định, mạch phải thỏa mãn cả 2 chu kỳ xung nhịp.",
    {
      W: 6, H: 6, g1: GateType.AND, g2: GateType.OR, g3: GateType.NOR,
      tc1: { s: [1, 0, 0, 0], target: 1, desc: 'Chu kỳ T0: Ra 1' },
      tc2: { s: [1, 1, 0, 0], target: 0, desc: 'Chu kỳ T1: Ra 0' },
      lockedAnchor: true,
    }
  ));

  // 71: Xung Nhịp 7x7 Ma Trận Rộng (7x7)
  levels.push(buildDynamicClockedTreeLevel(
    71, 4, "Màn 71: Xung Nhịp 7x7", "Khoảng cách truyền tín hiệu dài",
    "⏱️ Ma trận 7x7: Đường truyền kéo dài nhưng vẫn phải đảm bảo tính thời gian chuẩn của 2 chu kỳ xung.",
    {
      W: 7, H: 6, g1: GateType.NAND, g2: GateType.OR, g3: GateType.AND,
      tc1: { s: [0, 1, 1, 0], target: 1, desc: 'T0: Cả hai nhánh đạt 1 -> Ra 1' },
      tc2: { s: [1, 1, 1, 0], target: 0, desc: 'T1: Nhánh trên dập về 0 -> Ra 0' },
    }
  ));

  // 72: XNOR Động Khóa Thép (6x6)
  levels.push(buildDynamicClockedTreeLevel(
    72, 4, "Màn 72: XNOR Động Khóa Thép", "So sánh bằng có chốt định vị",
    "🔒 Cổng XNOR tầng 2 bị chốt cứng. Hãy điều chỉnh tầng 1 để vượt qua cả 2 bài kiểm thử.",
    {
      W: 6, H: 6, g1: GateType.OR, g2: GateType.AND, g3: GateType.XNOR,
      tc1: { s: [1, 0, 1, 1], target: 1, desc: 'T0: Đồng pha -> Ra 1' },
      tc2: { s: [0, 0, 1, 1], target: 0, desc: 'T1: Lệch pha -> Ra 0' },
      lockedAnchor: true,
    }
  ));

  // 73: Bảng Chân Trị 3 Chu Kỳ Cấp 2 (6x6)
  levels.push(buildDynamicClockedTreeLevel(
    73, 4, "Màn 73: Bảng Chân Trị NAND 3 Pha", "3 Trạng thái xung liên tục",
    "⏱️ Thử thách 3 chu kỳ liên tiếp: Mạch NAND phải đáp ứng đúng [1, 1, 0] theo từng pha đồng hồ.",
    {
      W: 6, H: 6, g1: GateType.AND, g2: GateType.AND, g3: GateType.NAND,
      tc1: { s: [1, 0, 1, 0], target: 1, desc: 'T0: Ra 1' },
      tc2: { s: [1, 1, 0, 1], target: 1, desc: 'T1: Ra 1' },
      tc3: { s: [1, 1, 1, 1], target: 0, desc: 'T2: Ra 0' },
    }
  ));

  // 74: Xung Nhịp Kèm Diode Hậu Tố (7x7)
  levels.push(buildDynamicClockedTreeLevel(
    74, 4, "Màn 74: Xung Nhịp & Diode Bảo Vệ", "Van 1 chiều chống phản hồi xung",
    "⚡ Van DIODE được đặt ở ngõ ra cuối cùng để ngăn phản hồi ngược của xung clock.",
    {
      W: 7, H: 6, g1: GateType.OR, g2: GateType.AND, g3: GateType.AND,
      tc1: { s: [1, 0, 1, 1], target: 1, desc: 'T0: Ra 1' },
      tc2: { s: [0, 0, 1, 1], target: 0, desc: 'T1: Ra 0' },
      postGate: GateType.DIODE,
    }
  ));

  // 75: Cây Ghép Xung Nhịp Khóa Đôi (7x7)
  levels.push(buildDynamicClockedTreeLevel(
    75, 4, "Màn 75: Xung Nhịp Khóa Thép 7x7", "Chốt chặn trên ma trận lớn",
    "🔒 Ma trận 7x7 với cổng tầng 2 bị khóa cố định. Phân tích cả 2 chu kỳ để tìm lời giải duy nhất.",
    {
      W: 7, H: 6, g1: GateType.NAND, g2: GateType.NOR, g3: GateType.XOR,
      tc1: { s: [1, 1, 0, 0], target: 1, desc: 'T0: Ra 1' },
      tc2: { s: [0, 1, 0, 0], target: 0, desc: 'T1: Ra 0' },
      lockedAnchor: true,
    }
  ));

  // 76: Bảng Chân Trị 3 Chu Kỳ Đa Dạng (7x7)
  levels.push(buildDynamicClockedTreeLevel(
    76, 4, "Màn 76: Bảng Chân Trị Tam Pha 7x7", "3 Chu kỳ xung trên ma trận rộng",
    "⏱️ Kiểm tra 3 chu kỳ liên tiếp: Mạch phải giữ độ ổn định logic qua từng chu kỳ xung nhịp.",
    {
      W: 7, H: 6, g1: GateType.OR, g2: GateType.AND, g3: GateType.NOR,
      tc1: { s: [0, 0, 0, 0], target: 1, desc: 'T0: Cả hai nhánh 0 -> Ra 1' },
      tc2: { s: [1, 0, 0, 0], target: 0, desc: 'T1: Nhánh trên 1 -> Ra 0' },
      tc3: { s: [0, 0, 1, 1], target: 0, desc: 'T2: Nhánh dưới 1 -> Ra 0' },
    }
  ));

  // 77: Cây Ghép XNOR Tam Pha (6x6)
  levels.push(buildDynamicClockedTreeLevel(
    77, 4, "Màn 77: Cây Ghép XNOR Tam Pha", "XNOR so sánh 3 trạng thái",
    "⏱️ Ba chu kỳ kiểm thử đòi hỏi cổng XNOR phát hiện chính xác khi nào 2 nhánh bằng nhau.",
    {
      W: 6, H: 6, g1: GateType.AND, g2: GateType.OR, g3: GateType.XNOR,
      tc1: { s: [1, 1, 1, 0], target: 1, desc: 'T0: Cả hai nhánh 1 -> Ra 1' },
      tc2: { s: [0, 0, 0, 0], target: 1, desc: 'T1: Cả hai nhánh 0 -> Ra 1' },
      tc3: { s: [1, 1, 0, 0], target: 0, desc: 'T2: Nhánh lệch -> Ra 0' },
    }
  ));

  // 78: Cây Ghép Xung Nhịp Khóa Thép & Diode (7x7)
  levels.push(buildDynamicClockedTreeLevel(
    78, 4, "Màn 78: Mạch Xung Thép & Diode", "Khóa cố định kèm van 1 chiều",
    "🔒 Cổng logic bị khóa cố định, ngõ ra có van DIODE bảo vệ. Thỏa mãn 2 chu kỳ xung nhịp.",
    {
      W: 7, H: 6, g1: GateType.OR, g2: GateType.AND, g3: GateType.AND,
      tc1: { s: [1, 0, 1, 1], target: 1, desc: 'T0: Ra 1' },
      tc2: { s: [0, 0, 1, 1], target: 0, desc: 'T1: Ra 0' },
      lockedAnchor: true,
      postGate: GateType.DIODE,
    }
  ));

  // 79: Bảng Chân Trị 3 Chu Kỳ Đảo Kép (7x7)
  levels.push(buildDynamicClockedTreeLevel(
    79, 4, "Màn 79: Đảo Kép 3 Chu Kỳ", "NAND & NOR hợp nhất",
    "⏱️ Kết hợp 2 cổng đảo ở tầng 1: Vượt qua 3 trường hợp chân trị liên tiếp.",
    {
      W: 7, H: 6, g1: GateType.NAND, g2: GateType.NOR, g3: GateType.OR,
      tc1: { s: [1, 1, 0, 0], target: 1, desc: 'T0: Ra 1' },
      tc2: { s: [1, 0, 1, 0], target: 1, desc: 'T1: Ra 1' },
      tc3: { s: [1, 1, 1, 0], target: 0, desc: 'T2: Ra 0' },
    }
  ));

  // 80: Mạch Xung Thép 7x7 Cấp Cao (7x7)
  levels.push(buildDynamicClockedTreeLevel(
    80, 4, "Màn 80: Xung Thép Bậc Thầy", "Độ khó suy luận tối đa",
    "🔒 Cổng logic tầng 2 khóa cứng. Bắt buộc phải tính toán chuẩn xác cho cả 2 chu kỳ.",
    {
      W: 7, H: 6, g1: GateType.AND, g2: GateType.XOR, g3: GateType.NOR,
      tc1: { s: [1, 0, 1, 1], target: 1, desc: 'T0: Ra 1' },
      tc2: { s: [1, 1, 1, 1], target: 0, desc: 'T1: Ra 0' },
      lockedAnchor: true,
    }
  ));

  // 81: Bảng Chân Trị Tam Pha 8x8 (8x8)
  levels.push(buildDynamicClockedTreeLevel(
    81, 4, "Màn 81: Xung Nhịp Ma Trận 8x8", "Mở rộng kích thước lưới 8x8",
    "⏱️ Bắt đầu tiến vào lưới lớn 8x8: Sử dụng cử chỉ Zoom / Pan để quan sát mạch và giải mã 3 chu kỳ xung.",
    {
      W: 8, H: 6, g1: GateType.OR, g2: GateType.AND, g3: GateType.NOR,
      tc1: { s: [0, 0, 0, 0], target: 1, desc: 'T0: Ra 1' },
      tc2: { s: [1, 0, 0, 0], target: 0, desc: 'T1: Ra 0' },
      tc3: { s: [0, 0, 1, 1], target: 0, desc: 'T2: Ra 0' },
    }
  ));

  // 82: Cây Ghép XNOR 8x8 (8x8)
  levels.push(buildDynamicClockedTreeLevel(
    82, 4, "Màn 82: XNOR Ma Trận 8x8", "So sánh bằng trên lưới lớn",
    "⏱️ Mạch 8x8 với 2 chu kỳ xung nhịp: Căn chỉnh dây dẫn đường dài chính xác vào cổng XNOR.",
    {
      W: 8, H: 6, g1: GateType.AND, g2: GateType.OR, g3: GateType.XNOR,
      tc1: { s: [1, 1, 1, 0], target: 1, desc: 'T0: Ra 1' },
      tc2: { s: [1, 1, 0, 0], target: 0, desc: 'T1: Ra 0' },
    }
  ));

  // 83: Xung Thép 8x8 Kèm Diode (8x8)
  levels.push(buildDynamicClockedTreeLevel(
    83, 4, "Màn 83: Xung Thép 8x8 & Diode", "Chốt cố định trên ma trận rộng",
    "🔒 Cổng logic bị khóa cứng trên lưới 8x8. Đảm bảo van DIODE cho dòng điện xuôi chiều.",
    {
      W: 8, H: 6, g1: GateType.OR, g2: GateType.AND, g3: GateType.AND,
      tc1: { s: [1, 0, 1, 1], target: 1, desc: 'T0: Ra 1' },
      tc2: { s: [0, 0, 1, 1], target: 0, desc: 'T1: Ra 0' },
      lockedAnchor: true,
      postGate: GateType.DIODE,
    }
  ));

  // 84: Bảng Chân Trị 3 Pha 8x8 Master (8x8)
  levels.push(buildDynamicClockedTreeLevel(
    84, 4, "Màn 84: Bảng Chân Trị Master 8x8", "Đỉnh cao phân tích chu kỳ xung",
    "⏱️ 3 Chu kỳ kiểm thử liên tiếp trên lưới 8x8. Cần tư duy logic kỹ thuật số chuẩn xác.",
    {
      W: 8, H: 6, g1: GateType.NAND, g2: GateType.NOR, g3: GateType.OR,
      tc1: { s: [1, 1, 0, 0], target: 1, desc: 'T0: Ra 1' },
      tc2: { s: [1, 0, 1, 0], target: 1, desc: 'T1: Ra 1' },
      tc3: { s: [1, 1, 1, 0], target: 0, desc: 'T2: Ra 0' },
    }
  ));

  // 85: Boss Chương 4: Bảng Chân Trị Toàn Phần (8x8)
  levels.push(buildDynamicClockedTreeLevel(
    85, 4, "Màn 85: Trùm Chương 4 - Bảng Chân Trị Toàn Phần", "Vượt qua 3 chu kỳ có cổng khóa",
    "👑 TRÙM CHƯƠNG 4: Kết hợp cả Cổng khóa kim loại và Bảng chân trị 3 chu kỳ xung nhịp liên tiếp trên lưới 8x8!",
    {
      W: 8, H: 6, g1: GateType.AND, g2: GateType.OR, g3: GateType.NOR,
      tc1: { s: [0, 0, 0, 0], target: 1, desc: 'T0: Cả hai nhánh 0 -> Ra 1' },
      tc2: { s: [1, 1, 0, 0], target: 0, desc: 'T1: Nhánh trên 1 -> Ra 0' },
      tc3: { s: [0, 0, 1, 1], target: 0, desc: 'T2: Nhánh dưới 1 -> Ra 0' },
      lockedAnchor: true,
    }
  ));

  // ========================================================
  // CHAPTER 5: Bậc Thầy Kỹ Sư - Master Engineer (86 - 100)
  // ========================================================
  // 86: Đường Ống 3 Tầng Khởi Đầu (8x8)
  levels.push(buildCascadeTreeLevel(
    86, 5, "Màn 86: Đại Cây Logic 8x8", "Mạch ghép 2 tầng cỡ lớn",
    "🏆 CHƯƠNG 5: BẬC THẦY KỸ SƯ! Thử thách đỉnh cao kết hợp mọi linh kiện trên ma trận lớn 8x8 đến 10x10.",
    { W: 8, H: 6, g1: GateType.AND, g2: GateType.OR, g3: GateType.XNOR, s: [1, 1, 1, 0], targetSignal: 1, postGate: GateType.DIODE }
  ));

  // 87: Cầu Vượt Xa Lộ 8x8 (8x8)
  levels.push(buildCrossoverHighwayLevel(
    87, 5, "Màn 87: Xa Lộ Dữ Liệu 8x8", "Cầu vượt khóa tại tâm lưới 8x8",
    "🌉 Cầu vượt khóa cố định trên lưới 8x8. Hai tuyến đường dài độc lập nuôi 2 đèn LED.",
    { W: 8, H: 7, rh: 3, cc: 4, sh: 1, sv: 0, gateH: GateType.DIODE, gateV: GateType.NOT, targetH: 1, targetV: 1, lockedCross: true }
  ));

  // 88: Bộ Chia 4 Ngả Master 8x8 (8x8)
  levels.push(buildCrossSplitter4Level(
    88, 5, "Màn 88: Hub Trung Tâm 8x8", "Bộ chia 4 ngả khóa nuôi 3 đèn",
    "🔱 Bộ chia 4 ngả bằng thép ở tâm lưới 8x8 nuôi 3 đèn với các cổng NOT và DIODE.",
    { W: 8, H: 7, sVal: 1, gUp: GateType.NOT, gRight: GateType.DIODE, gDown: GateType.WIRE, targetUp: 0, targetRight: 1, targetDown: 1, lockedSplitter: true }
  ));

  // 89: Cây Ghép Thép Mức [0] 8x8 (8x8)
  levels.push(buildCascadeTreeLevel(
    89, 5, "Màn 89: Cây Ghép Mức [0] 8x8", "Mục tiêu dập tắt tín hiệu trên lưới lớn",
    "🎯 Đèn LED yêu cầu mức [0]. Cổng logic tầng 2 bị khóa đòi hỏi tính toán ngược toàn bộ 4 nguồn.",
    { W: 8, H: 6, g1: GateType.OR, g2: GateType.AND, g3: GateType.NOR, s: [1, 0, 1, 1], targetSignal: 0, lockedAnchor: true }
  ));

  // 90: Xung Nhịp Master 8x8 (8x8)
  levels.push(buildDynamicClockedTreeLevel(
    90, 5, "Màn 90: Xung Nhịp Master 8x8", "3 Chu kỳ xung có cổng khóa",
    "⏱️ Bảng chân trị 3 chu kỳ liên tiếp với cổng logic bị khóa cứng.",
    {
      W: 8, H: 6, g1: GateType.OR, g2: GateType.AND, g3: GateType.NOR,
      tc1: { s: [0, 0, 0, 0], target: 1, desc: 'T0: Ra 1' },
      tc2: { s: [1, 0, 0, 0], target: 0, desc: 'T1: Ra 0' },
      tc3: { s: [0, 0, 1, 1], target: 0, desc: 'T2: Ra 0' },
      lockedAnchor: true,
    }
  ));

  // 91: Đại Mạch 9x9 Cầu Vượt Thép (9x9)
  levels.push(buildCrossoverHighwayLevel(
    91, 5, "Màn 91: Đại Xa Lộ 9x9", "Ma trận 9x9 siêu rộng",
    "🌉 Tiến vào lưới 9x9: Cầu vượt khóa cố định tại tọa độ (4, 4), kết nối 2 tuyến dữ liệu siêu dài.",
    { W: 9, H: 8, rh: 3, cc: 4, sh: 1, sv: 1, gateH: GateType.DIODE, gateV: GateType.DIODE, targetH: 1, targetV: 1, lockedCross: true }
  ));

  // 92: Đại Cây Ghép 9x9 (9x9)
  levels.push(buildCascadeTreeLevel(
    92, 5, "Màn 92: Đại Cây Logic 9x9", "Mạng 4 nguồn trên lưới 9x9",
    "🌳 Lưới 9x9 với đường truyền tín hiệu dài. Sử dụng Pinch-to-zoom để thu phóng khi thao tác.",
    { W: 9, H: 6, g1: GateType.XNOR, g2: GateType.NAND, g3: GateType.AND, s: [1, 1, 0, 1], targetSignal: 1, lockedAnchor: true, postGate: GateType.DIODE }
  ));

  // 93: Bộ Chia 4 Ngả Siêu Cấp 9x9 (9x9)
  levels.push(buildCrossSplitter4Level(
    93, 5, "Màn 93: Tam Phân Lưỡng Cực 9x9", "1 Nguồn nuôi 3 đèn trên lưới 9x9",
    "🎯 Hub chia 4 ngả thép tại tâm 9x9 cấp điện cho 2 đèn [0] và 1 đèn [1].",
    { W: 9, H: 7, sVal: 1, gUp: GateType.NOT, gRight: GateType.DIODE, gDown: GateType.NOT, targetUp: 0, targetRight: 1, targetDown: 0, lockedSplitter: true }
  ));

  // 94: Xung Nhịp 9x9 Tam Pha (9x9)
  levels.push(buildDynamicClockedTreeLevel(
    94, 5, "Màn 94: Xung Nhịp Tam Pha 9x9", "3 Chu kỳ xung nhịp trên lưới 9x9",
    "⏱️ Kiểm tra độ ổn định xung clock trên mạch 9x9 qua 3 chu kỳ liên tiếp.",
    {
      W: 9, H: 6, g1: GateType.NAND, g2: GateType.NOR, g3: GateType.OR,
      tc1: { s: [1, 1, 0, 0], target: 1, desc: 'T0: Ra 1' },
      tc2: { s: [1, 0, 1, 0], target: 1, desc: 'T1: Ra 1' },
      tc3: { s: [1, 1, 1, 0], target: 0, desc: 'T2: Ra 0' },
      lockedAnchor: true,
    }
  ));

  // 95: Cầu Vượt Đa Mục Tiêu 9x9 (9x9)
  levels.push(buildCrossoverHighwayLevel(
    95, 5, "Màn 95: Giao Lộ Đa Cực 9x9", "Cầu vượt khóa cấp Đèn [1] và Đèn [0]",
    "🎯 Cầu vượt thép 9x9: Tuyến ngang nuôi Đèn [1], tuyến dọc nuôi Đèn [0] (qua cổng NOT).",
    { W: 9, H: 8, rh: 3, cc: 4, sh: 1, sv: 1, gateH: GateType.WIRE, gateV: GateType.NOT, targetH: 1, targetV: 0, lockedCross: true }
  ));

  // 96: Đỉnh Cao Kỹ Thuật I (9x9)
  levels.push(buildCascadeTreeLevel(
    96, 5, "Màn 96: Đỉnh Cao Kỹ Thuật I", "Cây ghép 2 tầng khóa đôi",
    "🔒 Cổng logic tầng 2 và van DIODE ngõ ra bị khóa cố định. Phân tích chính xác 4 nguồn điện.",
    { W: 9, H: 6, g1: GateType.OR, g2: GateType.AND, g3: GateType.NOR, s: [0, 0, 1, 0], targetSignal: 1, lockedAnchor: true, postGate: GateType.DIODE }
  ));

  // 97: Đỉnh Cao Kỹ Thuật II (9x9)
  levels.push(buildCrossSplitter4Level(
    97, 5, "Màn 97: Đỉnh Cao Kỹ Thuật II", "Siêu hub 4 ngả ma trận 9x9",
    "🔱 Hub 4 ngả nuôi 3 đèn LED với 2 mức logic đối lập trên bản mạch 9x9.",
    { W: 9, H: 8, sVal: 1, gUp: GateType.NOT, gRight: GateType.DIODE, gDown: GateType.WIRE, targetUp: 0, targetRight: 1, targetDown: 1, lockedSplitter: true }
  ));

  // 98: Đỉnh Cao Kỹ Thuật III (9x9)
  levels.push(buildDynamicClockedTreeLevel(
    98, 5, "Màn 98: Đỉnh Cao Kỹ Thuật III", "Bảng chân trị tam pha có chốt thép",
    "⏱️ Vượt qua 3 chu kỳ xung nhịp liên tiếp với cổng logic bị khóa trên lưới 9x9.",
    {
      W: 9, H: 6, g1: GateType.AND, g2: GateType.OR, g3: GateType.NOR,
      tc1: { s: [0, 0, 0, 0], target: 1, desc: 'T0: Ra 1' },
      tc2: { s: [1, 1, 0, 0], target: 0, desc: 'T1: Ra 0' },
      tc3: { s: [0, 0, 1, 1], target: 0, desc: 'T2: Ra 0' },
      lockedAnchor: true,
      postGate: GateType.DIODE,
    }
  ));

  // 99: Đỉnh Cao Kỹ Thuật IV (10x10)
  levels.push(buildCrossoverHighwayLevel(
    99, 5, "Màn 99: Đỉnh Cao Kỹ Thuật IV", "Đại lộ 10x10 trước thềm trận chung kết",
    "🌉 Ma trận 10x10 cực đại! Cầu vượt khóa cố định ở trung tâm điều hướng 2 luồng dữ liệu khổng lồ.",
    { W: 10, H: 8, rh: 3, cc: 5, sh: 1, sv: 1, gateH: GateType.DIODE, gateV: GateType.DIODE, targetH: 1, targetV: 1, lockedCross: true }
  ));

  // 100: TRÁI TIM CPU - THE MASTER PROCESSOR CORE (10x10)
  levels.push(buildDynamicClockedTreeLevel(
    100, 5, "Màn 100: TRÁI TIM CPU - THE MASTER PROCESSOR", "Đỉnh cao tuyệt đối của Logic Gate Plumber",
    "👑 TRẬN CHUNG KẾT VĨ ĐẠI: Trái tim bộ vi xử lý trên ma trận 10x10! Kết hợp cổng khóa kim loại, van diode bảo vệ và bảng chân trị 3 chu kỳ xung nhịp liên tiếp. Chúc mừng Kỹ Sư Trưởng xuất sắc nhất!",
    {
      W: 10, H: 6, g1: GateType.NAND, g2: GateType.NOR, g3: GateType.XNOR,
      tc1: { s: [1, 0, 0, 0], target: 1, desc: 'Pha Đồng Hồ 1 (T0): Đồng pha -> Ra 1' },
      tc2: { s: [1, 1, 1, 0], target: 1, desc: 'Pha Đồng Hồ 2 (T1): Đồng pha -> Ra 1' },
      tc3: { s: [1, 1, 0, 0], target: 0, desc: 'Pha Đồng Hồ 3 (T2): Lệch pha -> Ra 0' },
      lockedAnchor: true,
      postGate: GateType.DIODE,
    }
  ));

  return levels;
}

// Run test on all generated levels (16 to 100)
console.log('Testing generated levels 16 to 100...');
const newLevels = generateAllLevels();
console.log('Generated', newLevels.length, 'levels.');

let passedCount = 0;
for (const lvl of newLevels) {
  const res = testLevelSolvability(lvl);
  if (res.passed && !res.shortCircuit) {
    passedCount++;
  } else {
    console.error(`Level ${lvl.id} FAILED! passed=${res.passed}, shortCircuit=${res.shortCircuit}`);
  }
}

console.log(`Verification Result for Levels 16-100: ${passedCount} / ${newLevels.length}`);

if (passedCount === newLevels.length) {
  console.log('ALL NEW LEVELS PASSED 100%!');

  function serializeLevel(lvl: LevelDefinition): string {
    const placements: any[] = [];
    for (let r = 0; r < lvl.gridHeight; r++) {
      for (let c = 0; c < lvl.gridWidth; c++) {
        const cell = lvl.cells[r][c];
        if (cell) {
          placements.push({
            r,
            c,
            type: `GateType.${cell.type}`,
            rotation: cell.rotation,
            correctRotation: cell.correctRotation,
            fixed: cell.fixed,
          });
        }
      }
    }

    const placementsLines = placements.map(
      p => `      { r: ${p.r}, c: ${p.c}, type: ${p.type}, rotation: ${p.rotation}, correctRotation: ${p.correctRotation}, fixed: ${p.fixed} },`
    ).join('\n');

    let testCasesStr = '';
    if (lvl.testCases && lvl.testCases.length > 0) {
      testCasesStr = `\n    testCases: ${JSON.stringify(lvl.testCases)},`;
    }

    return `  {
    id: ${lvl.id},
    chapter: ${lvl.chapter},
    name: ${JSON.stringify(lvl.name)},
    subtitle: ${JSON.stringify(lvl.subtitle)},
    gridWidth: ${lvl.gridWidth},
    gridHeight: ${lvl.gridHeight},
    timeLimit: ${lvl.timeLimit},
    parMoves: ${lvl.parMoves},
    tutorialText: ${JSON.stringify(lvl.tutorialText)},
    sources: ${JSON.stringify(lvl.sources)},
    leds: ${JSON.stringify(lvl.leds)},${testCasesStr}
    cells: createGrid(${lvl.gridHeight}, ${lvl.gridWidth}, [
${placementsLines}
    ]),
  },`;
  }

  // Pre-amble is up to line before Level 16
  const preamble = lines.slice(0, lvl16Start - 1).join('\n');
  const serializedLevels16to100 = newLevels.map(serializeLevel).join('\n');
  const fullLevelGeneratorCode = `${preamble}\n${serializedLevels16to100}\n];\n`;

  fs.writeFileSync('src/logic/LevelGenerator.ts', fullLevelGeneratorCode, 'utf8');
  console.log('Updated src/logic/LevelGenerator.ts with all 100 diverse verified levels!');
}
