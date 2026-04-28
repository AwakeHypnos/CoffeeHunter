import { Item, FlavorType, RoastProfile, GrindSetting, BrewingMethod, ProcessMethod } from './types';

const createFlavor = (name: FlavorType, value: number, isPositive: boolean) => ({
  name,
  value,
  isPositive
});

export const itemDatabase: Record<string, Item> = {
  // 生咖啡豆
  green_ethiopian: {
    id: 'green_ethiopian',
    name: '埃塞俄比亚生豆',
    type: 'green_bean',
    icon: '🫘',
    description: '来自埃塞俄比亚的优质生豆，带有明显的果香和花香',
    baseValue: 15,
    flavors: [
      createFlavor('fruity', 5, true),
      createFlavor('floral', 4, true),
      createFlavor('sour', 2, false)
    ],
    rarity: 'uncommon'
  },
  green_colombian: {
    id: 'green_colombian',
    name: '哥伦比亚生豆',
    type: 'green_bean',
    icon: '🫘',
    description: '哥伦比亚产的平衡生豆，甜感和坚果味突出',
    baseValue: 12,
    flavors: [
      createFlavor('sweet', 4, true),
      createFlavor('nutty', 3, true),
      createFlavor('chocolate', 2, true)
    ],
    rarity: 'common'
  },
  green_kenyan: {
    id: 'green_kenyan',
    name: '肯尼亚生豆',
    type: 'green_bean',
    icon: '🫘',
    description: '肯尼亚产的特色生豆，明亮的酸感和黑醋栗风味',
    baseValue: 18,
    flavors: [
      createFlavor('fruity', 6, true),
      createFlavor('sour', 4, false),
      createFlavor('sweet', 2, true)
    ],
    rarity: 'rare'
  },
  green_brazilian: {
    id: 'green_brazilian',
    name: '巴西生豆',
    type: 'green_bean',
    icon: '🫘',
    description: '巴西产的基础生豆，适合做意式拼配',
    baseValue: 8,
    flavors: [
      createFlavor('nutty', 3, true),
      createFlavor('chocolate', 2, true),
      createFlavor('bitter', 1, false)
    ],
    rarity: 'common'
  },
  green_jamaican: {
    id: 'green_jamaican',
    name: '蓝山生豆',
    type: 'green_bean',
    icon: '🫘',
    description: '牙买加蓝山产区的顶级生豆，完美平衡的风味',
    baseValue: 50,
    flavors: [
      createFlavor('fruity', 4, true),
      createFlavor('floral', 4, true),
      createFlavor('sweet', 5, true),
      createFlavor('nutty', 3, true)
    ],
    rarity: 'legendary'
  },
  
  // 熟咖啡豆（烘焙后）
  roasted_light: {
    id: 'roasted_light',
    name: '浅烘焙豆',
    type: 'roasted_bean',
    icon: '🟤',
    description: '轻度烘焙的咖啡豆，保留更多原始风味',
    baseValue: 20,
    flavors: [
      createFlavor('fruity', 4, true),
      createFlavor('floral', 3, true),
      createFlavor('sour', 2, false)
    ],
    rarity: 'common'
  },
  roasted_medium: {
    id: 'roasted_medium',
    name: '中烘焙豆',
    type: 'roasted_bean',
    icon: '🟫',
    description: '中度烘焙的咖啡豆，平衡的酸苦感',
    baseValue: 25,
    flavors: [
      createFlavor('sweet', 4, true),
      createFlavor('nutty', 3, true),
      createFlavor('chocolate', 3, true)
    ],
    rarity: 'common'
  },
  roasted_dark: {
    id: 'roasted_dark',
    name: '深烘焙豆',
    type: 'roasted_bean',
    icon: '⬛',
    description: '深度烘焙的咖啡豆，浓郁的苦味和焦香',
    baseValue: 22,
    flavors: [
      createFlavor('chocolate', 4, true),
      createFlavor('bitter', 3, false),
      createFlavor('burnt', 2, false)
    ],
    rarity: 'common'
  },
  
  // 咖啡粉
  coffee_powder_fine: {
    id: 'coffee_powder_fine',
    name: '细磨咖啡粉',
    type: 'coffee_powder',
    icon: '🥣',
    description: '细研磨的咖啡粉，适合意式浓缩',
    baseValue: 30,
    flavors: [
      createFlavor('sweet', 3, true),
      createFlavor('chocolate', 3, true),
      createFlavor('bitter', 2, false)
    ],
    rarity: 'common'
  },
  coffee_powder_medium: {
    id: 'coffee_powder_medium',
    name: '中磨咖啡粉',
    type: 'coffee_powder',
    icon: '🥣',
    description: '中研磨的咖啡粉，适合手冲和滴滤',
    baseValue: 28,
    flavors: [
      createFlavor('fruity', 3, true),
      createFlavor('sweet', 3, true),
      createFlavor('sour', 1, false)
    ],
    rarity: 'common'
  },
  
  // 咖啡液
  coffee_liquid_espresso: {
    id: 'coffee_liquid_espresso',
    name: '意式浓缩',
    type: 'coffee_liquid',
    icon: '☕',
    description: '浓郁的意式浓缩咖啡液',
    baseValue: 40,
    flavors: [
      createFlavor('chocolate', 4, true),
      createFlavor('nutty', 2, true),
      createFlavor('bitter', 3, false)
    ],
    rarity: 'common'
  },
  coffee_liquid_pour_over: {
    id: 'coffee_liquid_pour_over',
    name: '手冲咖啡',
    type: 'coffee_liquid',
    icon: '☕',
    description: '清澈的手冲咖啡液，保留更多风味层次',
    baseValue: 38,
    flavors: [
      createFlavor('fruity', 4, true),
      createFlavor('floral', 3, true),
      createFlavor('sweet', 3, true),
      createFlavor('watery', 1, false)
    ],
    rarity: 'common'
  },
  
  // 水果
  fruit_vanilla: {
    id: 'fruit_vanilla',
    name: '香草荚',
    type: 'fruit',
    icon: '🌿',
    description: '马达加斯加香草荚，增添甜美香气',
    baseValue: 20,
    flavors: [
      createFlavor('sweet', 4, true),
      createFlavor('floral', 2, true)
    ],
    rarity: 'uncommon'
  },
  fruit_orange: {
    id: 'fruit_orange',
    name: '橙皮',
    type: 'fruit',
    icon: '🍊',
    description: '新鲜橙皮，增添明亮的柑橘风味',
    baseValue: 10,
    flavors: [
      createFlavor('fruity', 3, true),
      createFlavor('sour', 2, false)
    ],
    rarity: 'common'
  },
  fruit_berry: {
    id: 'fruit_berry',
    name: '混合浆果',
    type: 'fruit',
    icon: '🫐',
    description: '新鲜蓝莓和覆盆子的混合物',
    baseValue: 15,
    flavors: [
      createFlavor('fruity', 5, true),
      createFlavor('sweet', 2, true),
      createFlavor('sour', 1, false)
    ],
    rarity: 'uncommon'
  },
  fruit_coconut: {
    id: 'fruit_coconut',
    name: '椰子片',
    type: 'fruit',
    icon: '🥥',
    description: '烘烤的椰子片，增添热带风情',
    baseValue: 12,
    flavors: [
      createFlavor('sweet', 3, true),
      createFlavor('nutty', 2, true)
    ],
    rarity: 'common'
  },
  
  // 香料
  spice_cinnamon: {
    id: 'spice_cinnamon',
    name: '肉桂棒',
    type: 'spice',
    icon: '🌰',
    description: '锡兰肉桂棒，温暖的辛香料',
    baseValue: 15,
    flavors: [
      createFlavor('spicy', 4, true),
      createFlavor('sweet', 2, true)
    ],
    rarity: 'common'
  },
  spice_cardamom: {
    id: 'spice_cardamom',
    name: '小豆蔻',
    type: 'spice',
    icon: '🫛',
    description: '印度小豆蔻，独特的香料风味',
    baseValue: 25,
    flavors: [
      createFlavor('spicy', 5, true),
      createFlavor('floral', 2, true)
    ],
    rarity: 'rare'
  },
  spice_clove: {
    id: 'spice_clove',
    name: '丁香',
    type: 'spice',
    icon: '🌷',
    description: '丁香花蕾，强烈的辛香料',
    baseValue: 18,
    flavors: [
      createFlavor('spicy', 4, true),
      createFlavor('bitter', 2, false)
    ],
    rarity: 'uncommon'
  },
  
  // 牛奶类
  milk_whole: {
    id: 'milk_whole',
    name: '全脂牛奶',
    type: 'milk',
    icon: '🥛',
    description: '新鲜全脂牛奶，增添丝滑口感',
    baseValue: 8,
    flavors: [
      createFlavor('sweet', 2, true),
      createFlavor('watery', 1, false)
    ],
    rarity: 'common'
  },
  milk_soy: {
    id: 'milk_soy',
    name: '豆浆',
    type: 'milk',
    icon: '🌱',
    description: '有机豆浆，植物基底',
    baseValue: 12,
    flavors: [
      createFlavor('nutty', 3, true),
      createFlavor('sweet', 1, true)
    ],
    rarity: 'common'
  },
  milk_oat: {
    id: 'milk_oat',
    name: '燕麦奶',
    type: 'milk',
    icon: '🌾',
    description: '顺滑燕麦奶，咖啡的完美搭档',
    baseValue: 15,
    flavors: [
      createFlavor('sweet', 3, true),
      createFlavor('nutty', 2, true)
    ],
    rarity: 'uncommon'
  }
};

