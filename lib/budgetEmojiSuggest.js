/**
 * budgetEmojiSuggest.js — Budget Emoji Auto-Suggestion
 *
 * Provides `suggestEmoji(name)` which maps budget name keywords to relevant
 * emoji icons. Called in real-time as the user types in the budget name field
 * inside CreateBudget.jsx (via a useEffect that watches the name state).
 *
 * Matching strategy:
 *   - The input name is lowercased and split into individual words.
 *   - Each RULES entry has an emoji and a `keywords` array.
 *   - A match is found if ANY keyword is a substring of the lowercased name.
 *   - Rules are tested in order; the first match wins.
 *
 * Bilingual: supports both English and Thai keyword matching.
 * Returns undefined (not null) when there is no keyword match.
 */

/**
 * RULES — ordered list of emoji-to-keyword mappings.
 * Add new entries here to extend auto-suggestion support.
 */
const RULES = [
  // ── Food & Dining ──────────────────────────────────────────────────────────
  { emoji: '🍽️', keywords: ['food', 'meal', 'dinner', 'lunch', 'breakfast', 'dining', 'restaurant', 'eat', 'อาหาร', 'ข้าว', 'มื้อ', 'ร้านอาหาร'] },
  { emoji: '☕', keywords: ['coffee', 'cafe', 'cafeteria', 'กาแฟ', 'คาเฟ่'] },
  { emoji: '🍕', keywords: ['pizza', 'fast food', 'fastfood', 'burger', 'hamburger', 'ฟาสฟู้ด'] },
  { emoji: '🧋', keywords: ['bubble tea', 'boba', 'tea', 'drink', 'ชานม', 'บับเบิ้ล', 'เครื่องดื่ม', 'ชา'] },
  { emoji: '🥗', keywords: ['salad', 'healthy', 'vegetarian', 'vegan', 'ผัก', 'สลัด'] },
  { emoji: '🍱', keywords: ['bento', 'japanese', 'sushi', 'ramen', 'ญี่ปุ่น', 'ซูชิ', 'ราเมน'] },
  { emoji: '🍜', keywords: ['noodle', 'pasta', 'ก๋วยเตี๋ยว', 'บะหมี่', 'เส้น'] },
  { emoji: '🧁', keywords: ['bakery', 'cake', 'dessert', 'sweet', 'ขนม', 'เค้ก', 'เบเกอรี่'] },
  { emoji: '🍺', keywords: ['bar', 'alcohol', 'beer', 'wine', 'pub', 'เหล้า', 'เบียร์', 'บาร์'] },

  // ── Grocery & Market ───────────────────────────────────────────────────────
  { emoji: '🛒', keywords: ['grocery', 'supermarket', 'market', 'convenience', 'ตลาด', 'ซุปเปอร์มาร์เก็ต', 'ร้านสะดวกซื้อ', 'โลตัส', 'เทสโก้', '빅씨', 'big c', 'makro', 'แม็คโคร', 'tops'] },

  // ── Transport ──────────────────────────────────────────────────────────────
  { emoji: '🚗', keywords: ['car', 'transport', 'commute', 'vehicle', 'รถ', 'ยานพาหนะ', 'คมนาคม'] },
  { emoji: '⛽', keywords: ['gas', 'fuel', 'petrol', 'น้ำมัน', 'ปั๊ม', 'เชื้อเพลิง'] },
  { emoji: '🚕', keywords: ['taxi', 'grab', 'uber', 'แท็กซี่', 'แกร็บ'] },
  { emoji: '🚇', keywords: ['bts', 'mrt', 'metro', 'subway', 'train', 'sky train', 'รถไฟ', 'รถไฟฟ้า'] },
  { emoji: '✈️', keywords: ['flight', 'airplane', 'airline', 'airport', 'plane', 'บิน', 'เครื่องบิน', 'สนามบิน'] },
  { emoji: '🚌', keywords: ['bus', 'รถบัส', 'รถโดยสาร'] },
  { emoji: '🛵', keywords: ['motorbike', 'motorcycle', 'bike', 'scooter', 'มอเตอร์ไซค์', 'จักรยานยนต์'] },

  // ── Housing ────────────────────────────────────────────────────────────────
  { emoji: '🏠', keywords: ['house', 'home', 'rent', 'condo', 'apartment', 'housing', 'residence', 'บ้าน', 'เช่า', 'คอนโด', 'ที่พัก', 'อพาร์ทเมนต์'] },
  { emoji: '🏗️', keywords: ['renovation', 'repair', 'construction', 'maintain', 'ซ่อม', 'ปรับปรุง', 'ก่อสร้าง'] },
  { emoji: '🛋️', keywords: ['furniture', 'decor', 'interior', 'home decor', 'เฟอร์นิเจอร์', 'ตกแต่ง'] },

  // ── Utilities ──────────────────────────────────────────────────────────────
  { emoji: '⚡', keywords: ['electric', 'electricity', 'power', 'ไฟฟ้า', 'ค่าไฟ'] },
  { emoji: '💧', keywords: ['water', 'waterworks', 'ประปา', 'ค่าน้ำ'] },
  { emoji: '📡', keywords: ['internet', 'broadband', 'wifi', 'อินเทอร์เน็ต', 'เน็ต', 'ไวไฟ'] },
  { emoji: '📱', keywords: ['phone', 'mobile', 'sim', 'โทรศัพท์', 'มือถือ', 'ซิม', 'dtac', 'ais', 'true', 'nt'] },

  // ── Shopping & Fashion ─────────────────────────────────────────────────────
  { emoji: '🛍️', keywords: ['shopping', 'shop', 'mall', 'ช็อปปิ้ง', 'ห้าง', 'ช้อป'] },
  { emoji: '👗', keywords: ['clothes', 'clothing', 'fashion', 'dress', 'outfit', 'เสื้อผ้า', 'แฟชั่น', 'เสื้อ'] },
  { emoji: '👟', keywords: ['shoes', 'sneaker', 'footwear', 'รองเท้า'] },
  { emoji: '👜', keywords: ['bag', 'handbag', 'purse', 'กระเป๋า'] },
  { emoji: '💍', keywords: ['jewelry', 'accessory', 'watch', 'เครื่องประดับ', 'นาฬิกา', 'แหวน'] },

  // ── Beauty & Personal Care ─────────────────────────────────────────────────
  { emoji: '💄', keywords: ['beauty', 'makeup', 'cosmetic', 'lipstick', 'เครื่องสำอาง', 'แต่งหน้า', 'ลิปสติก'] },
  { emoji: '💅', keywords: ['nail', 'spa', 'massage', 'salon', 'เล็บ', 'สปา', 'นวด', 'ซาลอน'] },
  { emoji: '🧴', keywords: ['skincare', 'lotion', 'cream', 'serum', 'บำรุงผิว', 'สกินแคร์', 'โลชั่น', 'ครีม'] },
  { emoji: '✂️', keywords: ['hair', 'haircut', 'barber', 'hairdresser', 'ตัดผม', 'ทำผม'] },

  // ── Health & Medical ───────────────────────────────────────────────────────
  { emoji: '🏥', keywords: ['hospital', 'clinic', 'doctor', 'medical', 'โรงพยาบาล', 'คลินิก', 'หมอ'] },
  { emoji: '💊', keywords: ['medicine', 'drug', 'pharmacy', 'health', 'ยา', 'ร้านยา', 'สุขภาพ'] },
  { emoji: '🦷', keywords: ['dental', 'dentist', 'teeth', 'orthodontic', 'ฟัน', 'ทันตแพทย์', 'จัดฟัน'] },
  { emoji: '👓', keywords: ['glasses', 'eyewear', 'contact lens', 'optic', 'แว่น', 'แว่นตา', 'คอนแทคเลนส์'] },

  // ── Fitness & Sport ────────────────────────────────────────────────────────
  { emoji: '💪', keywords: ['gym', 'fitness', 'workout', 'exercise', 'sport', 'ยิม', 'ฟิตเนส', 'ออกกำลังกาย', 'กีฬา'] },
  { emoji: '🏊', keywords: ['swim', 'pool', 'swimming', 'ว่ายน้ำ', 'สระ'] },
  { emoji: '⚽', keywords: ['football', 'soccer', 'basketball', 'tennis', 'badminton', 'ฟุตบอล', 'บาสเก็ตบอล', 'แบดมินตัน'] },
  { emoji: '🧘', keywords: ['yoga', 'meditation', 'pilates', 'โยคะ', 'สมาธิ'] },

  // ── Education ──────────────────────────────────────────────────────────────
  { emoji: '📚', keywords: ['education', 'school', 'study', 'book', 'course', 'learn', 'เรียน', 'โรงเรียน', 'หนังสือ', 'คอร์ส', 'ติวเตอร์', 'มหาวิทยาลัย'] },
  { emoji: '🎓', keywords: ['university', 'tuition', 'tutor', 'college', 'degree', 'scholarship', 'ปริญญา', 'ค่าเล่าเรียน', 'ทุน'] },
  { emoji: '🖥️', keywords: ['online course', 'programming', 'coding', 'software', 'udemy', 'coursera', 'คอร์สออนไลน์'] },

  // ── Entertainment ──────────────────────────────────────────────────────────
  { emoji: '🎬', keywords: ['movie', 'cinema', 'netflix', 'film', 'หนัง', 'ภาพยนตร์', 'โรงหนัง', 'ซีรีส์'] },
  { emoji: '🎮', keywords: ['game', 'gaming', 'playstation', 'xbox', 'steam', 'เกม'] },
  { emoji: '🎵', keywords: ['music', 'spotify', 'concert', 'karaoke', 'เพลง', 'ดนตรี', 'คาราโอเกะ', 'คอนเสิร์ต'] },
  { emoji: '📺', keywords: ['tv', 'television', 'streaming', 'youtube', 'ทีวี'] },
  { emoji: '🎡', keywords: ['park', 'amusement', 'theme park', 'สวนสนุก', 'สวนสาธารณะ'] },

  // ── Travel ─────────────────────────────────────────────────────────────────
  { emoji: '🌴', keywords: ['vacation', 'holiday', 'resort', 'beach', 'วันหยุด', 'ท่องเที่ยว', 'พักผ่อน', 'ทะเล', 'รีสอร์ท'] },
  { emoji: '🏨', keywords: ['hotel', 'hostel', 'accommodation', 'airbnb', 'โรงแรม', 'ที่พักแรม'] },
  { emoji: '🗺️', keywords: ['travel', 'trip', 'tour', 'ท่องเที่ยว', 'ทริป', 'เดินทาง'] },

  // ── Tech & Electronics ─────────────────────────────────────────────────────
  { emoji: '💻', keywords: ['laptop', 'computer', 'pc', 'macbook', 'คอมพิวเตอร์', 'แล็ปท็อป'] },
  { emoji: '📷', keywords: ['camera', 'photo', 'photography', 'กล้อง', 'ถ่ายภาพ'] },
  { emoji: '🎧', keywords: ['headphone', 'earphone', 'airpod', 'speaker', 'หูฟัง', 'ลำโพง'] },

  // ── Finance & Savings ──────────────────────────────────────────────────────
  { emoji: '💰', keywords: ['saving', 'savings', 'fund', 'invest', 'investment', 'เก็บเงิน', 'ออมทรัพย์', 'ลงทุน', 'กองทุน'] },
  { emoji: '💳', keywords: ['credit card', 'debit', 'payment', 'บัตรเครดิต', 'ชำระ', 'จ่าย'] },
  { emoji: '🏦', keywords: ['bank', 'banking', 'finance', 'ธนาคาร', 'การเงิน'] },
  { emoji: '🛡️', keywords: ['insurance', 'ประกัน'] },
  { emoji: '📈', keywords: ['stock', 'crypto', 'trading', 'หุ้น', 'คริปโต', 'เทรด'] },

  // ── Pets ───────────────────────────────────────────────────────────────────
  { emoji: '🐾', keywords: ['pet', 'dog', 'cat', 'animal', 'vet', 'สัตว์เลี้ยง', 'หมา', 'แมว', 'หมอสัตว์', 'vet'] },

  // ── Baby & Kids ────────────────────────────────────────────────────────────
  { emoji: '👶', keywords: ['baby', 'child', 'kid', 'toy', 'เด็ก', 'ทารก', 'ของเล่น'] },
  { emoji: '🍼', keywords: ['milk', 'formula', 'pamper', 'diaper', 'นม', 'ผ้าอ้อม'] },

  // ── Gifts & Special ────────────────────────────────────────────────────────
  { emoji: '🎁', keywords: ['gift', 'present', 'birthday', 'celebration', 'ของขวัญ', 'วันเกิด', 'ฉลอง'] },
  { emoji: '❤️', keywords: ['date', 'valentine', 'anniversary', 'romantic', 'แฟน', 'ออกเดท', 'วาเลนไทน์'] },
  { emoji: '⛪', keywords: ['wedding', 'ceremony', 'งานแต่ง', 'แต่งงาน'] },

  // ── Work & Office ──────────────────────────────────────────────────────────
  { emoji: '💼', keywords: ['work', 'office', 'business', 'professional', 'งาน', 'ออฟฟิศ', 'ธุรกิจ'] },
  { emoji: '🖨️', keywords: ['stationery', 'printer', 'paper', 'เครื่องเขียน', 'กระดาษ', 'ปริ้น'] },

  // ── Miscellaneous ──────────────────────────────────────────────────────────
  { emoji: '🌿', keywords: ['garden', 'plant', 'flower', 'สวน', 'ต้นไม้', 'ดอกไม้'] },
  { emoji: '🧹', keywords: ['cleaning', 'laundry', 'housework', 'ทำความสะอาด', 'ซักผ้า', 'บ้าน'] },
  { emoji: '🎪', keywords: ['event', 'party', 'social', 'งาน', 'ปาร์ตี้', 'สังสรรค์'] },
  { emoji: '🌙', keywords: ['night', 'midnight', 'กลางคืน', 'ดึก'] },
  { emoji: '☀️', keywords: ['daily', 'everyday', 'routine', 'ประจำวัน', 'รายวัน'] },
  { emoji: '📦', keywords: ['delivery', 'shipping', 'parcel', 'ส่งของ', 'พัสดุ', 'ขนส่ง', 'lazada', 'shopee', 'shein'] },
  { emoji: '🧾', keywords: ['bill', 'invoice', 'receipt', 'billed', 'ใบเสร็จ', 'บิล', 'ค่าใช้จ่าย'] },
  { emoji: '🎒', keywords: ['backpack', 'school bag', 'กระเป๋าเป้', 'กระเป๋านักเรียน'] },
  { emoji: '🍀', keywords: ['misc', 'other', 'general', 'อื่นๆ', 'ทั่วไป', 'เบ็ดเตล็ด'] },
];

/**
 * Suggest emoji from a budget name string.
 * @param {string} budgetName
 * @returns {string | undefined}
 */
export function suggestEmoji(budgetName) {
  if (!budgetName || typeof budgetName !== 'string') return undefined;
  const lower = budgetName.toLowerCase().trim();
  if (!lower) return undefined;

  for (const rule of RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw.toLowerCase()))) {
      return rule.emoji;
    }
  }
  return undefined;
}