export const processMethods: ProcessMethod[] = [
  {
    id: 'washed',
    name: '水洗处理',
    icon: '💧',
    description: '干净通透、果酸清晰、花香纯净',
    tags: ['水洗', '干净通透', '果酸清晰', '花香纯净'],
    addedTags: ['水洗', '干净'],
    tagMultiplier: {},
    removeTags: [],
    qualityBonus: 1,
    flavorModifiers: {
      add: ['floral'],
      remove: ['bitter', 'burnt'],
      multiply: {
        'fruity': 1.3,
        'floral': 1.2,
        'sour': 1.1,
        'sweet': 0.9,
        'nutty': 0.9,
        'chocolate': 0.8,
        'spicy': 0.8,
        'bitter': 0.5,
        'burnt': 0,
        'watery': 1
      }
    }
  },
  {
    id: 'natural',
    name: '日晒处理',
    icon: '☀️',
    description: '发酵果香、红酒感、热带水果、甜感爆炸',
    tags: ['日晒', '发酵果香', '红酒感', '热带水果', '甜感爆炸'],
    addedTags: ['日晒', '发酵', '红酒感'],
    tagMultiplier: {},
    removeTags: [],
    qualityBonus: 2,
    flavorModifiers: {
      add: ['sweet'],
      remove: ['watery'],
      multiply: {
        'fruity': 1.4,
        'floral': 1.0,
        'sour': 0.9,
        'sweet': 1.3,
        'nutty': 1.0,
        'chocolate': 0.9,
        'spicy': 0.9,
        'bitter': 0.8,
        'burnt': 0.8,
        'watery': 0.5
      }
    }
  },
  {
    id: 'honey',
    name: '蜜处理',
    icon: '🍯',
    description: '桃子、蜜糖、柔和果香，甜感极强',
    tags: ['蜜处理', '桃子', '蜜糖', '柔和果香', '甜感极强'],
    addedTags: ['蜜处理', '蜜糖', '桃子香'],
    tagMultiplier: {},
    removeTags: [],
    qualityBonus: 2,
    flavorModifiers: {
      add: ['sweet', 'nutty'],
      remove: [],
      multiply: {
        'fruity': 1.1,
        'floral': 0.9,
        'sour': 0.7,
        'sweet': 1.4,
        'nutty': 1.1,
        'chocolate': 1.0,
        'spicy': 0.9,
        'bitter': 0.9,
        'burnt': 0.9,
        'watery': 1.0
      }
    }
  },
  {
    id: 'anaerobic',
    name: '厌氧发酵',
    icon: '🍇',
    description: '葡萄、荔枝、浆果、烈酒风味，创意特调必备',
    tags: ['厌氧发酵', '葡萄', '荔枝', '浆果', '烈酒风味'],
    addedTags: ['厌氧', '发酵', '烈酒感', '特殊处理'],
    tagMultiplier: {},
    removeTags: [],
    qualityBonus: 3,
    flavorModifiers: {
      add: ['fruity', 'floral'],
      remove: ['bitter'],
      multiply: {
        'fruity': 1.5,
        'floral': 1.3,
        'sour': 0.8,
        'sweet': 1.2,
        'nutty': 0.8,
        'chocolate': 0.7,
        'spicy': 1.1,
        'bitter': 0.6,
        'burnt': 0.7,
        'watery': 1.0
      }
    }
  },
  {
    id: 'wet_hulled',
    name: '湿刨处理',
    icon: '🌴',
    description: '海岛豆专属，泥土草本味',
    tags: ['湿刨处理', '泥土草本味', '海岛风味'],
    addedTags: ['湿刨', '海岛风味', '泥土草本'],
    tagMultiplier: {},
    removeTags: [],
    qualityBonus: 1,
    flavorModifiers: {
      add: ['nutty', 'spicy'],
      remove: ['floral'],
      multiply: {
        'fruity': 0.8,
        'floral': 0.5,
        'sour': 1.0,
        'sweet': 0.9,
        'nutty': 1.3,
        'chocolate': 1.1,
        'spicy': 1.2,
        'bitter': 1.1,
        'burnt': 1.0,
        'watery': 1.0
      }
    }
  }
];

export const roastProfiles: RoastProfile[] = [
  {
    name: '浅度烘焙',
    description: '保留更多原始风味，酸感明显',
    duration: 8,
    temperature: 200,
    flavorModifiers: {
      add: ['floral'],
      remove: ['bitter', 'burnt'],
      multiply: {
        'fruity': 1.3,
        'floral': 1.2,
        'sour': 1.1,
        'sweet': 0.9,
        'nutty': 0.8,
        'chocolate': 0.7,
        'spicy': 0.8,
        'bitter': 0.3,
        'burnt': 0,
        'watery': 1
      }
    }
  },
  {
    name: '中度烘焙',
    description: '平衡的酸苦感，适合大多数人',
    duration: 12,
    temperature: 215,
    flavorModifiers: {
      add: ['sweet'],
      remove: [],
      multiply: {
        'fruity': 1.0,
        'floral': 0.8,
        'sour': 0.8,
        'sweet': 1.2,
        'nutty': 1.1,
        'chocolate': 1.1,
        'spicy': 1.0,
        'bitter': 0.8,
        'burnt': 0.2,
        'watery': 1
      }
    }
  },
  {
    name: '深度烘焙',
    description: '浓郁的苦味和焦香，适合意式',
    duration: 15,
    temperature: 230,
    flavorModifiers: {
      add: ['chocolate', 'bitter'],
      remove: ['fruity', 'floral'],
      multiply: {
        'fruity': 0.4,
        'floral': 0.2,
        'sour': 0.3,
        'sweet': 0.8,
        'nutty': 1.2,
        'chocolate': 1.4,
        'spicy': 1.1,
        'bitter': 1.5,
        'burnt': 1.0,
        'watery': 1
      }
    }
  }
];

export const grindSettings: GrindSetting[] = [
  {
    name: '粗研磨',
    size: 'coarse',
    brewMethods: ['法式压滤壶', '冷萃'],
    flavorModifiers: {
      add: ['fruity', 'floral'],
      multiply: {
        'fruity': 1.2,
        'floral': 1.1,
        'sour': 0.9,
        'sweet': 0.9,
        'nutty': 0.9,
        'chocolate': 0.9,
        'spicy': 1.0,
        'bitter': 0.7,
        'burnt': 0.8,
        'watery': 1.2
      }
    }
  },
  {
    name: '中研磨',
    size: 'medium',
    brewMethods: ['手冲', '滴滤', '爱乐压'],
    flavorModifiers: {
      add: ['sweet'],
      multiply: {
        'fruity': 1.0,
        'floral': 1.0,
        'sour': 1.0,
        'sweet': 1.1,
        'nutty': 1.0,
        'chocolate': 1.0,
        'spicy': 1.0,
        'bitter': 1.0,
        'burnt': 1.0,
        'watery': 1.0
      }
    }
  },
  {
    name: '细研磨',
    size: 'fine',
    brewMethods: ['意式浓缩', '摩卡壶'],
    flavorModifiers: {
      add: ['chocolate', 'bitter'],
      multiply: {
        'fruity': 0.8,
        'floral': 0.7,
        'sour': 0.8,
        'sweet': 1.0,
        'nutty': 1.1,
        'chocolate': 1.3,
        'spicy': 1.1,
        'bitter': 1.3,
        'burnt': 1.1,
        'watery': 0.8
      }
    }
  }
];

export const brewingMethods: BrewingMethod[] = [
  {
    name: '意式浓缩',
    description: '高压快速萃取，浓郁醇厚',
    waterRatio: 2,
    brewTime: 30,
    recommendedGrind: ['fine'],
    flavorModifiers: {
      add: ['chocolate', 'nutty'],
      multiply: {
        'fruity': 0.9,
        'floral': 0.8,
        'sour': 0.9,
        'sweet': 1.0,
        'nutty': 1.2,
        'chocolate': 1.3,
        'spicy': 1.0,
        'bitter': 1.2,
        'burnt': 1.1,
        'watery': 0.7
      }
    }
  },
  {
    name: '手冲',
    description: '逐层注水，风味清晰',
    waterRatio: 15,
    brewTime: 180,
    recommendedGrind: ['medium', 'coarse'],
    flavorModifiers: {
      add: ['fruity', 'floral'],
      multiply: {
        'fruity': 1.3,
        'floral': 1.2,
        'sour': 1.1,
        'sweet': 1.0,
        'nutty': 0.9,
        'chocolate': 0.9,
        'spicy': 0.9,
        'bitter': 0.8,
        'burnt': 0.8,
        'watery': 1.1
      }
    }
  },
  {
    name: '冷萃',
    description: '低温长时间浸泡，低酸顺滑',
    waterRatio: 10,
    brewTime: 7200,
    recommendedGrind: ['coarse'],
    flavorModifiers: {
      add: ['sweet'],
      multiply: {
        'fruity': 0.9,
        'floral': 1.0,
        'sour': 0.5,
        'sweet': 1.3,
        'nutty': 1.1,
        'chocolate': 1.1,
        'spicy': 0.9,
        'bitter': 0.6,
        'burnt': 0.7,
        'watery': 1.2
      }
    }
  }
];

export function getItemById(id: string): Item | null {
  return itemDatabase[id] || null;
}

export function getRandomItem(type?: string, rarity?: string): Item {
  let items = Object.values(itemDatabase);
  
  if (type) {
    items = items.filter(item => item.type === type);
  }
  
  if (rarity) {
    items = items.filter(item => item.rarity === rarity);
  }
  
  if (items.length === 0) {
    items = Object.values(itemDatabase);
  }
  
  const weights = {
    common: 50,
    uncommon: 30,
    rare: 15,
    epic: 4,
    legendary: 1
  };
  
  const weightedItems: Item[] = [];
  items.forEach(item => {
    const weight = weights[item.rarity] || 10;
    for (let i = 0; i < weight; i++) {
      weightedItems.push(item);
    }
  });
  
  return weightedItems[Math.floor(Math.random() * weightedItems.length)];
}