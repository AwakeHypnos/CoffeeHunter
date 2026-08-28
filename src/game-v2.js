// ============================================
// CoffeeHunter 游戏主逻辑 v2
// 改进：保留每道工序的标签，不同原料产生不同产物
// ============================================

const Game = {
  storageKey: 'coffeeHunter.save.v3',

  // 核心规则集中定义，避免探索、制作和经营阶段各自出现不可追踪的魔法数字。
  rules: {
    dailyCustomerCount: 4,
    exploration: {
      actionPointsByDifficulty: {
        easy: 16,
        medium: 14,
        hard: 12
      },
      backpackCapacity: 8,
      protectedCapacity: 2,
      collectCost: 1,
      dangerCost: 4,
      terrainCost: {
        grass: 1,
        forest: 2,
        mountain: 3,
        exit: 1
      }
    },
    quality: {
      baseScore: 55,
      minScore: 0,
      maxScore: 100
    },
    economy: {
      travelCostByDifficulty: { easy: 10, medium: 20, hard: 35 },
      explorationSupplyCost: 25,
      maintenanceBaseCost: 5,
      maintenancePerTool: 3
    },
    specialization: {
      thresholds: [0, 40, 100],
      rankNames: ['学徒', '熟练', '大师']
    },
    festival: {
      milestones: [
        { id: 'day7', name: '地区咖啡节', targetDay: 7, reputationGoal: 60, recipeGoal: 5, rewardGold: 500 },
        { id: 'day14', name: '巡回咖啡节', targetDay: 14, reputationGoal: 120, recipeGoal: 10, rewardGold: 1000 }
      ]
    }
  },

  state: {
    gold: 100,
    reputation: 0,
    day: 1,
    inventory: [],
    coffeeStock: [],
    selectedMap: null,
    currentScene: 'main-menu',
    tools: {
      highTempRoaster: false,
      espressoMachine: false,
      fineGrinder: false,
      advancedGrinder: false,
      fermentationChamber: false,
      mokaPot: false,
      brewingChamber: false
    },
    exploredToday: false,
    discovered: {},
    dayHistory: [],
    explorationSupplies: 2,
    specializations: { exploration: 0, roasting: 0, business: 0 },
    collection: { beans: {}, recipes: {} },
    activeCommission: null,
    completedCommissions: 0,
    customerHistory: {},
    festival: { results: {} }
  },
  
  exploreState: {
    map: [],
    playerPos: { x: 0, y: 0 },
    mapWidth: 17,
    mapHeight: 13,
    exitPoints: [],
    dangerPoints: [],
    revealedCells: new Set(),
    collectedItems: 0,
    collectedItemIds: [],
    actionPoints: 16,
    maxActionPoints: 16,
    backpackCapacity: 8,
    protectedCapacity: 2,
    reachedFarExit: false,
    pendingDanger: false,
    actionPointsSpent: 0,
    travelCostPaid: 0,
    dangerDecisions: []
  },
  
  craftState: {
    processItems: [],
    processMethod: null,
    roastItems: [],
    roastLevel: null,
    grindItems: [],
    grindLevel: null,
    brewItems: [],
    brewMethod: null,
    blendItems: [],
    additives: [],
    currentStep: 0,
    finishedCoffee: null
  },
  
  shopState: {
    customers: [],
    selectedCustomer: null,
    selectedCoffee: null,
    soldToday: 0,
    incomeToday: 0,
    satisfactionTotal: 0
  },
  
  messages: [],
  selectedWorkshopItem: null,

  // ============================================
  // 物品定义（原料）
  // ============================================
  
  baseItems: {
    green_arabica: {
      id: 'green_arabica',
      name: '阿拉比卡生豆',
      type: 'green_bean',
      icon: '🫘',
      description: '精品咖啡核心，高价基础豆。风味复杂、酸度柔和、香气浓郁、咖啡因低。',
      origin: '阿拉比卡',
      tags: ['果香', '花香', '酸感柔和', '阿拉比卡', '高品质'],
      rarity: 'uncommon',
      species: 'arabica'
    },
    green_robusta: {
      id: 'green_robusta',
      name: '罗布斯塔生豆',
      type: 'green_bean',
      icon: '🫘',
      description: '商业速溶、拼配基底。苦味重、醇厚、油脂厚、咖啡因极高、风味单调。',
      origin: '罗布斯塔',
      tags: ['苦味', '醇厚', '油脂', '高咖啡因', '罗布斯塔', '量产'],
      rarity: 'common',
      species: 'robusta'
    },
    green_liberica: {
      id: 'green_liberica',
      name: '利比利卡生豆',
      type: 'green_bean',
      icon: '🫘',
      description: '小众珍品，迷雾区域、隐秘秘境专属掉落。烟熏、木质、热带水果重口，辨识度极强。',
      origin: '利比利卡',
      tags: ['烟熏', '木质', '热带水果', '利比利卡', '稀有', '天价'],
      rarity: 'legendary',
      species: 'liberica'
    },
    
    green_yirgacheffe: {
      id: 'green_yirgacheffe',
      name: '耶加雪菲生豆',
      type: 'green_bean',
      icon: '🫘',
      description: '埃塞俄比亚稀有豆，柑橘、柠檬、茉莉、白花、草莓、蜂蜜甜，清爽酸甜。',
      origin: '埃塞俄比亚',
      tags: ['柑橘', '花香', '草莓', '蜂蜜甜', '埃塞俄比亚', '稀有'],
      rarity: 'rare',
      species: 'arabica'
    },
    green_sidamo: {
      id: 'green_sidamo',
      name: '西达摩生豆',
      type: 'green_bean',
      icon: '🫘',
      description: '埃塞俄比亚稀有豆，带有蓝莓、黑莓、柠檬皮的清新风味。',
      origin: '埃塞俄比亚',
      tags: ['蓝莓', '黑莓', '柠檬皮', '埃塞俄比亚', '稀有'],
      rarity: 'rare',
      species: 'arabica'
    },
    green_huahua: {
      id: 'green_huahua',
      name: '花魁生豆',
      type: 'green_bean',
      icon: '🫘',
      description: '埃塞俄比亚传奇稀有豆，浓郁花香、热带水果、蜂蜜甜感。',
      origin: '埃塞俄比亚',
      tags: ['花香', '热带水果', '蜂蜜甜', '埃塞俄比亚', '传奇'],
      rarity: 'epic',
      species: 'arabica'
    },
    green_gesha_native: {
      id: 'green_gesha_native',
      name: '瑰夏原生种生豆',
      type: 'green_bean',
      icon: '🫘',
      description: '埃塞俄比亚极稀有豆，瑰夏的原生种，栀子花、荔枝、芒果、兰花顶级花香果香。',
      origin: '埃塞俄比亚',
      tags: ['栀子花', '荔枝', '芒果', '兰花', '埃塞俄比亚', '极稀有'],
      rarity: 'legendary',
      species: 'arabica'
    },
    
    green_kenya_aa: {
      id: 'green_kenya_aa',
      name: '肯尼亚AA生豆',
      type: 'green_bean',
      icon: '🫘',
      description: '肯尼亚顶级稀有豆，黑醋栗、蔓越莓、番茄、尖锐果酸、浓郁莓果。',
      origin: '肯尼亚',
      tags: ['黑醋栗', '蔓越莓', '尖锐果酸', '浓郁莓果', '肯尼亚', '顶级'],
      rarity: 'epic',
      species: 'arabica'
    },
    
    green_tanzanian: {
      id: 'green_tanzanian',
      name: '坦桑尼亚生豆',
      type: 'green_bean',
      icon: '🫘',
      description: '坦桑尼亚产，菠萝、柚子、红糖、柔和果香。',
      origin: '坦桑尼亚',
      tags: ['菠萝', '柚子', '红糖', '柔和果香', '坦桑尼亚'],
      rarity: 'uncommon',
      species: 'arabica'
    },
    
    green_rwanda: {
      id: 'green_rwanda',
      name: '卢旺达生豆',
      type: 'green_bean',
      icon: '🫘',
      description: '卢旺达产，樱桃、红莓、红酒发酵感、淡淡香料味。',
      origin: '卢旺达',
      tags: ['樱桃', '红莓', '红酒发酵', '香料味', '卢旺达'],
      rarity: 'uncommon',
      species: 'arabica'
    },
    
    green_colombian: {
      id: 'green_colombian',
      name: '哥伦比亚生豆',
      type: 'green_bean',
      icon: '🫘',
      description: '哥伦比亚产的平衡生豆，甜感和坚果味突出',
      origin: '哥伦比亚',
      tags: ['甜感', '坚果', '巧克力', '哥伦比亚'],
      rarity: 'common',
      species: 'arabica'
    },
    
    green_santos: {
      id: 'green_santos',
      name: '桑托斯生豆',
      type: 'green_bean',
      icon: '🫘',
      description: '巴西稀有豆，烤坚果、可可、奶油、低酸、醇厚甜感。',
      origin: '巴西',
      tags: ['烤坚果', '可可', '奶油', '低酸', '醇厚甜感', '巴西', '稀有'],
      rarity: 'rare',
      species: 'arabica'
    },
    
    green_brazilian: {
      id: 'green_brazilian',
      name: '巴西生豆',
      type: 'green_bean',
      icon: '🫘',
      description: '巴西产的基础生豆，适合做意式拼配',
      origin: '巴西',
      tags: ['坚果', '巧克力', '巴西', '苦味'],
      rarity: 'common',
      species: 'arabica'
    },
    
    green_costa_rica: {
      id: 'green_costa_rica',
      name: '哥斯达黎加生豆',
      type: 'green_bean',
      icon: '🫘',
      description: '哥斯达黎加产，蜂蜜、桃子、甘蔗、热带水果。',
      origin: '哥斯达黎加',
      tags: ['蜂蜜', '桃子', '甘蔗', '热带水果', '哥斯达黎加'],
      rarity: 'uncommon',
      species: 'arabica'
    },
    
    green_guatemala: {
      id: 'green_guatemala',
      name: '危地马拉生豆',
      type: 'green_bean',
      icon: '🫘',
      description: '火山土壤产出，烟熏、巧克力、黑樱桃。',
      origin: '危地马拉',
      tags: ['烟熏', '巧克力', '黑樱桃', '危地马拉'],
      rarity: 'uncommon',
      species: 'arabica'
    },
    
    green_gesha_panama: {
      id: 'green_gesha_panama',
      name: '巴拿马瑰夏生豆',
      type: 'green_bean',
      icon: '🫘',
      description: '传奇豆产区巴拿马，栀子花、荔枝、芒果、兰花、顶级花香果香。迷雾秘境宝箱掉落。',
      origin: '巴拿马',
      tags: ['栀子花', '荔枝', '芒果', '兰花', '巴拿马', '传奇', '顶级'],
      rarity: 'legendary',
      species: 'arabica'
    },
    
    green_sumatra: {
      id: 'green_sumatra',
      name: '苏门答腊生豆',
      type: 'green_bean',
      icon: '🫘',
      description: '印尼苏门答腊，湿厚发酵处理，低酸重醇。泥土、草本、黑巧克力、檀香、烟草、枫糖。',
      origin: '印尼',
      tags: ['泥土', '草本', '黑巧克力', '檀香', '烟草', '枫糖', '印尼', '低酸'],
      rarity: 'uncommon',
      species: 'arabica'
    },
    
    green_java: {
      id: 'green_java',
      name: '爪哇生豆',
      type: 'green_bean',
      icon: '🫘',
      description: '印尼爪哇岛产，厚重草本、香料木质调。',
      origin: '印尼',
      tags: ['草本', '香料', '木质', '印尼'],
      rarity: 'uncommon',
      species: 'arabica'
    },
    
    green_bali: {
      id: 'green_bali',
      name: '巴厘岛生豆',
      type: 'green_bean',
      icon: '🫘',
      description: '印尼巴厘岛产，香料、木质、淡淡果香。',
      origin: '印尼',
      tags: ['香料', '木质', '果香', '印尼'],
      rarity: 'uncommon',
      species: 'arabica'
    },
    
    green_indian: {
      id: 'green_indian',
      name: '印度生豆',
      type: 'green_bean',
      icon: '🫘',
      description: '印度产，香料风极强，豆蔻、胡椒、木质调。',
      origin: '印度',
      tags: ['豆蔻', '胡椒', '木质调', '印度', '香料风'],
      rarity: 'uncommon',
      species: 'arabica'
    },
    
    green_yunnan: {
      id: 'green_yunnan',
      name: '云南生豆',
      type: 'green_bean',
      icon: '🫘',
      description: '中国云南产，适配国风迷雾山林，新手友好原料。焦糖、红枣、坚果、淡淡蜜香，性价比极高。',
      origin: '云南',
      tags: ['焦糖', '红枣', '坚果', '蜜香', '云南', '新手友好'],
      rarity: 'common',
      species: 'arabica'
    },
    
    green_papua: {
      id: 'green_papua',
      name: '巴布亚新几内亚生豆',
      type: 'green_bean',
      icon: '🫘',
      description: '丛林浓雾，混合莓果、草药、奶油口感。',
      origin: '巴布亚新几内亚',
      tags: ['混合莓果', '草药', '奶油', '巴布亚'],
      rarity: 'uncommon',
      species: 'arabica'
    },
    
    green_blue_mountain: {
      id: 'green_blue_mountain',
      name: '牙买加蓝山生豆',
      type: 'green_bean',
      icon: '🫘',
      description: '海岛特殊产区，海岛雾气+海风，带有海盐、椰子、奶油调性。限定海岛地图掉落。',
      origin: '牙买加',
      tags: ['海盐', '椰子', '奶油', '海岛', '牙买加', '稀有'],
      rarity: 'epic',
      species: 'arabica'
    },
    
    green_kona: {
      id: 'green_kona',
      name: '夏威夷科纳生豆',
      type: 'green_bean',
      icon: '🫘',
      description: '海岛特殊产区，海岛雾气+海风，带有海盐、椰子、奶油调性。限定海岛地图掉落。',
      origin: '夏威夷',
      tags: ['海盐', '椰子', '奶油', '海岛', '夏威夷', '稀有'],
      rarity: 'epic',
      species: 'arabica'
    },
    
    milk_whole: {
      id: 'milk_whole',
      name: '全脂牛奶',
      type: 'additive',
      icon: '🥛',
      description: '新鲜全脂牛奶，增添丝滑口感',
      tags: ['奶香', '顺滑', '甜感'],
      rarity: 'common'
    },
    milk_oat: {
      id: 'milk_oat',
      name: '燕麦奶',
      type: 'additive',
      icon: '🌾',
      description: '顺滑燕麦奶，咖啡的完美搭档',
      tags: ['谷物', '健康', '甜感'],
      rarity: 'uncommon'
    },
    fruit_vanilla: {
      id: 'fruit_vanilla',
      name: '香草荚',
      type: 'additive',
      icon: '🌿',
      description: '马达加斯加香草荚，增添甜美香气',
      tags: ['香草', '甜感', '花香'],
      rarity: 'uncommon'
    },
    fruit_orange: {
      id: 'fruit_orange',
      name: '橙皮',
      type: 'additive',
      icon: '🍊',
      description: '新鲜橙皮，增添明亮的柑橘风味',
      tags: ['果香', '柑橘', '酸甜'],
      rarity: 'common'
    },
    fruit_berry: {
      id: 'fruit_berry',
      name: '混合浆果',
      type: 'additive',
      icon: '🫐',
      description: '新鲜蓝莓和覆盆子的混合物',
      tags: ['果香', '酸甜', '花香'],
      rarity: 'uncommon'
    },
    spice_cinnamon: {
      id: 'spice_cinnamon',
      name: '肉桂棒',
      type: 'additive',
      icon: '🌰',
      description: '锡兰肉桂棒，温暖的辛香料',
      tags: ['香料', '温暖', '甜感'],
      rarity: 'common'
    },
    spice_cardamom: {
      id: 'spice_cardamom',
      name: '小豆蔻',
      type: 'additive',
      icon: '🫛',
      description: '印度小豆蔻，独特的香料风味',
      tags: ['香料', '特色', '花香'],
      rarity: 'rare'
    },
    
    jam_berry: {
      id: 'jam_berry',
      name: '莓果果浆',
      type: 'additive',
      subtype: 'jam',
      icon: '🍯',
      description: '新鲜莓果熬制的果浆，酸甜浓郁',
      tags: ['果香', '莓果', '酸甜', '甜感'],
      rarity: 'uncommon'
    },
    jam_orange: {
      id: 'jam_orange',
      name: '柑橘果浆',
      type: 'additive',
      subtype: 'jam',
      icon: '🍯',
      description: '新鲜柑橘熬制的果浆，明亮酸甜',
      tags: ['果香', '柑橘', '酸甜', '柠檬酸'],
      rarity: 'uncommon'
    },
    jam_tropical: {
      id: 'jam_tropical',
      name: '热带果浆',
      type: 'additive',
      subtype: 'jam',
      icon: '🍯',
      description: '芒果、菠萝等热带水果熬制的果浆',
      tags: ['果香', '热带水果', '芒果', '菠萝', '甜感'],
      rarity: 'rare'
    },
    
    spice_extract_cinnamon: {
      id: 'spice_extract_cinnamon',
      name: '肉桂浸液',
      type: 'additive',
      subtype: 'spice_extract',
      icon: '🫗',
      description: '肉桂棒慢浸提取的浓郁香料液',
      tags: ['香料', '肉桂', '温暖', '甜感'],
      rarity: 'uncommon'
    },
    spice_extract_cardamom: {
      id: 'spice_extract_cardamom',
      name: '豆蔻浸液',
      type: 'additive',
      subtype: 'spice_extract',
      icon: '🫗',
      description: '小豆蔻慢浸提取的独特香料液',
      tags: ['香料', '豆蔻', '花香', '特色'],
      rarity: 'rare'
    },
    spice_extract_vanilla: {
      id: 'spice_extract_vanilla',
      name: '香草精',
      type: 'additive',
      subtype: 'spice_extract',
      icon: '🫗',
      description: '纯正香草精，浓郁甜美香气',
      tags: ['香料', '香草', '甜感', '花香'],
      rarity: 'uncommon'
    },
    
    nectar_honey: {
      id: 'nectar_honey',
      name: '纯蜂蜜',
      type: 'additive',
      subtype: 'nectar',
      icon: '🍯',
      description: '天然纯蜂蜜，柔和甜润',
      tags: ['甜感', '蜂蜜甜', '花香', '柔和'],
      rarity: 'uncommon'
    },
    nectar_flower: {
      id: 'nectar_flower',
      name: '花蜜糖',
      type: 'additive',
      subtype: 'nectar',
      icon: '🌸',
      description: '多种花卉精华提取的花蜜糖',
      tags: ['甜感', '花香甜', '茉莉', '兰花', '花香'],
      rarity: 'rare'
    },
    nectar_caramel: {
      id: 'nectar_caramel',
      name: '焦糖糖浆',
      type: 'additive',
      subtype: 'nectar',
      icon: '🍬',
      description: '慢熬焦糖糖浆，浓郁焦香',
      tags: ['甜感', '焦糖甜', '焦香', '烘焙'],
      rarity: 'uncommon'
    },
    
    mist_essence: {
      id: 'mist_essence',
      name: '迷雾精华',
      type: 'additive',
      subtype: 'mist_material',
      icon: '🌫️',
      description: '从迷雾深处提取的神秘精华，木质草本风味',
      tags: ['迷雾风味', '木质', '草本', '泥土', '特色'],
      rarity: 'epic'
    },
    mist_crystal: {
      id: 'mist_crystal',
      name: '迷雾结晶',
      type: 'additive',
      subtype: 'mist_material',
      icon: '💎',
      description: '迷雾区域特有的神秘结晶，矿盐咸感',
      tags: ['迷雾风味', '矿盐', '咸感', '矿质', '稀有'],
      rarity: 'legendary'
    },
    mist_herb: {
      id: 'mist_herb',
      name: '迷雾草药',
      type: 'additive',
      subtype: 'mist_material',
      icon: '🌿',
      description: '只在迷雾区域生长的神秘草药',
      tags: ['迷雾风味', '草本', '木质', '泥土', '苔藓'],
      rarity: 'rare'
    }
  },

  // ============================================
  // 咖啡风味系统定义
  // ============================================
  
  flavorTastes: {
    sour: {
      id: 'sour',
      name: '酸',
      subtypes: ['柠檬酸', '苹果酸', '酒石酸', '莓果酸'],
      tags: ['柠檬酸', '苹果酸', '酒石酸', '莓果酸', '酸感', '明亮酸', '尖锐果酸']
    },
    bitter: {
      id: 'bitter',
      name: '苦',
      subtypes: ['咖啡因苦', '烘焙焦苦', '木质苦', '烟熏苦'],
      tags: ['咖啡因苦', '烘焙焦苦', '木质苦', '烟熏苦', '苦味', '焦味', '浓醇']
    },
    sweet: {
      id: 'sweet',
      name: '甜',
      subtypes: ['焦糖甜', '蜂蜜甜', '果糖甜', '麦芽甜', '花香甜'],
      tags: ['焦糖甜', '蜂蜜甜', '果糖甜', '麦芽甜', '花香甜', '甜感', '蜜糖', '奶油甜']
    },
    salty: {
      id: 'salty',
      name: '咸',
      subtypes: ['海盐感', '矿盐调味', '泥土咸感'],
      tags: ['海盐', '矿盐', '泥土咸感', '咸感', '矿质']
    }
  },
  
  flavorAromas: {
    floral: {
      id: 'floral',
      name: '花香调',
      subtypes: ['茉莉', '兰花', '玫瑰', '桂花'],
      tags: ['茉莉', '兰花', '玫瑰', '桂花', '花香', '栀子花香', '兰花香'],
      icon: '🌸'
    },
    fruity: {
      id: 'fruity',
      name: '果香调',
      subtypes: ['柑橘', '莓果', '热带水果'],
      tags: ['柑橘', '莓果', '热带水果', '果香', '柠檬', '橙子', '蓝莓', '草莓', '菠萝', '芒果', '荔枝', '百香果', '樱桃', '柚子'],
      icon: '🍊'
    },
    nutty_chocolate: {
      id: 'nutty_chocolate',
      name: '坚果可可调',
      subtypes: ['杏仁', '核桃', '黑巧克力', '可可'],
      tags: ['杏仁', '核桃', '黑巧克力', '可可', '坚果', '巧克力', '烤坚果', '可可脂'],
      icon: '🥜'
    },
    spicy: {
      id: 'spicy',
      name: '香料调',
      subtypes: ['肉桂', '豆蔻', '胡椒', '香草'],
      tags: ['肉桂', '豆蔻', '胡椒', '香草', '香料', '辛香料', '胡椒味', '香草精'],
      icon: '🌶️'
    },
    woody_herbal: {
      id: 'woody_herbal',
      name: '木质草本调',
      subtypes: ['松木', '干草', '泥土', '苔藓'],
      tags: ['松木', '干草', '泥土', '苔藓', '木质', '草本', '木质调', '草药', '泥土味', '迷雾风味'],
      icon: '🌿',
      exclusive: 'mist'
    },
    roasted_caramel: {
      id: 'roasted_caramel',
      name: '烘焙焦香调',
      subtypes: ['焦糖', '烟熏', '烤麦芽', '炭烧'],
      tags: ['焦糖', '烟熏', '烤麦芽', '炭烧', '烘焙', '焦香', '烤香', '烟熏味'],
      icon: '🔥'
    }
  },
  
  flavorTextures: {
    rich: { id: 'rich', name: '醇厚', description: '浓郁饱满的口感' },
    light: { id: 'light', name: '清爽', description: '清淡明亮的口感' },
    silky: { id: 'silky', name: '丝滑', description: '顺滑如丝的口感' },
    thick: { id: 'thick', name: '浓稠', description: '厚重粘稠的口感' },
    dry: { id: 'dry', name: '干涩', description: '干涩收敛的口感' },
    oily: { id: 'oily', name: '油脂饱满', description: '丰富油脂的口感' },
    watery: { id: 'watery', name: '水润', description: '清新水润的口感' }
  },

  // ============================================
  // 预处理方式定义
  // ============================================
  
  processMethods: [
    {
      id: 'washed',
      name: '水洗处理',
      icon: '💧',
      description: '干净通透、果酸清晰、花香纯净',
      tags: ['水洗', '干净通透', '果酸清晰', '花香纯净'],
      addedTags: ['水洗', '干净'],
      tagMultiplier: { '柠檬酸': 1.3, '苹果酸': 1.2, '花香': 1.2, '茉莉': 1.1 },
      removeTags: ['泥土味', '木质苦'],
      qualityBonus: 1
    },
    {
      id: 'natural',
      name: '日晒处理',
      icon: '☀️',
      description: '发酵果香、红酒感、热带水果、甜感爆炸',
      tags: ['日晒', '发酵果香', '红酒感', '热带水果', '甜感爆炸'],
      addedTags: ['日晒', '发酵', '红酒感'],
      tagMultiplier: { '热带水果': 1.4, '莓果': 1.3, '甜感': 1.3, '蜂蜜甜': 1.2 },
      removeTags: ['干净通透'],
      qualityBonus: 2
    },
    {
      id: 'honey',
      name: '蜜处理',
      icon: '🍯',
      description: '桃子、蜜糖、柔和果香，甜感极强',
      tags: ['蜜处理', '桃子', '蜜糖', '柔和果香', '甜感极强'],
      addedTags: ['蜜处理', '蜜糖', '桃子香'],
      tagMultiplier: { '甜感': 1.4, '蜂蜜甜': 1.3, '焦糖甜': 1.2, '桃子': 1.2 },
      removeTags: [],
      qualityBonus: 2
    },
    {
      id: 'anaerobic',
      name: '厌氧发酵',
      icon: '🍇',
      description: '葡萄、荔枝、浆果、烈酒风味，创意特调必备',
      tags: ['厌氧发酵', '葡萄', '荔枝', '浆果', '烈酒风味'],
      addedTags: ['厌氧', '发酵', '烈酒感', '特殊处理'],
      tagMultiplier: { '葡萄': 1.4, '荔枝': 1.3, '浆果': 1.2, '酒香': 1.3 },
      removeTags: [],
      qualityBonus: 3,
      requiredTool: 'fermentationChamber'
    },
    {
      id: 'wet_hulled',
      name: '湿刨处理',
      icon: '🌴',
      description: '海岛豆专属，泥土草本味',
      tags: ['湿刨处理', '泥土草本味', '海岛风味'],
      addedTags: ['湿刨', '海岛风味', '泥土草本'],
      tagMultiplier: { '泥土': 1.3, '草本': 1.2, '木质': 1.1 },
      removeTags: ['干净通透', '柠檬酸'],
      qualityBonus: 1,
      exclusiveTo: ['island']
    }
  ],

  // ============================================
  // 烘焙程度定义
  // ============================================
  
  roastLevels: [
    {
      id: 'light',
      name: '浅度烘焙',
      icon: '🟤',
      description: '保留更多原始风味，酸感明显',
      tags: ['浅烘', '酸感', '花香'],
      removeTags: ['苦味', '焦味'],
      tagMultiplier: { '果香': 1.3, '花香': 1.2, '酸感': 1.1 }
    },
    {
      id: 'medium',
      name: '中度烘焙',
      icon: '🟫',
      description: '平衡的酸苦感，适合大多数人',
      tags: ['中烘', '甜感', '平衡'],
      removeTags: [],
      tagMultiplier: { '甜感': 1.2, '坚果': 1.1 }
    },
    {
      id: 'dark',
      name: '深度烘焙',
      icon: '⬛',
      description: '浓郁的苦味和焦香，适合意式',
      tags: ['深烘', '苦味', '焦味'],
      removeTags: ['果香', '花香', '酸感'],
      tagMultiplier: { '巧克力': 1.4, '坚果': 1.2, '苦味': 1.5 },
      requiredTool: 'highTempRoaster'
    }
  ],

  // ============================================
  // 研磨粗细定义
  // ============================================
  
  grindLevels: [
    {
      id: 'extra_coarse',
      name: '极粗研磨',
      icon: '🫘',
      description: '适合冷萃、法压壶',
      tags: ['极粗磨', '果香', '花香'],
      tagMultiplier: { '果香': 1.3, '花香': 1.2 },
      requiredTool: 'advancedGrinder'
    },
    {
      id: 'coarse',
      name: '粗研磨',
      icon: '🫘',
      description: '适合法式压滤壶、冷萃',
      tags: ['粗磨', '果香', '花香'],
      tagMultiplier: { '果香': 1.2, '花香': 1.1 }
    },
    {
      id: 'medium',
      name: '中研磨',
      icon: '🥣',
      description: '适合手冲、滴滤、爱乐压',
      tags: ['中磨', '甜感', '平衡'],
      tagMultiplier: { '甜感': 1.1 }
    },
    {
      id: 'fine',
      name: '细研磨',
      icon: '⚪',
      description: '适合意式浓缩、摩卡壶',
      tags: ['细磨', '巧克力', '苦味'],
      tagMultiplier: { '巧克力': 1.3, '苦味': 1.3 },
      requiredTool: 'fineGrinder'
    },
    {
      id: 'extra_fine',
      name: '极细研磨',
      icon: '⚪',
      description: '适合土耳其咖啡',
      tags: ['极细磨', '浓郁', '苦味'],
      tagMultiplier: { '巧克力': 1.5, '苦味': 1.5 },
      requiredTool: 'advancedGrinder'
    }
  ],

  // ============================================
  // 萃取方式定义
  // ============================================
  
  brewMethods: [
    {
      id: 'espresso',
      name: '意式高压浓缩',
      icon: '☕',
      description: '高压快速萃取厚油脂，所有奶咖基底',
      tags: ['意式', '浓郁', '巧克力', '坚果', '油脂饱满', '浓稠'],
      tagMultiplier: { '巧克力': 1.3, '坚果': 1.2, '苦味': 1.2, '油脂饱满': 1.1 },
      addedTags: ['意式浓缩', '厚油脂'],
      textureBonus: 'oily',
      recommendedGrinds: ['fine'],
      recommendedRoasts: ['medium', 'dark'],
      requiredTool: 'espressoMachine'
    },
    {
      id: 'pour_over',
      name: '手冲滴滤',
      icon: '☕',
      description: '干净果香、清淡柔和，新手基础配方',
      tags: ['手冲', '清晰', '果香', '花香', '清爽', '平衡'],
      tagMultiplier: { '果香': 1.3, '花香': 1.2, '酸感': 1.1, '柠檬酸': 1.2 },
      addedTags: ['手冲', '干净'],
      textureBonus: 'light',
      recommendedGrinds: ['medium', 'coarse'],
      recommendedRoasts: ['light', 'medium']
    },
    {
      id: 'french_press',
      name: '法压浸泡',
      icon: '🫖',
      description: '醇厚草本，适合搭配香料、草药',
      tags: ['法压', '醇厚', '草本', '香料', '木质', '浓郁'],
      tagMultiplier: { '草本': 1.3, '木质': 1.2, '香料': 1.1, '泥土': 1.2 },
      addedTags: ['法压', '浸泡萃取'],
      textureBonus: 'rich',
      removeTags: ['清爽', '干净通透'],
      recommendedGrinds: ['coarse', 'extra_coarse']
    },
    {
      id: 'cold_brew',
      name: '冷萃/冰滴',
      icon: '🧊',
      description: '低温慢萃，低苦顺滑，适合水果特调',
      tags: ['冷萃', '顺滑', '甜感', '低酸', '水润', '清爽'],
      tagMultiplier: { '甜感': 1.3, '顺滑': 1.2, '酸感': 0.5, '苦味': 0.7, '果香': 1.1 },
      addedTags: ['冷萃', '冰滴', '低酸'],
      textureBonus: 'silky',
      removeTags: ['焦味', '木质苦'],
      recommendedGrinds: ['coarse', 'extra_coarse']
    },
    {
      id: 'moka_pot',
      name: '摩卡壶',
      icon: '🫖',
      description: '浓醇焦香，深烘豆子专属',
      tags: ['摩卡', '浓醇', '焦香', '巧克力', '苦味', '浓稠'],
      tagMultiplier: { '巧克力': 1.4, '苦味': 1.3, '焦味': 1.2, '焦糖': 1.1 },
      addedTags: ['摩卡壶', '蒸汽加压'],
      textureBonus: 'thick',
      requiredTool: 'mokaPot',
      recommendedGrinds: ['fine'],
      recommendedRoasts: ['dark'],
      recommendedRoast: 'dark'
    },
    {
      id: 'turkish',
      name: '土耳其煮制',
      icon: '☕',
      description: '咖啡粉连渣煮制，混合香料，复古暗黑风',
      tags: ['土耳其', '极致苦涩', '香料融合', '浓郁', '干涩'],
      tagMultiplier: { '苦味': 1.5, '香料': 1.4, '木质苦': 1.3, '烟熏苦': 1.2 },
      addedTags: ['土耳其', '连渣煮制', '复古暗黑'],
      textureBonus: 'dry',
      removeTags: ['清爽', '干净', '花香'],
      recommendedGrinds: ['extra_fine'],
      recommendedRoasts: ['dark'],
      requiredGrind: 'extra_fine'
    },
    {
      id: 'immersion_brew',
      name: '浸泡酿造',
      icon: '🍶',
      description: '咖啡豆+水果+香料+特殊迷雾素材，长时间密封浸泡发酵，产出独一无二的炼金特调咖啡',
      tags: ['浸泡酿造', '炼金特调', '发酵', '独特风味', '创意'],
      tagMultiplier: { '果香': 1.4, '香料': 1.3, '甜感': 1.2, '发酵': 1.5, '迷雾风味': 1.4 },
      addedTags: ['炼金特调', '浸泡发酵', '创意咖啡'],
      textureBonus: 'rich',
      recommendedGrinds: ['coarse', 'medium'],
      requiredTool: 'brewingChamber'
    }
  ],

  // ============================================
  // 地图数据（按四大产区分类）
  // ============================================
  
  maps: [
    {
      id: 'ethiopia',
      name: '埃塞俄比亚迷雾高原',
      icon: '🌍',
      region: 'africa',
      regionName: '非洲产区',
      difficulty: 'easy',
      description: '咖啡发源地，迷雾高原与火山区。酸质明亮、花果香浓郁，生长着耶加雪菲、西达摩等传奇咖啡豆。',
      tags: ['咖啡发源地', '花果香', '酸质明亮', '新手友好'],
      rewards: { gold: 50, reputation: 10 },
      itemWeights: {
        green_arabica: 30,
        green_robusta: 20,
        green_yunnan: 15,
        fruit_orange: 15,
        spice_cinnamon: 10,
        milk_whole: 10
      },
      rareItems: [
        { id: 'green_yirgacheffe', name: '耶加雪菲', chance: 0.5 },
        { id: 'green_sidamo', name: '西达摩', chance: 0.3 },
        { id: 'green_huahua', name: '花魁', chance: 0.15 },
        { id: 'green_gesha_native', name: '瑰夏原生种', chance: 0.05 }
      ],
      terrain: '高原',
      dangerLevel: 1,
      unlockRequirement: null
    },
    {
      id: 'kenya',
      name: '肯尼亚火山秘境',
      icon: '🗻',
      region: 'africa',
      regionName: '非洲产区',
      difficulty: 'medium',
      description: '肯尼亚火山地区，黑醋栗、蔓越莓、番茄、尖锐果酸、浓郁莓果风味。肯尼亚AA顶级稀有豆产地。',
      tags: ['火山土壤', '尖锐果酸', '浓郁莓果', '中等危险'],
      rewards: { gold: 100, reputation: 25 },
      itemWeights: {
        green_arabica: 25,
        green_tanzanian: 20,
        green_rwanda: 15,
        fruit_berry: 20,
        fruit_vanilla: 10,
        spice_cardamom: 10
      },
      rareItems: [
        { id: 'green_kenya_aa', name: '肯尼亚AA', chance: 0.6 }
      ],
      terrain: '火山',
      dangerLevel: 2,
      unlockRequirement: { reputation: 20 }
    },
    {
      id: 'tanzania_rwanda',
      name: '坦桑尼亚-卢旺达丛林',
      icon: '🌴',
      region: 'africa',
      regionName: '非洲产区',
      difficulty: 'medium',
      description: '坦桑尼亚与卢旺达交界地带，菠萝、柚子、红糖、柔和果香，以及樱桃、红莓、红酒发酵感。',
      tags: ['丛林', '柔和果香', '红酒发酵', '中等危险'],
      rewards: { gold: 80, reputation: 20 },
      itemWeights: {
        green_tanzanian: 30,
        green_rwanda: 25,
        green_arabica: 20,
        fruit_vanilla: 15,
        spice_cinnamon: 10
      },
      rareItems: [],
      terrain: '丛林',
      dangerLevel: 2,
      unlockRequirement: { reputation: 15 }
    },
    
    {
      id: 'colombia',
      name: '哥伦比亚云雾山谷',
      icon: '⛰️',
      region: 'south_america',
      regionName: '中南美洲产区',
      difficulty: 'easy',
      description: '哥伦比亚山谷与云雾森林，平衡柔和、坚果焦糖风味。焦糖、坚果、巧克力、柑橘、柔和酸感。',
      tags: ['云雾森林', '平衡柔和', '坚果焦糖', '新手友好'],
      rewards: { gold: 60, reputation: 12 },
      itemWeights: {
        green_colombian: 35,
        green_arabica: 20,
        green_brazilian: 15,
        fruit_orange: 15,
        spice_cinnamon: 10,
        milk_whole: 5
      },
      rareItems: [],
      terrain: '山谷',
      dangerLevel: 1,
      unlockRequirement: null
    },
    {
      id: 'brazil',
      name: '巴西平原农场',
      icon: '🌾',
      region: 'south_america',
      regionName: '中南美洲产区',
      difficulty: 'easy',
      description: '巴西广阔平原，烤坚果、可可、奶油、低酸、醇厚甜感。桑托斯稀有豆产地。',
      tags: ['平原农场', '低酸醇厚', '奶油甜感', '新手友好'],
      rewards: { gold: 55, reputation: 10 },
      itemWeights: {
        green_brazilian: 40,
        green_robusta: 20,
        green_colombian: 15,
        milk_whole: 15,
        spice_cinnamon: 10
      },
      rareItems: [
        { id: 'green_santos', name: '桑托斯', chance: 0.5 }
      ],
      terrain: '平原',
      dangerLevel: 1,
      unlockRequirement: null
    },
    {
      id: 'costarica_guatemala',
      name: '哥斯达黎加-危地马拉秘境',
      icon: '🌴',
      region: 'south_america',
      regionName: '中南美洲产区',
      difficulty: 'medium',
      description: '哥斯达黎加与危地马拉交界，蜂蜜、桃子、甘蔗、热带水果，以及火山土壤产出的烟熏、巧克力、黑樱桃。',
      tags: ['热带水果', '火山土壤', '烟熏巧克力', '中等危险'],
      rewards: { gold: 100, reputation: 25 },
      itemWeights: {
        green_costa_rica: 25,
        green_guatemala: 25,
        green_colombian: 15,
        fruit_vanilla: 15,
        fruit_berry: 10,
        spice_cinnamon: 10
      },
      rareItems: [],
      terrain: '丘陵',
      dangerLevel: 2,
      unlockRequirement: { reputation: 30 }
    },
    {
      id: 'panama',
      name: '巴拿马瑰夏秘境',
      icon: '🌸',
      region: 'south_america',
      regionName: '中南美洲产区',
      difficulty: 'hard',
      description: '传奇瑰夏产区，巴拿马迷雾秘境。栀子花、荔枝、芒果、兰花顶级花香果香。迷雾秘境宝箱掉落。',
      tags: ['传奇产区', '顶级花香', '瑰夏', '高危险'],
      rewards: { gold: 250, reputation: 60 },
      itemWeights: {
        green_arabica: 30,
        green_costa_rica: 20,
        green_guatemala: 15,
        fruit_vanilla: 15,
        milk_oat: 10,
        spice_cardamom: 10
      },
      rareItems: [
        { id: 'green_gesha_panama', name: '巴拿马瑰夏', chance: 0.3 }
      ],
      terrain: '秘境',
      dangerLevel: 3,
      unlockRequirement: { reputation: 80 }
    },
    
    {
      id: 'yunnan',
      name: '云南迷雾山林',
      icon: '🏔️',
      region: 'asia',
      regionName: '亚洲&大洋洲产区',
      difficulty: 'easy',
      description: '中国云南迷雾山林，国风山水。焦糖、红枣、坚果、淡淡蜜香，性价比极高的新手友好原料。',
      tags: ['国风山林', '新手友好', '性价比高', '焦糖蜜香'],
      rewards: { gold: 45, reputation: 8 },
      itemWeights: {
        green_yunnan: 45,
        green_arabica: 20,
        green_robusta: 15,
        milk_whole: 10,
        spice_cinnamon: 10
      },
      rareItems: [],
      terrain: '山林',
      dangerLevel: 1,
      unlockRequirement: null
    },
    {
      id: 'indonesia',
      name: '印尼群岛雨林',
      icon: '🏝️',
      region: 'asia',
      regionName: '亚洲&大洋洲产区',
      difficulty: 'medium',
      description: '印尼群岛（苏门答腊、爪哇、巴厘岛），雨林与潮湿沼泽。湿厚发酵处理，低酸重醇。泥土、草本、黑巧克力、檀香、烟草、枫糖。',
      tags: ['雨林沼泽', '湿厚发酵', '低酸重醇', '中等危险'],
      rewards: { gold: 90, reputation: 22 },
      itemWeights: {
        green_sumatra: 30,
        green_java: 20,
        green_bali: 15,
        green_robusta: 15,
        spice_cinnamon: 10,
        milk_whole: 10
      },
      rareItems: [],
      terrain: '雨林',
      dangerLevel: 2,
      unlockRequirement: { reputation: 25 }
    },
    {
      id: 'india',
      name: '印度香料丛林',
      icon: '🌶️',
      region: 'asia',
      regionName: '亚洲&大洋洲产区',
      difficulty: 'medium',
      description: '印度丛林，香料风极强。豆蔻、胡椒、木质调独特风味。',
      tags: ['香料风', '木质调', '独特风味', '中等危险'],
      rewards: { gold: 85, reputation: 20 },
      itemWeights: {
        green_indian: 35,
        green_robusta: 25,
        green_arabica: 15,
        spice_cardamom: 15,
        spice_cinnamon: 10
      },
      rareItems: [],
      terrain: '丛林',
      dangerLevel: 2,
      unlockRequirement: { reputation: 35 }
    },
    {
      id: 'papua',
      name: '巴布亚新几内亚浓雾',
      icon: '🌿',
      region: 'asia',
      regionName: '亚洲&大洋洲产区',
      difficulty: 'hard',
      description: '巴布亚新几内亚丛林浓雾，混合莓果、草药、奶油口感。神秘的大洋洲风味。',
      tags: ['丛林浓雾', '混合莓果', '草药奶油', '高危险'],
      rewards: { gold: 150, reputation: 40 },
      itemWeights: {
        green_papua: 30,
        green_arabica: 20,
        green_sumatra: 15,
        fruit_berry: 15,
        fruit_vanilla: 10,
        milk_oat: 10
      },
      rareItems: [
        { id: 'green_liberica', name: '利比利卡', chance: 0.15 }
      ],
      terrain: '浓雾',
      dangerLevel: 3,
      unlockRequirement: { reputation: 60 }
    },
    
    {
      id: 'jamaica',
      name: '牙买加蓝山孤岛',
      icon: '🏖️',
      region: 'island',
      regionName: '海岛特殊产区',
      difficulty: 'hard',
      description: '牙买加蓝山孤岛迷雾，海岛雾气+海风。带有海盐、椰子、奶油调性。限定海岛地图掉落。',
      tags: ['海岛迷雾', '海盐椰子', '奶油调性', '高危险'],
      rewards: { gold: 200, reputation: 50 },
      itemWeights: {
        green_arabica: 30,
        green_colombian: 20,
        green_brazilian: 15,
        milk_oat: 15,
        fruit_vanilla: 10,
        spice_cinnamon: 10
      },
      rareItems: [
        { id: 'green_blue_mountain', name: '牙买加蓝山', chance: 0.35 }
      ],
      terrain: '海岛',
      dangerLevel: 3,
      unlockRequirement: { reputation: 70 }
    },
    {
      id: 'hawaii',
      name: '夏威夷科纳海岸',
      icon: '🌺',
      region: 'island',
      regionName: '海岛特殊产区',
      difficulty: 'hard',
      description: '夏威夷科纳海岸雾带，海岛雾气+海风。带有海盐、椰子、奶油调性。限定海岛地图掉落。',
      tags: ['海岸雾带', '海盐椰子', '奶油调性', '高危险'],
      rewards: { gold: 200, reputation: 50 },
      itemWeights: {
        green_arabica: 30,
        green_colombian: 20,
        green_costa_rica: 15,
        milk_oat: 15,
        fruit_vanilla: 10,
        fruit_berry: 10
      },
      rareItems: [
        { id: 'green_kona', name: '夏威夷科纳', chance: 0.35 }
      ],
      terrain: '海岸',
      dangerLevel: 3,
      unlockRequirement: { reputation: 70 }
    }
  ],

  // ============================================
  // 工具商店数据
  // ============================================
  
  toolsShop: {
    highTempRoaster: {
      id: 'highTempRoaster',
      name: '高温烘焙机',
      icon: '🔥',
      description: '可进行深度烘焙，释放咖啡豆的浓郁风味',
      price: 200,
      unlocks: ['深度烘焙'],
      unlocked: false
    },
    espressoMachine: {
      id: 'espressoMachine',
      name: '意式浓缩机',
      icon: '☕',
      description: '高压快速萃取，制作浓郁的意式浓缩',
      price: 300,
      unlocks: ['意式浓缩'],
      unlocked: false
    },
    fineGrinder: {
      id: 'fineGrinder',
      name: '细研磨机',
      icon: '⚙️',
      description: '可进行细研磨，适合意式浓缩和摩卡壶',
      price: 150,
      unlocks: ['细研磨'],
      unlocked: false
    },
    advancedGrinder: {
      id: 'advancedGrinder',
      name: '高级研磨机',
      icon: '🔧',
      description: '专业级研磨机，支持极细和极粗研磨',
      price: 400,
      unlocks: ['极细研磨', '极粗研磨'],
      unlocked: false
    },
    fermentationChamber: {
      id: 'fermentationChamber',
      name: '厌氧发酵箱',
      icon: '🍇',
      description: '密封发酵环境，创造独特的葡萄、荔枝、烈酒风味',
      price: 350,
      unlocks: ['厌氧发酵处理'],
      unlocked: false
    },
    mokaPot: {
      id: 'mokaPot',
      name: '摩卡壶',
      icon: '☕',
      description: '蒸汽加压萃取，适合深烘豆子的浓醇焦香',
      price: 180,
      unlocks: ['摩卡壶萃取'],
      unlocked: false
    },
    brewingChamber: {
      id: 'brewingChamber',
      name: '炼金浸泡箱',
      icon: '🧪',
      description: '长时间密封浸泡发酵，产出独一无二的炼金特调咖啡',
      price: 500,
      unlocks: ['浸泡酿造'],
      unlocked: false
    }
  },

  // ============================================
  // 客人数据
  // ============================================
  
  customerTemplates: [
    {
      name: '咖啡爱好者小明',
      avatar: '👨',
      type: '爱好者',
      demands: [
        { tag: '果香', required: true },
        { tag: '花香', required: false }
      ],
      avoidTags: ['焦味'],
      basePrice: 50,
      reputation: 10
    },
    {
      name: '上班族小红',
      avatar: '👩',
      type: '上班族',
      demands: [
        { tag: '巧克力', required: true },
        { tag: '坚果', required: true }
      ],
      avoidTags: ['水感'],
      basePrice: 60,
      reputation: 15
    },
    {
      name: '退休老王',
      avatar: '👴',
      type: '传统派',
      demands: [
        { tag: '巧克力', required: true },
        { tag: '苦味', required: false }
      ],
      avoidTags: ['尖锐果酸'],
      basePrice: 45,
      reputation: 8
    },
    {
      name: '时尚博主',
      avatar: '👱‍♀️',
      type: '潮流派',
      demands: [
        { tag: '果香', required: true },
        { tag: '花香', required: true },
        { tag: '特色', required: false }
      ],
      avoidTags: ['焦味'],
      basePrice: 80,
      reputation: 20
    },
    {
      name: '健身教练',
      avatar: '💪',
      type: '健康派',
      demands: [
        { tag: '健康', required: true },
        { tag: '谷物', required: false }
      ],
      avoidTags: ['极致苦涩'],
      basePrice: 55,
      reputation: 12
    },
    {
      name: '甜品控',
      avatar: '🧁',
      type: '甜党',
      demands: [
        { tag: '甜感', required: true },
        { tag: '香草', required: true },
        { tag: '奶香', required: false }
      ],
      avoidTags: ['苦味'],
      basePrice: 70,
      reputation: 18
    },
    {
      name: '探险家',
      avatar: '🧭',
      type: '冒险家',
      demands: [
        { tag: '特色', required: true },
        { tag: '香料', required: true }
      ],
      avoidTags: ['平淡'],
      basePrice: 75,
      reputation: 25
    },
    {
      name: '意式迷',
      avatar: '🇮🇹',
      type: '意式爱好者',
      demands: [
        { tag: '意式', required: true },
        { tag: '浓郁', required: false }
      ],
      avoidTags: ['水感'],
      basePrice: 65,
      reputation: 16
    },
    {
      name: '手冲达人',
      avatar: '☕',
      type: '手冲爱好者',
      demands: [
        { tag: '手冲', required: true },
        { tag: '清晰', required: false }
      ],
      avoidTags: ['焦味'],
      basePrice: 70,
      reputation: 14
    }
  ],

  // 回头客故事按成功成交次数逐步解锁，偏好会继承上次喜欢的风味标签。
  customerStories: {
    '咖啡爱好者小明': ['第一次认真研究手冲风味。', '开始记录每次喝到的花果香。', '准备在咖啡节上推荐你的店。'],
    '上班族小红': ['想找一杯能撑过加班的咖啡。', '已经把这里当作固定补给站。', '带着同事一起来尝试新品。'],
    '退休老王': ['坚持寻找记忆里的传统味道。', '愿意尝试更平衡的深烘配方。', '讲起年轻时第一次喝咖啡的故事。'],
    '时尚博主': ['正在搜集有辨识度的新风味。', '开始持续关注你的新品。', '计划为咖啡节制作专题内容。'],
    '健身教练': ['寻找干净、轻负担的日常饮品。', '把健康配方推荐给了学员。', '希望与你合作设计训练特调。'],
    '甜品控': ['想让咖啡和甜点形成搭配。', '开始尝试减少糖浆、突出豆子甜感。', '准备带来自己的招牌甜点联名。'],
    '探险家': ['对陌生产区和奇特香料充满兴趣。', '把你的咖啡写进了旅行笔记。', '愿意提供一条传奇豆线索。'],
    '意式迷': ['正在寻找浓郁但不过焦的意式。', '认可了你的研磨与萃取稳定性。', '想在咖啡节挑战限定浓缩。'],
    '手冲达人': ['关注每一杯的洁净度和层次。', '开始与你交换冲煮参数。', '愿意担任咖啡节的客座评审。']
  },

  // 根据累计经验返回专精等级；三条路线共用同一套明确阈值。
  getSpecializationTier(track) {
    const xp = this.state.specializations?.[track] || 0;
    const thresholds = this.rules.specialization.thresholds;
    if (xp >= thresholds[2]) return 2;
    if (xp >= thresholds[1]) return 1;
    return 0;
  },

  // 增加指定路线经验，并在跨越等级阈值时给出即时反馈。
  gainSpecializationXp(track, amount) {
    if (!this.state.specializations || !Object.hasOwn(this.state.specializations, track)) return;
    const previousTier = this.getSpecializationTier(track);
    this.state.specializations[track] += Math.max(0, Math.round(amount));
    const currentTier = this.getSpecializationTier(track);
    if (currentTier > previousTier) {
      const trackNames = { exploration: '探索', roasting: '烘焙', business: '经营' };
      const rankName = this.rules.specialization.rankNames[currentTier];
      this.addMessage(`🏅 ${trackNames[track]}专精晋升为${rankName}！`, 'success');
    }
  },

  // 探索专精提高样品保护格，但不增加行动力，确保每次远征仍处于12—16点预算内。
  getProtectedCapacity() {
    return this.rules.exploration.protectedCapacity + this.getSpecializationTier('exploration');
  },

  // ============================================
  // 动态物品创建函数
  // ============================================
  
  createProcessedBean(greenBean, processMethodId) {
    const process = this.processMethods.find(p => p.id === processMethodId) || this.processMethods[0];
    
    let tags = [...greenBean.tags];
    
    if (process.removeTags && process.removeTags.length > 0) {
      process.removeTags.forEach(rt => {
        tags = tags.filter(t => t !== rt);
      });
    }
    
    if (process.addedTags && process.addedTags.length > 0) {
      process.addedTags.forEach(at => {
        if (!tags.includes(at)) {
          tags.push(at);
        }
      });
    }
    
    process.tags.forEach(pt => {
      if (!tags.includes(pt)) {
        tags.push(pt);
      }
    });
    
    if (greenBean.origin && !tags.includes(greenBean.origin)) {
      tags.push(greenBean.origin);
    }
    
    return {
      id: `processed_${greenBean.id}_${processMethodId}_${Date.now()}`,
      baseId: greenBean.id,
      name: `[${process.name}] ${greenBean.name}`,
      type: 'green_bean',
      icon: process.icon,
      description: `使用${process.name}处理的${greenBean.name}`,
      origin: greenBean.origin,
      rarity: greenBean.rarity,
      processMethod: processMethodId,
      isProcessed: true,
      qualityBonus: process.qualityBonus || 0,
      tags: tags,
      baseGreenBean: greenBean,
      processInfo: process
    };
  },
  
  createRoastedBean(greenBean, roastLevel) {
    const roast = this.roastLevels.find(r => r.id === roastLevel) || this.roastLevels[1];
    
    let tags = [...greenBean.tags];
    
    if (roast.removeTags && roast.removeTags.length > 0) {
      roast.removeTags.forEach(rt => {
        tags = tags.filter(t => t !== rt);
      });
    }
    
    roast.tags.forEach(rt => {
      if (!tags.includes(rt)) {
        tags.push(rt);
      }
    });
    
    if (greenBean.origin && !tags.includes(greenBean.origin)) {
      tags.push(greenBean.origin);
    }
    
    return {
      id: `roasted_${greenBean.id}_${roastLevel}_${Date.now()}`,
      baseId: greenBean.id,
      name: `${roast.name} ${greenBean.name.replace('生豆', '')}`,
      type: 'roasted_bean',
      icon: roast.icon,
      description: `使用${roast.name}烘焙的${greenBean.name}`,
      origin: greenBean.origin,
      rarity: greenBean.rarity,
      roastLevel: roastLevel,
      processMethod: greenBean.processMethod,
      qualityBonus: greenBean.qualityBonus || 0,
      tags: tags,
      baseGreenBean: greenBean,
      roastInfo: roast
    };
  },

  createCoffeePowder(roastedBean, grindLevel) {
    const grind = this.grindLevels.find(g => g.id === grindLevel) || this.grindLevels[1];
    
    let tags = [...roastedBean.tags];
    
    grind.tags.forEach(gt => {
      if (!tags.includes(gt)) {
        tags.push(gt);
      }
    });
    
    return {
      id: `powder_${roastedBean.id}_${grindLevel}_${Date.now()}`,
      baseId: roastedBean.id,
      name: `${grind.name} ${roastedBean.name.replace('烘焙', '')}粉`,
      type: 'coffee_powder',
      icon: grind.icon,
      description: `使用${grind.name}研磨的${roastedBean.name}`,
      origin: roastedBean.origin,
      rarity: roastedBean.rarity,
      roastLevel: roastedBean.roastLevel,
      grindLevel: grindLevel,
      processMethod: roastedBean.processMethod,
      qualityBonus: roastedBean.qualityBonus || 0,
      tags: tags,
      baseRoastedBean: roastedBean,
      grindInfo: grind
    };
  },

  createCoffeeLiquid(powder, brewMethod) {
    const brew = this.brewMethods.find(b => b.id === brewMethod) || this.brewMethods[1];
    
    let tags = [...powder.tags];
    
    if (brew.removeTags && brew.removeTags.length > 0) {
      brew.removeTags.forEach(rt => {
        tags = tags.filter(t => t !== rt);
      });
    }
    
    if (brew.addedTags && brew.addedTags.length > 0) {
      brew.addedTags.forEach(at => {
        if (!tags.includes(at)) {
          tags.push(at);
        }
      });
    }
    
    brew.tags.forEach(bt => {
      if (!tags.includes(bt)) {
        tags.push(bt);
      }
    });
    
    if (brew.textureBonus && !tags.includes(brew.textureBonus)) {
      const texture = this.flavorTextures[brew.textureBonus];
      if (texture) {
        tags.push(texture.name);
      }
    }
    
    return {
      id: `liquid_${powder.id}_${brewMethod}_${Date.now()}`,
      baseId: powder.id,
      name: `${brew.name} ${powder.name.replace('粉', '')}`,
      type: 'coffee_liquid',
      icon: brew.icon,
      description: `使用${brew.name}方式萃取的咖啡液`,
      origin: powder.origin,
      rarity: powder.rarity,
      roastLevel: powder.roastLevel,
      grindLevel: powder.grindLevel,
      brewMethod: brewMethod,
      processMethod: powder.processMethod,
      qualityBonus: powder.qualityBonus || 0,
      tags: tags,
      basePowder: powder,
      brewInfo: brew
    };
  },

  // 根据原料标签和完整工艺链生成六维风味，作为最终评分和玩家反馈的共同依据。
  buildFlavorProfile(coffeeLiquid, additives, tags) {
    const profile = {
      acidity: 2,
      sweetness: 2,
      aroma: 2,
      body: 2,
      bitterness: 2,
      cleanliness: 2
    };
    const tagEffects = [
      { tags: ['果香', '柑橘', '莓果', '热带水果', '蓝莓', '草莓', '芒果', '荔枝', '樱桃'], effects: { acidity: 1.2, aroma: 1.4 } },
      { tags: ['花香', '茉莉', '兰花', '桂花', '栀子花'], effects: { aroma: 1.8, cleanliness: 0.5 } },
      { tags: ['甜感', '蜂蜜甜', '焦糖', '蜜糖', '红糖', '奶油甜'], effects: { sweetness: 1.5, body: 0.3 } },
      { tags: ['坚果', '巧克力', '可可', '烤坚果'], effects: { body: 1.1, bitterness: 0.5 } },
      { tags: ['苦味', '焦味', '烟熏', '极致苦涩'], effects: { bitterness: 1.5, cleanliness: -0.8 } },
      { tags: ['干净', '清晰', '清爽', '干净通透'], effects: { cleanliness: 1.6, body: -0.2 } },
      { tags: ['醇厚', '浓郁', '浓稠', '油脂饱满'], effects: { body: 1.5, bitterness: 0.3 } },
      { tags: ['香料', '香草', '肉桂', '豆蔻'], effects: { aroma: 1.0, sweetness: 0.5 } }
    ];

    tags.forEach(tag => {
      tagEffects.forEach(group => {
        if (!group.tags.some(keyword => tag.includes(keyword))) return;
        Object.entries(group.effects).forEach(([dimension, value]) => {
          profile[dimension] += value;
        });
      });
    });

    const processAdjustments = {
      washed: { cleanliness: 1.5, acidity: 0.5 },
      natural: { sweetness: 1.5, aroma: 1 },
      honey: { sweetness: 2, body: 0.5 },
      anaerobic: { aroma: 2, body: 0.8, cleanliness: -0.8 },
      wet_hulled: { body: 1.5, bitterness: 0.5, cleanliness: -0.5 }
    };
    const roastAdjustments = {
      light: { acidity: 1.2, aroma: 1, body: -0.5, bitterness: -0.5 },
      medium: { sweetness: 1.2, body: 0.8 },
      dark: { body: 1.5, bitterness: 2, acidity: -1.5, aroma: -1 }
    };
    const grindAdjustments = {
      extra_coarse: { cleanliness: 0.8, body: -1, bitterness: -0.5 },
      coarse: { cleanliness: 0.6, body: -0.5 },
      medium: { sweetness: 0.3, cleanliness: 0.3 },
      fine: { body: 1.2, bitterness: 0.5, cleanliness: -0.5 },
      extra_fine: { body: 1.5, bitterness: 1, cleanliness: -1 }
    };
    const brewAdjustments = {
      espresso: { body: 1.8, bitterness: 1, cleanliness: -0.5 },
      pour_over: { acidity: 0.8, aroma: 1, cleanliness: 1.5 },
      french_press: { body: 1.5, cleanliness: -0.8 },
      cold_brew: { sweetness: 1.2, bitterness: -0.8, cleanliness: 0.5 },
      moka_pot: { body: 1.8, bitterness: 1.5 },
      turkish: { body: 1.5, bitterness: 2, cleanliness: -1.2 },
      immersion_brew: { sweetness: 0.8, aroma: 1.5, body: 1 }
    };

    [
      processAdjustments[coffeeLiquid.processMethod],
      roastAdjustments[coffeeLiquid.roastLevel],
      grindAdjustments[coffeeLiquid.grindLevel],
      brewAdjustments[coffeeLiquid.brewMethod]
    ].filter(Boolean).forEach(adjustments => {
      Object.entries(adjustments).forEach(([dimension, value]) => {
        profile[dimension] += value;
      });
    });

    if (additives.length >= 3) {
      profile.cleanliness -= 1.5;
    }

    Object.keys(profile).forEach(dimension => {
      profile[dimension] = Math.round(Math.max(0, Math.min(10, profile[dimension])) * 10) / 10;
    });
    return profile;
  },

  // 计算工艺品质并返回逐项依据；错误研磨、错误烘焙和配料过载会产生可见缺陷。
  calculateCoffeeQuality(coffeeLiquid, additives, flavorProfile) {
    const brew = this.brewMethods.find(method => method.id === coffeeLiquid.brewMethod);
    const defects = [];
    const breakdown = [];
    let score = this.rules.quality.baseScore;

    const processBonus = (coffeeLiquid.qualityBonus || 0) * 2;
    score += processBonus;
    if (processBonus > 0) breakdown.push({ label: '处理法', value: processBonus });

    if (brew?.recommendedGrinds?.includes(coffeeLiquid.grindLevel)) {
      score += 12;
      breakdown.push({ label: '研磨与萃取匹配', value: 12 });
    } else if (brew?.recommendedGrinds?.length) {
      score -= 14;
      defects.push(coffeeLiquid.grindLevel === 'fine' || coffeeLiquid.grindLevel === 'extra_fine' ? '过萃苦涩' : '水感');
      breakdown.push({ label: '研磨失配', value: -14 });
    }

    if (brew?.recommendedRoasts?.includes(coffeeLiquid.roastLevel)) {
      score += 6;
      breakdown.push({ label: '烘焙与萃取匹配', value: 6 });
    } else if (brew?.recommendedRoasts?.length) {
      score -= 8;
      defects.push(coffeeLiquid.roastLevel === 'dark' ? '焦味' : '烘焙失配');
      breakdown.push({ label: '烘焙失配', value: -8 });
    }

    if (additives.length === 1) {
      score += 3;
      breakdown.push({ label: '配料协调', value: 3 });
    } else if (additives.length === 2) {
      score += 5;
      breakdown.push({ label: '配料层次', value: 5 });
    } else if (additives.length >= 3) {
      score -= 6;
      defects.push('风味过载');
      breakdown.push({ label: '配料过载', value: -6 });
    }

    const hasFloralFruit = coffeeLiquid.tags.some(tag => ['花香', '果香', '柑橘', '莓果', '热带水果'].some(keyword => tag.includes(keyword)));
    if (coffeeLiquid.roastLevel === 'dark' && hasFloralFruit) {
      score -= 6;
      defects.push('花果香衰减');
      breakdown.push({ label: '深烘损失花果香', value: -6 });
    }

    const roastingTier = this.getSpecializationTier('roasting');
    if (roastingTier > 0) {
      const masteryBonus = roastingTier * 3;
      score += masteryBonus;
      breakdown.push({ label: '烘焙专精', value: masteryBonus });
    }

    const dominantValues = Object.values(flavorProfile).filter(value => value >= 5).length;
    if (dominantValues >= 2 && dominantValues <= 4) {
      score += 5;
      breakdown.push({ label: '风味结构', value: 5 });
    } else if (dominantValues > 4) {
      score -= 5;
      defects.push('风味混杂');
      breakdown.push({ label: '风味混杂', value: -5 });
    }

    score = Math.round(Math.max(this.rules.quality.minScore, Math.min(this.rules.quality.maxScore, score)));
    return { score, defects: [...new Set(defects)], breakdown };
  },

  // 将六维风味压缩为最突出的三项，避免结果界面再次退化为冗长标签列表。
  formatFlavorProfile(flavorProfile) {
    const names = {
      acidity: '酸质',
      sweetness: '甜感',
      aroma: '香气',
      body: '醇厚',
      bitterness: '苦度',
      cleanliness: '洁净度'
    };
    return Object.entries(flavorProfile)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([dimension, value]) => `${names[dimension]} ${value}`)
      .join('、');
  },

  // 从六维数值中为最高的三个维度选择一个真实来源标签，作为玩家最终看到的主风味。
  selectMainFlavorTags(sourceTags, flavorProfile) {
    const candidates = {
      acidity: ['尖锐果酸', '明亮酸', '柑橘', '莓果', '果香', '酸甜', '低酸'],
      sweetness: ['蜂蜜甜', '焦糖甜', '焦糖', '甜感', '蜜香', '奶油甜'],
      aroma: ['花香', '果香', '香料', '香草', '茉莉', '兰花', '烟熏'],
      body: ['醇厚', '浓郁', '油脂饱满', '巧克力', '坚果', '浓稠'],
      bitterness: ['极致苦涩', '焦味', '苦味', '烟熏苦'],
      cleanliness: ['干净通透', '清晰', '干净', '清爽', '平衡']
    };
    const fallback = { acidity: '明亮酸质', sweetness: '自然甜感', aroma: '复合香气', body: '圆润醇厚', bitterness: '平衡苦度', cleanliness: '洁净余韵' };

    const selected = [];
    Object.entries(flavorProfile)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .forEach(([dimension]) => {
        const sourceMatch = candidates[dimension].find(candidate => !selected.includes(candidate) && sourceTags.some(tag => tag.includes(candidate)));
        selected.push(sourceMatch || fallback[dimension]);
      });
    return selected;
  },

  // 将稀有度与创新独立为20分结算项，避免它们被隐藏在工艺品质分中。
  calculateRarityInnovation(coffeeLiquid, additives) {
    const rarityPoints = { common: 2, uncommon: 5, rare: 8, epic: 10, legendary: 12 }[coffeeLiquid.rarity] || 2;
    const reasons = [`${coffeeLiquid.rarity || 'common'}原料 +${rarityPoints}`];
    let innovationPoints = Math.min(4, new Set(additives.map(additive => additive.id)).size * 2);

    if (['anaerobic', 'honey', 'wet_hulled'].includes(coffeeLiquid.processMethod)) {
      innovationPoints += 2;
      reasons.push('特色处理法 +2');
    }
    if (['moka_pot', 'turkish', 'immersion_brew'].includes(coffeeLiquid.brewMethod)) {
      innovationPoints += 2;
      reasons.push('特色萃取 +2');
    }
    innovationPoints = Math.min(8, innovationPoints);
    if (additives.length > 0) reasons.push(`配方创新 +${Math.min(4, new Set(additives.map(additive => additive.id)).size * 2)}`);

    return { score: Math.min(20, rarityPoints + innovationPoints), rarityPoints, innovationPoints, reasons };
  },

  createFinishedCoffee(coffeeLiquid, additives) {
    const allTags = [...coffeeLiquid.tags];
    
    additives.forEach(additive => {
      additive.tags.forEach(t => {
        if (!allTags.includes(t)) {
          allTags.push(t);
        }
      });
    });
    
    const flavorProfile = this.buildFlavorProfile(coffeeLiquid, additives, allTags);
    const qualityResult = this.calculateCoffeeQuality(coffeeLiquid, additives, flavorProfile);
    const mainFlavorTags = this.selectMainFlavorTags(allTags, flavorProfile);
    const brewIdentity = {
      espresso: '意式',
      pour_over: '手冲',
      french_press: '法压',
      cold_brew: '冷萃',
      moka_pot: '摩卡',
      turkish: '土耳其',
      immersion_brew: '特色'
    }[coffeeLiquid.brewMethod];
    const additiveIdentity = additives
      .flatMap(additive => additive.tags)
      .filter(tag => ['健康', '谷物', '奶香', '香草', '香料', '特色'].includes(tag));
    const matchingTags = [...new Set([...mainFlavorTags, brewIdentity, ...additiveIdentity].filter(Boolean))].slice(0, 6);
    const rarityInnovation = this.calculateRarityInnovation(coffeeLiquid, additives);
    const name = this.generateCoffeeName(coffeeLiquid, additives, allTags);
    const score = qualityResult.score;
    const basePrice = 30 + score;
    
    return {
      id: `coffee_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name,
      tags: matchingTags,
      sourceTags: allTags,
      mainFlavorTags: mainFlavorTags,
      score: score,
      price: basePrice,
      flavorProfile: flavorProfile,
      defects: qualityResult.defects,
      scoreBreakdown: qualityResult.breakdown,
      rarityInnovation: rarityInnovation,
      rarity: coffeeLiquid.rarity,
      processMethod: coffeeLiquid.processMethod,
      origin: coffeeLiquid.origin,
      roastLevel: coffeeLiquid.roastLevel,
      grindLevel: coffeeLiquid.grindLevel,
      brewMethod: coffeeLiquid.brewMethod,
      baseLiquid: coffeeLiquid,
      additives: [...additives],
      description: `${this.generateCoffeeDescription(coffeeLiquid, additives, allTags)} 主风味：${this.formatFlavorProfile(flavorProfile)}。`
    };
  },

  generateCoffeeName(coffeeLiquid, additives, tags) {
    let prefix = '';
    let middle = '';
    let suffix = '';
    
    if (tags.includes('浅烘')) {
      prefix = '浅烘';
    } else if (tags.includes('深烘')) {
      prefix = '深烘';
    } else {
      prefix = '中烘';
    }
    
    if (coffeeLiquid.origin) {
      middle = coffeeLiquid.origin;
    }
    
    if (additives.length > 0) {
      const firstAdditive = additives[0];
      if (firstAdditive.tags.includes('香草')) {
        suffix = '香草';
      } else if (firstAdditive.tags.includes('奶香')) {
        suffix = '拿铁';
      } else if (firstAdditive.tags.includes('谷物')) {
        suffix = '燕麦特调';
      } else if (firstAdditive.tags.includes('香料')) {
        suffix = '香料特调';
      } else if (firstAdditive.tags.includes('果香')) {
        suffix = '果味特调';
      }
    }
    
    if (tags.includes('意式')) {
      if (!suffix) suffix = '浓缩';
    } else if (tags.includes('手冲')) {
      if (!suffix) suffix = '手冲';
    } else if (tags.includes('冷萃')) {
      if (!suffix) suffix = '冷萃';
    }
    
    if (!suffix) {
      const defaultNames = ['黑咖啡', '美式', '特调'];
      suffix = defaultNames[Math.floor(Math.random() * defaultNames.length)];
    }
    
    if (middle) {
      return `${prefix}${middle}${suffix}`;
    }
    return `${prefix}${suffix}`;
  },

  generateCoffeeDescription(coffeeLiquid, additives, tags) {
    const parts = [];
    
    if (coffeeLiquid.origin) {
      parts.push(`源自${coffeeLiquid.origin}`);
    }
    
    if (coffeeLiquid.roastLevel === 'light') {
      parts.push('浅度烘焙');
    } else if (coffeeLiquid.roastLevel === 'dark') {
      parts.push('深度烘焙');
    } else {
      parts.push('中度烘焙');
    }
    
    if (coffeeLiquid.brewMethod === 'espresso') {
      parts.push('意式萃取');
    } else if (coffeeLiquid.brewMethod === 'cold_brew') {
      parts.push('冷萃工艺');
    } else {
      parts.push('手冲萃取');
    }
    
    if (additives.length > 0) {
      parts.push(`添加了${additives.length}种配料`);
    }
    
    const positiveTags = tags.filter(t => 
      ['果香', '花香', '甜感', '坚果', '巧克力', '香草', '奶香', '特色', '平衡', '清晰', '浓郁'].includes(t)
    );
    if (positiveTags.length > 0) {
      parts.push(`带有${positiveTags.slice(0, 3).join('、')}风味`);
    }
    
    return parts.join('，') + '。';
  },

  // ============================================
  // 工具函数
  // ============================================
  
  addMessage(text, type = 'info') {
    this.messages.push({ text, type, time: Date.now() });
    if (this.messages.length > 100) {
      this.messages.shift();
    }
    this.renderMessages();
  },
  
  renderMessages() {
    const containers = ['explore-messages', 'workshop-messages'];
    containers.forEach(containerId => {
      const container = document.getElementById(containerId);
      if (!container) return;
      
      container.innerHTML = '';
      this.messages.slice(-15).forEach(msg => {
        const el = document.createElement('div');
        el.className = `message ${msg.type}`;
        el.textContent = msg.text;
        container.appendChild(el);
      });
      container.scrollTop = container.scrollHeight;
    });
  },
  
  getRandomItem(weights) {
    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    
    for (const [itemId, weight] of Object.entries(weights)) {
      random -= weight;
      if (random <= 0) {
        return this.baseItems[itemId];
      }
    }
    
    const firstId = Object.keys(weights)[0];
    return this.baseItems[firstId];
  },

  // ============================================
  // 场景管理
  // ============================================
  
  showScene(sceneId) {
    const scenes = ['main-menu', 'map-select-scene', 'explore-scene', 'processing-scene', 'workshop-scene', 'shop-scene'];
    scenes.forEach(id => {
      document.getElementById(id).classList.add('hidden');
    });
    
    const targetScene = document.getElementById(sceneId);
    if (targetScene) {
      targetScene.classList.remove('hidden');
      targetScene.classList.add('fade-in');
    }
    
    this.state.currentScene = sceneId;
    this.updateSceneUI(sceneId);
  },
  
  updateSceneUI(sceneId) {
    switch (sceneId) {
      case 'map-select-scene':
        this.generateCustomers();
        this.renderDailyOrders();
        this.renderMapCards();
        this.updateMenuStats();
        const startButton = document.getElementById('start-explore-btn');
        if (startButton) {
          const travelCost = this.getTravelCost();
          startButton.disabled = !this.state.selectedMap || this.state.gold < travelCost;
          startButton.textContent = this.state.selectedMap ? `🚀 开始探索（旅行费 ${travelCost} 金币）` : '🚀 开始探索';
        }
        break;
      case 'explore-scene':
        this.renderExploreMap();
        this.renderExploreInventory();
        break;
      case 'processing-scene':
        this.renderProcessingInventory();
        this.updateProcessingStats();
        this.renderProcessingOptions();
        break;
      case 'workshop-scene':
        this.renderWorkshopInventory();
        this.renderCoffeeInventory();
        this.updateWorkshopStats();
        this.renderAdditivesOptions();
        break;
      case 'shop-scene':
        this.generateCustomers();
        this.renderShopCoffeeInventory();
        this.updateShopStats();
        break;
    }
    this.renderProgressSummary();
  },

  // 为旧存档补齐成长系统字段，保证新增图鉴、专精与节日目标可以平滑加载。
  ensureProgressState() {
    this.state.explorationSupplies ??= 2;
    this.state.specializations = {
      exploration: 0,
      roasting: 0,
      business: 0,
      ...(this.state.specializations || {})
    };
    const savedCollection = this.state.collection || {};
    this.state.collection = {
      beans: savedCollection.beans || {},
      recipes: savedCollection.recipes || {}
    };
    this.state.customerHistory ||= {};
    this.state.completedCommissions ??= 0;
    const savedFestival = this.state.festival || {};
    const festivalResults = { ...(savedFestival.results || {}) };
    if (savedFestival.result && savedFestival.evaluatedDay) {
      const legacyMilestone = this.rules.festival.milestones.find(milestone => milestone.targetDay === savedFestival.evaluatedDay)
        || this.rules.festival.milestones[0];
      festivalResults[legacyMilestone.id] ||= savedFestival.result;
    }
    this.state.festival = { results: festivalResults };
  },

  // 记录首次发现与累计采集次数，作为咖啡豆图鉴和传奇收藏进度的权威数据。
  recordBeanDiscovery(item, count = 1) {
    if (!item || item.type !== 'green_bean') return;
    this.ensureProgressState();
    const existing = this.state.collection.beans[item.id] || { firstDay: this.state.day, count: 0 };
    existing.count += count;
    this.state.collection.beans[item.id] = existing;
  },

  // 以原料、处理、烘焙、研磨、萃取和配料组合生成稳定的配方笔记键。
  getRecipeSignature(coffee) {
    return [
      coffee.origin || '未知产区',
      coffee.processMethod || '未处理',
      coffee.roastLevel || '未知烘焙',
      coffee.grindLevel || '未知研磨',
      coffee.brewMethod || '未知萃取',
      ...(coffee.additives || []).map(additive => additive.id).sort()
    ].join('|');
  },

  // 将已完成咖啡写入配方笔记，并保留该配方的最高品质与制作次数。
  recordRecipe(coffee) {
    if (!coffee) return;
    this.ensureProgressState();
    const signature = this.getRecipeSignature(coffee);
    const existing = this.state.collection.recipes[signature] || {
      name: coffee.name,
      firstDay: this.state.day,
      times: 0,
      bestScore: 0,
      mainFlavors: coffee.mainFlavorTags || []
    };
    existing.times++;
    if (coffee.score >= existing.bestScore) {
      existing.name = coffee.name;
      existing.bestScore = coffee.score;
      existing.mainFlavors = coffee.mainFlavorTags || [];
      existing.defects = coffee.defects || [];
    }
    this.state.collection.recipes[signature] = existing;
  },

  // 返回下一个未结算的7日或14日咖啡节目标，供地图页、成长档案与跨天结算共同使用。
  getFestivalProgress() {
    this.ensureProgressState();
    const recipeCount = Object.keys(this.state.collection.recipes).length;
    const milestone = this.rules.festival.milestones.find(item => !this.state.festival.results[item.id])
      || this.rules.festival.milestones[this.rules.festival.milestones.length - 1];
    return {
      id: milestone.id,
      name: milestone.name,
      day: this.state.day,
      targetDay: milestone.targetDay,
      reputation: this.state.reputation,
      reputationGoal: milestone.reputationGoal,
      recipes: recipeCount,
      recipeGoal: milestone.recipeGoal,
      rewardGold: milestone.rewardGold,
      ready: this.state.reputation >= milestone.reputationGoal && recipeCount >= milestone.recipeGoal,
      result: this.state.festival.results[milestone.id] || null
    };
  },

  // 在第7日和第14日分别评估阶段目标；跨版本读档时也会补结算已经到期的节点。
  evaluateFestival() {
    this.ensureProgressState();
    const recipeCount = Object.keys(this.state.collection.recipes).length;
    const dueMilestones = this.rules.festival.milestones.filter(milestone => (
      this.state.day >= milestone.targetDay && !this.state.festival.results[milestone.id]
    ));
    let latestResult = null;
    dueMilestones.forEach(milestone => {
      const ready = this.state.reputation >= milestone.reputationGoal && recipeCount >= milestone.recipeGoal;
      latestResult = ready ? 'success' : 'failed';
      this.state.festival.results[milestone.id] = latestResult;
      if (ready) {
        this.state.gold += milestone.rewardGold;
        this.addMessage(`🏆 ${milestone.name}挑战成功！获得 ${milestone.rewardGold} 金币。`, 'success');
      } else {
        this.addMessage(`📋 ${milestone.name}未达标：声望 ${this.state.reputation}/${milestone.reputationGoal}，配方 ${recipeCount}/${milestone.recipeGoal}。`, 'danger');
      }
    });
    return latestResult;
  },

  // 根据地图难度返回本次旅行费用，形成探索选择中的持续金币消耗。
  getTravelCost(map = this.state.selectedMap) {
    return this.rules.economy.travelCostByDifficulty[map?.difficulty] || 0;
  },

  // 每日维护费用由基础店务和已拥有设备构成，设备越多经营成本越高。
  getMaintenanceCost() {
    const ownedTools = Object.values(this.state.tools || {}).filter(Boolean).length;
    return this.rules.economy.maintenanceBaseCost + ownedTools * this.rules.economy.maintenancePerTool;
  },

  // 为选定地区生成当日委托；目标限定为该地图能够采集的咖啡豆。
  createMapCommission(map) {
    const candidateIds = Object.keys(map.itemWeights).filter(itemId => this.baseItems[itemId]?.type === 'green_bean');
    const itemId = candidateIds[(this.state.day - 1) % Math.max(1, candidateIds.length)];
    const dangerLevel = map.dangerLevel || 1;
    this.state.activeCommission = {
      day: this.state.day,
      mapId: map.id,
      itemId,
      targetCount: 2,
      rewardGold: 15 + dangerLevel * 10,
      rewardReputation: 3 + dangerLevel * 2,
      status: 'active'
    };
    return this.state.activeCommission;
  },

  // 结算地区委托；只有安全撤离并带回足量目标素材才发放额外奖励。
  settleActiveCommission(unsafe) {
    const commission = this.state.activeCommission;
    if (!commission || commission.day !== this.state.day || commission.status !== 'active') return null;
    const collectedCount = this.exploreState.collectedItemIds.filter(itemId => itemId === commission.itemId).length;
    commission.collectedCount = collectedCount;
    if (!unsafe && collectedCount >= commission.targetCount) {
      commission.status = 'completed';
      this.state.gold += commission.rewardGold;
      this.state.reputation += commission.rewardReputation;
      this.state.completedCommissions++;
      this.addMessage(`📜 地区委托完成，额外获得 ${commission.rewardGold} 金币和 ${commission.rewardReputation} 声望！`, 'success');
    } else {
      commission.status = 'failed';
      this.addMessage(`📜 地区委托未完成：带回 ${collectedCount}/${commission.targetCount} 件目标素材。`, 'warning');
    }
    return commission.status;
  },

  // 打开成长档案，集中展示图鉴、配方、专精、委托、回头客与咖啡节目标。
  showProgressHub() {
    this.renderProgressHub();
    document.getElementById('progress-modal')?.classList.remove('hidden');
  },

  // 关闭成长档案弹窗。
  hideProgressHub() {
    document.getElementById('progress-modal')?.classList.add('hidden');
  },

  // 渲染地图页的长期目标摘要，避免玩家只有当日订单而没有中期方向。
  renderProgressSummary() {
    const container = document.getElementById('progress-summary');
    if (!container) return;
    const festival = this.getFestivalProgress();
    const commission = this.state.activeCommission;
    const commissionItem = commission ? this.baseItems[commission.itemId] : null;
    const ranks = ['exploration', 'roasting', 'business'].map(track => this.rules.specialization.rankNames[this.getSpecializationTier(track)]);
    container.innerHTML = `
      <div><strong>🏆 咖啡节</strong><span>第${festival.targetDay}天 · 声望 ${festival.reputation}/${festival.reputationGoal} · 配方 ${festival.recipes}/${festival.recipeGoal}</span></div>
      <div><strong>🏅 三线专精</strong><span>探索${ranks[0]} · 烘焙${ranks[1]} · 经营${ranks[2]}</span></div>
      <div><strong>📚 收藏</strong><span>${Object.keys(this.state.collection.beans).length}种豆 · ${festival.recipes}份配方 · ${this.state.completedCommissions}项委托</span></div>
      <div><strong>📜 地区委托</strong><span>${commission?.status === 'active' ? `带回 ${commission.targetCount} 份${commissionItem?.name || '目标素材'}` : '选择地区后生成'}</span></div>
    `;
  },

  // 渲染成长档案详细内容，并将传奇收藏与回头客故事单独列出。
  renderProgressHub() {
    const container = document.getElementById('progress-content');
    if (!container) return;
    this.ensureProgressState();
    const festival = this.getFestivalProgress();
    const beans = Object.entries(this.state.collection.beans)
      .map(([itemId, record]) => ({ item: this.baseItems[itemId], record }))
      .filter(entry => entry.item);
    const legendaryTotal = Object.values(this.baseItems).filter(item => item.type === 'green_bean' && item.rarity === 'legendary').length;
    const legendaryFound = beans.filter(entry => entry.item.rarity === 'legendary').length;
    const recipes = Object.values(this.state.collection.recipes).sort((a, b) => b.bestScore - a.bestScore);
    const returningCustomers = Object.entries(this.state.customerHistory).filter(([, history]) => history.successfulOrders > 0);
    const trackNames = { exploration: '探索', roasting: '烘焙', business: '经营' };

    container.innerHTML = `
      <section><h3>🏆 咖啡节阶段目标</h3><p>${festival.name}（第 ${festival.targetDay} 天）· 当前第 ${festival.day} 天 · 声望 ${festival.reputation}/${festival.reputationGoal} · 配方 ${festival.recipes}/${festival.recipeGoal} · ${festival.result || (festival.ready ? '已具备参赛资格' : '准备中')}</p><div class="progress-tags">${this.rules.festival.milestones.map(milestone => `<span>第${milestone.targetDay}天：${this.state.festival.results[milestone.id] || '未结算'}</span>`).join('')}</div></section>
      <section><h3>🏅 专精路线</h3><div class="progress-list">${Object.entries(this.state.specializations).map(([track, xp]) => `<span>${trackNames[track]}：${this.rules.specialization.rankNames[this.getSpecializationTier(track)]}（${xp} XP）</span>`).join('')}</div></section>
      <section><h3>🫘 咖啡图鉴</h3><p>已发现 ${beans.length} 种；传奇豆 ${legendaryFound}/${legendaryTotal}</p><div class="progress-tags">${beans.map(({ item, record }) => `<span>${item.icon} ${item.name} ×${record.count}</span>`).join('') || '<span>尚未发现</span>'}</div></section>
      <section><h3>📝 配方笔记</h3><div class="progress-list">${recipes.slice(0, 8).map(recipe => `<span>${recipe.name} · 最高${recipe.bestScore}分 · ${(recipe.mainFlavors || []).join('、')}</span>`).join('') || '<span>完成并存入第一杯咖啡后自动记录</span>'}</div></section>
      <section><h3>💰 经营成本</h3><p>下次日结维护费 ${this.getMaintenanceCost()} 金币；旅行费按地区为 10/20/35 金币；远征工具 ${this.rules.economy.explorationSupplyCost} 金币/份，当前 ${this.state.explorationSupplies} 份。</p></section>
      <section><h3>🤝 回头客故事</h3><div class="progress-list">${returningCustomers.map(([name, history]) => `<span>${name} · 成功接待${history.successfulOrders}次 · 偏好${history.favoriteTag || '待发现'}</span>`).join('') || '<span>高匹配成交后，顾客会带着新的偏好再次来访</span>'}</div></section>
    `;
  },

  // 将包含 Set 的发现记录转换为可写入 localStorage 的普通数组结构。
  serializeDiscovered(discovered) {
    return Object.fromEntries(Object.entries(discovered || {}).map(([mapId, record]) => [
      mapId,
      {
        items: [...(record.items || [])],
        dangers: [...(record.dangers || [])]
      }
    ]));
  },

  // 从存档恢复地图发现记录，并为新增地图补齐空集合。
  restoreDiscovered(discovered) {
    const restored = {};
    this.maps.forEach(map => {
      const record = discovered?.[map.id] || {};
      restored[map.id] = {
        items: new Set(record.items || []),
        dangers: new Set(record.dangers || [])
      };
    });
    return restored;
  },

  // 保存日循环关键状态；探索中的临时地图不持久化，避免恢复到不完整的远征现场。
  saveGame() {
    if (typeof localStorage === 'undefined') return false;
    try {
      const saveData = {
        version: 4,
        savedAt: Date.now(),
        state: {
          ...this.state,
          discovered: this.serializeDiscovered(this.state.discovered)
        },
        craftState: this.craftState,
        shopState: {
          ...this.shopState,
          selectedCustomer: null,
          selectedCoffee: null
        }
      };
      localStorage.setItem(this.storageKey, JSON.stringify(saveData));
      this.updateContinueButton();
      return true;
    } catch (error) {
      console.warn('保存游戏失败:', error);
      return false;
    }
  },

  // 读取本地存档并恢复到安全场景；旧版本缺失字段使用当前规则补齐。
  loadGame() {
    if (typeof localStorage === 'undefined') return false;
    try {
      const rawSave = localStorage.getItem(this.storageKey);
      if (!rawSave) return false;
      const saveData = JSON.parse(rawSave);
      this.state = {
        ...this.state,
        ...saveData.state,
        discovered: this.restoreDiscovered(saveData.state?.discovered),
        dayHistory: saveData.state?.dayHistory || []
      };
      this.ensureProgressState();
      this.craftState = { ...this.craftState, ...(saveData.craftState || {}) };
      this.shopState = {
        ...this.shopState,
        ...(saveData.shopState || {}),
        selectedCustomer: null,
        selectedCoffee: null,
        satisfactionTotal: saveData.shopState?.satisfactionTotal || 0
      };
      this.selectedWorkshopItem = null;
      this.addMessage(`📂 已继续第 ${this.state.day} 天的经营。`, 'success');

      const safeScenes = ['map-select-scene', 'processing-scene', 'workshop-scene', 'shop-scene'];
      const resumeScene = safeScenes.includes(this.state.currentScene) ? this.state.currentScene : 'map-select-scene';
      this.showScene(resumeScene);
      return true;
    } catch (error) {
      console.warn('读取存档失败:', error);
      return false;
    }
  },

  // 根据本地是否存在有效存档更新主菜单继续按钮。
  updateContinueButton() {
    const continueButton = document.getElementById('continue-game-btn');
    if (!continueButton || typeof localStorage === 'undefined') return;
    continueButton.disabled = !localStorage.getItem(this.storageKey);
  },

  // ============================================
  // 主菜单
  // ============================================
  
  getMapDiscovered(mapId) {
    if (!this.state.discovered[mapId]) {
      this.state.discovered[mapId] = { items: new Set(), dangers: new Set() };
    }
    return this.state.discovered[mapId];
  },

  startNewGame() {
    const discovered = {};
    this.maps.forEach(map => {
      discovered[map.id] = { items: new Set(), dangers: new Set() };
    });
    
    this.state = {
      gold: 100,
      reputation: 0,
      day: 1,
      inventory: [
        { item: { ...this.baseItems.green_yunnan }, count: 3 },
        { item: { ...this.baseItems.milk_whole }, count: 2 },
        { item: { ...this.baseItems.spice_cinnamon }, count: 1 }
      ],
      coffeeStock: [],
      selectedMap: null,
      currentScene: 'main-menu',
      tools: {
        highTempRoaster: false,
        espressoMachine: false,
        fineGrinder: false,
        advancedGrinder: false,
        fermentationChamber: false,
        mokaPot: false,
        brewingChamber: false
      },
      exploredToday: false,
      discovered: discovered,
      dayHistory: [],
      explorationSupplies: 2,
      specializations: { exploration: 0, roasting: 0, business: 0 },
      collection: { beans: {}, recipes: {} },
      activeCommission: null,
      completedCommissions: 0,
      customerHistory: {},
      festival: { results: {} }
    };
    
    this.craftState = {
      processItems: [],
      processMethod: null,
      roastItems: [],
      roastLevel: null,
      grindItems: [],
      grindLevel: null,
      brewItems: [],
      brewMethod: null,
      blendItems: [],
      additives: [],
      currentStep: 0,
      finishedCoffee: null
    };
    
    this.shopState = {
      customers: [],
      selectedCustomer: null,
      selectedCoffee: null,
      soldToday: 0,
      incomeToday: 0,
      satisfactionTotal: 0
    };
    this.messages = [];
    this.recordBeanDiscovery(this.baseItems.green_yunnan, 3);
    
    this.addMessage('🎮 欢迎来到 CoffeeHunter！', 'success');
    this.addMessage('选择一个地区开始你的咖啡探索之旅！');
    
    this.showScene('map-select-scene');
    this.saveGame();
  },
  
  showHelp() {
    alert(`CoffeeHunter 游戏说明 v2.0\n\n` +
          `【游戏流程】\n` +
          `1. 先看4份订单，再选择产区并支付旅行费\n` +
          `2. 在12—16点行动力和8格背包内决定深入或撤退\n` +
          `3. 危险事件可绕路、消耗工具或冒险通过\n` +
          `4. 处理→烘焙→研磨→萃取共同塑造六维风味\n` +
          `5. 顾客按需求50%、工艺30%、稀有创新20%并扣除缺陷结算\n\n` +
          `【长期目标】\n` +
          `• 完成第7日与第14日咖啡节阶段目标\n` +
          `• 收集咖啡豆图鉴与配方笔记\n` +
          `• 提升探索、烘焙、经营三条专精路线\n` +
          `• 完成地区委托并培养回头客关系\n\n` +
          `【操作】\n` +
          `↑↓←→ / WASD：移动\n` +
          `空格键：采集\n` +
          `点击物品选择，点击装置槽位放入`);
  },

  // ============================================
  // 地图选择
  // ============================================

  // 在选图前展示当天订单，让玩家能够根据需求规划产区、原料与制作路线。
  renderDailyOrders() {
    const container = document.getElementById('daily-orders');
    if (!container) return;

    const activeCustomers = this.shopState.customers.filter(customer => !customer.served);
    if (activeCustomers.length === 0) {
      container.innerHTML = '<div class="daily-orders-empty">今日订单已全部完成，可以结束当天。</div>';
      return;
    }

    container.innerHTML = activeCustomers.map(customer => `
      <div class="daily-order-card">
        <div class="daily-order-customer">
          <span class="daily-order-avatar">${customer.avatar}</span>
          <div>
            <div class="daily-order-name">${customer.name}</div>
            <div class="daily-order-type">${customer.type}${customer.isReturning ? ` · 回头客${customer.visitCount}` : ''}</div>
          </div>
        </div>
        <div class="daily-order-tags">
          ${customer.demands.map(demand => `
            <span class="demand-tag ${demand.required ? '' : 'optional'}">
              ${demand.required ? '⭐' : '○'} ${demand.tag}
            </span>
          `).join('')}
        </div>
        <div class="daily-order-avoid">避雷：${(customer.avoidTags || []).join('、') || '无'}</div>
        <div class="daily-order-avoid">故事：${customer.storyText || '初次来访'}</div>
        <div class="daily-order-reward">💰 ${customer.basePrice} 起 · ⭐ ${customer.reputation}</div>
      </div>
    `).join('');
  },
  
  renderMapCards() {
    const container = document.getElementById('map-cards');
    if (!container) return;
    
    container.innerHTML = '';
    
    const groupedMaps = {};
    this.maps.forEach(map => {
      const region = map.region || 'other';
      if (!groupedMaps[region]) {
        groupedMaps[region] = { name: map.regionName || '其他地区', maps: [] };
      }
      groupedMaps[region].maps.push(map);
    });
    
    Object.entries(groupedMaps).forEach(([regionKey, regionData]) => {
      const regionSection = document.createElement('div');
      regionSection.className = 'region-section';
      
      const regionHeader = document.createElement('div');
      regionHeader.className = 'region-header';
      regionHeader.innerHTML = `<h3 class="region-title">${regionData.name}</h3>`;
      regionSection.appendChild(regionHeader);
      
      const regionMapsContainer = document.createElement('div');
      regionMapsContainer.className = 'region-maps';
      
      regionData.maps.forEach(map => {
        const card = document.createElement('div');
        const isUnlocked = this.isMapUnlocked(map);
        const isSelected = this.state.selectedMap?.id === map.id;
        card.className = `map-card ${isSelected ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''}`;
        
        const difficultyClass = map.difficulty === 'easy' ? 'easy' : 
                                map.difficulty === 'medium' ? 'medium' : 'hard';
        const difficultyText = map.difficulty === 'easy' ? '简单' : 
                               map.difficulty === 'medium' ? '中等' : '困难';
        const actionPoints = this.rules.exploration.actionPointsByDifficulty[map.difficulty];
        const travelCost = this.getTravelCost(map);
        
        const knownItems = [];
        const unknownItems = [];
        const mapDiscovered = this.getMapDiscovered(map.id);
        Object.keys(map.itemWeights).forEach(itemId => {
          const item = this.baseItems[itemId];
          if (item) {
            if (mapDiscovered.items.has(itemId)) {
              knownItems.push(item);
            } else {
              unknownItems.push(item);
            }
          }
        });
        
        const dangerTypes = [];
        if (map.dangerLevel >= 1) dangerTypes.push('野生动物出没');
        if (map.dangerLevel >= 2) dangerTypes.push('地形复杂');
        if (map.dangerLevel >= 3) dangerTypes.push('恶劣天气');
        
        const knownDangers = dangerTypes.filter(d => mapDiscovered.dangers.has(d));
        const unknownDangerCount = dangerTypes.length - knownDangers.length;
        
        let lockInfo = '';
        if (!isUnlocked && map.unlockRequirement) {
          const req = map.unlockRequirement;
          let reqText = '';
          if (req.reputation) reqText += `需要 ${req.reputation} 声望`;
          lockInfo = `<div class="map-lock-info">🔒 ${reqText}</div>`;
        }
        
        card.innerHTML = `
          <div class="map-card-header">
            <div class="map-card-name">${map.icon} ${map.name}</div>
            <div class="map-card-difficulty ${difficultyClass}">${difficultyText}</div>
          </div>
          <div class="map-card-desc">${map.description}</div>
          <div class="map-card-tags">
            ${map.tags.map(tag => `<span class="map-tag">${tag}</span>`).join('')}
          </div>
          <div class="map-card-economy">⚡ ${actionPoints} 行动力 · 🧳 旅行费 ${travelCost} 金币</div>
          ${lockInfo}
          ${isUnlocked ? `
          <div class="map-card-discoveries">
            <div class="discovery-section">
              <div class="discovery-label">🎒 已知素材:</div>
              <div class="discovery-items">
                ${knownItems.length > 0 ? 
                  knownItems.map(item => `<span class="discovery-item known" title="${item.name}">${item.icon}</span>`).join('') :
                  '<span class="discovery-none">暂未发现</span>'
                }
                ${unknownItems.length > 0 ? `<span class="discovery-unknown">+${unknownItems.length}种未知</span>` : ''}
              </div>
            </div>
            ${dangerTypes.length > 0 ? `
            <div class="discovery-section">
              <div class="discovery-label">⚠️ 已知危险:</div>
              <div class="discovery-items">
                ${knownDangers.length > 0 ? 
                  knownDangers.map(d => `<span class="discovery-item danger">${d}</span>`).join('') :
                  '<span class="discovery-none">暂未发现</span>'
                }
                ${unknownDangerCount > 0 ? `<span class="discovery-unknown">+${unknownDangerCount}种未知</span>` : ''}
              </div>
            </div>
            ` : ''}
          </div>
          ` : ''}
        `;
        
        card.onclick = () => this.selectMap(map);
        regionMapsContainer.appendChild(card);
      });
      
      regionSection.appendChild(regionMapsContainer);
      container.appendChild(regionSection);
    });
  },
  
  isMapUnlocked(map) {
    if (!map.unlockRequirement) return true;
    if (map.unlockRequirement.reputation && this.state.reputation >= map.unlockRequirement.reputation) {
      return true;
    }
    return false;
  },

  selectMap(map) {
    if (!this.isMapUnlocked(map)) {
      const req = map.unlockRequirement;
      let reqText = '';
      if (req.reputation) reqText += `需要 ${req.reputation} 声望`;
      this.addMessage(`🔒 该地区尚未解锁！${reqText}`, 'warning');
      return;
    }
    
    this.state.selectedMap = map;
    if (this.state.activeCommission?.day !== this.state.day || this.state.activeCommission?.mapId !== map.id || this.state.activeCommission?.status !== 'active') {
      this.createMapCommission(map);
    }
    this.renderMapCards();
    this.renderProgressSummary();
    
    const btn = document.getElementById('start-explore-btn');
    if (btn) {
      btn.disabled = this.state.gold < this.getTravelCost(map);
      btn.textContent = `🚀 开始探索（旅行费 ${this.getTravelCost(map)} 金币）`;
    }
    
    this.addMessage(`📋 选择了探索地区: ${map.icon} ${map.name}`);
  },
  
  updateMenuStats() {
    const goldEl = document.getElementById('menu-gold');
    const repEl = document.getElementById('menu-reputation');
    const dayEl = document.getElementById('menu-day');
    if (goldEl) goldEl.textContent = this.state.gold;
    if (repEl) repEl.textContent = this.state.reputation;
    if (dayEl) dayEl.textContent = this.state.day;
  },

  skipExploration() {
    this.state.exploredToday = true;
    this.addMessage('⏭️ 跳过今天的探索，直接进入工坊。');
    this.addMessage('使用背包中已有的材料制作咖啡吧！');
    this.showScene('workshop-scene');
    this.saveGame();
  },

  // ============================================
  // 工具商店系统
  // ============================================
  
  showToolShop() {
    this.renderToolShop();
    const toolShopModal = document.getElementById('tool-shop-modal');
    if (toolShopModal) {
      toolShopModal.classList.remove('hidden');
    }
  },
  
  hideToolShop() {
    const toolShopModal = document.getElementById('tool-shop-modal');
    if (toolShopModal) {
      toolShopModal.classList.add('hidden');
    }
  },
  
  renderToolShop() {
    const container = document.getElementById('tool-shop-items');
    if (!container) return;
    
    container.innerHTML = '';
    
    Object.values(this.toolsShop).forEach(tool => {
      const isUnlocked = this.state.tools[tool.id];
      const canAfford = this.state.gold >= tool.price;
      
      const toolCard = document.createElement('div');
      toolCard.className = `tool-card ${isUnlocked ? 'unlocked' : ''}`;
      
      toolCard.innerHTML = `
        <div class="tool-card-header">
          <div class="tool-card-icon">${tool.icon}</div>
          <div class="tool-card-info">
            <div class="tool-card-name">${tool.name}</div>
            <div class="tool-card-price">
              ${isUnlocked ? '<span class="unlocked-text">✓ 已解锁</span>' : `<span class="price-text">💰 ${tool.price}</span>`}
            </div>
          </div>
        </div>
        <div class="tool-card-desc">${tool.description}</div>
        <div class="tool-card-unlocks">
          <span>解锁功能: </span>
          ${tool.unlocks.map(u => `<span class="unlock-tag">${u}</span>`).join(' ')}
        </div>
        ${!isUnlocked ? `
          <button class="btn ${canAfford ? 'btn-primary' : 'btn-secondary'} tool-buy-btn" 
                  onclick="Game.buyTool('${tool.id}')" 
                  ${canAfford ? '' : 'disabled'}>
            ${canAfford ? '🛒 购买' : '💰 金币不足'}
          </button>
        ` : ''}
      `;
      
      container.appendChild(toolCard);
    });

    const supplyCost = this.rules.economy.explorationSupplyCost;
    const supplyCard = document.createElement('div');
    supplyCard.className = 'tool-card';
    supplyCard.innerHTML = `
      <div class="tool-card-header">
        <div class="tool-card-icon">🧰</div>
        <div class="tool-card-info">
          <div class="tool-card-name">远征工具补给</div>
          <div class="tool-card-price"><span class="price-text">💰 ${supplyCost}</span></div>
        </div>
      </div>
      <div class="tool-card-desc">危险事件中可消耗1份工具安全通过。当前库存：${this.state.explorationSupplies}份。</div>
      <div class="tool-card-unlocks"><span class="unlock-tag">可重复购买</span><span class="unlock-tag">安全穿越</span></div>
      <button class="btn ${this.state.gold >= supplyCost ? 'btn-primary' : 'btn-secondary'} tool-buy-btn" onclick="Game.buyExplorationSupply()" ${this.state.gold >= supplyCost ? '' : 'disabled'}>
        ${this.state.gold >= supplyCost ? '🛒 购买1份' : '💰 金币不足'}
      </button>
    `;
    container.appendChild(supplyCard);
    
    const goldEl = document.getElementById('tool-shop-gold');
    if (goldEl) goldEl.textContent = this.state.gold;
  },
  
  buyTool(toolId) {
    const tool = this.toolsShop[toolId];
    if (!tool) {
      this.addMessage('工具不存在！', 'warning');
      return;
    }
    
    if (this.state.tools[toolId]) {
      this.addMessage('该工具已经解锁！', 'warning');
      return;
    }
    
    if (this.state.gold < tool.price) {
      this.addMessage(`金币不足！需要 ${tool.price} 金币`, 'warning');
      return;
    }
    
    this.state.gold -= tool.price;
    this.state.tools[toolId] = true;
    this.toolsShop[toolId].unlocked = true;
    
    this.addMessage(`🎉 成功购买 ${tool.icon} ${tool.name}！`, 'success');
    this.addMessage(`   解锁功能: ${tool.unlocks.join(', ')}`);
    
    this.renderToolShop();
    this.updateMenuStats();
    this.updateWorkshopStats();
    this.saveGame();
  },

  // 购买可消耗的远征工具，为危险事件提供稳定但有金币成本的安全选项。
  buyExplorationSupply() {
    const cost = this.rules.economy.explorationSupplyCost;
    if (this.state.gold < cost) {
      this.addMessage(`金币不足！购买远征工具需要 ${cost} 金币。`, 'warning');
      return;
    }
    this.state.gold -= cost;
    this.state.explorationSupplies++;
    this.addMessage(`🧰 购买了1份远征工具，当前共 ${this.state.explorationSupplies} 份。`, 'success');
    this.renderToolShop();
    this.updateMenuStats();
    this.updateWorkshopStats();
    this.saveGame();
  },

  // ============================================
  // 探索系统
  // ============================================
  
  startExploration() {
    if (!this.state.selectedMap) {
      this.addMessage('请先选择一个探索地区！', 'warning');
      return;
    }
    
    if (this.state.exploredToday) {
      this.addMessage('今天已经探索过了！每天只能探索一次。', 'warning');
      return;
    }

    const travelCost = this.getTravelCost();
    if (this.state.gold < travelCost) {
      this.addMessage(`💰 旅行费不足，需要 ${travelCost} 金币。可以跳过探索继续经营。`, 'warning');
      return;
    }
    this.state.gold -= travelCost;
    
    this.initializeExploreMap();
    this.exploreState.travelCostPaid = travelCost;
    this.showScene('explore-scene');
    this.addMessage(`🚀 开始探索 ${this.state.selectedMap.icon} ${this.state.selectedMap.name}！`, 'success');
    this.addMessage(`已支付 ${travelCost} 金币旅行费；使用方向键移动，空格键采集物品。`);
  },

  initializeExploreMap() {
    const map = [];
    const mapData = this.state.selectedMap;
    const width = this.exploreState.mapWidth;
    const height = this.exploreState.mapHeight;
    
    const startX = Math.floor(Math.random() * 3) + 1;
    const startY = Math.floor(height / 2);
    this.exploreState.playerPos = { x: startX, y: startY };
    this.exploreState.revealedCells = new Set();
    this.exploreState.collectedItems = 0;
    this.exploreState.collectedItemIds = [];
    this.exploreState.maxActionPoints = this.rules.exploration.actionPointsByDifficulty[mapData.difficulty];
    this.exploreState.actionPoints = this.exploreState.maxActionPoints;
    this.exploreState.backpackCapacity = this.rules.exploration.backpackCapacity;
    this.exploreState.protectedCapacity = this.getProtectedCapacity();
    this.exploreState.reachedFarExit = false;
    this.exploreState.pendingDanger = false;
    this.exploreState.actionPointsSpent = 0;
    this.exploreState.travelCostPaid = 0;
    this.exploreState.dangerDecisions = [];
    this.exploreState.exitPoints = [];
    this.exploreState.dangerPoints = [];
    
    for (let y = 0; y < height; y++) {
      map[y] = [];
      for (let x = 0; x < width; x++) {
        const isStart = x === startX && y === startY;
        const distFromStart = Math.abs(x - startX) + Math.abs(y - startY);
        const isRevealed = distFromStart <= 2;
        
        if (isRevealed) {
          this.exploreState.revealedCells.add(`${x},${y}`);
        }
        
        let terrain = 'grass';
        const rand = Math.random();
        if (rand < 0.6) terrain = 'grass';
        else if (rand < 0.85) terrain = 'forest';
        else terrain = 'mountain';
        
        const items = [];
        if (!isStart && Math.random() < 0.35) {
          const item = this.getRandomItem(mapData.itemWeights);
          if (item) items.push(item.id);
        }
        
        map[y][x] = {
          position: { x, y },
          isRevealed,
          terrain,
          items,
          isExit: false,
          isStartExit: false,
          isFarExit: false,
          isDanger: false,
          dangerResolved: false
        };
      }
    }
    
    map[startY][startX].isExit = true;
    map[startY][startX].isStartExit = true;
    map[startY][startX].terrain = 'exit';
    this.exploreState.exitPoints.push({ x: startX, y: startY });
    
    const targetDistance = Math.max(7, this.exploreState.maxActionPoints - 4);
    const exit2X = Math.min(width - 2, startX + targetDistance);
    const exit2Y = Math.max(1, Math.min(height - 2, startY + Math.floor(Math.random() * 3) - 1));
    if (exit2Y !== startY || exit2X !== startX) {
      map[exit2Y][exit2X].isExit = true;
      map[exit2Y][exit2X].isFarExit = true;
      map[exit2Y][exit2X].terrain = 'exit';
      this.exploreState.exitPoints.push({ x: exit2X, y: exit2Y });
    }

    // 为12—16点预算保留一条基础可达路线，危险格仍会让玩家在工具、绕路与冒险之间取舍。
    for (let x = Math.min(startX, exit2X); x <= Math.max(startX, exit2X); x++) {
      if (!map[startY][x].isExit) map[startY][x].terrain = 'grass';
    }
    const verticalStart = Math.min(startY, exit2Y);
    const verticalEnd = Math.max(startY, exit2Y);
    for (let y = verticalStart; y <= verticalEnd; y++) {
      if (!map[y][exit2X].isExit) map[y][exit2X].terrain = 'grass';
    }
    
    const dangerCount = mapData.dangerLevel * 2;
    for (let i = 0; i < dangerCount; i++) {
      const dx = Math.floor(Math.random() * (width - 4)) + 2;
      const dy = Math.floor(Math.random() * (height - 2)) + 1;
      if (!map[dy][dx].isExit) {
        map[dy][dx].isDanger = true;
        this.exploreState.dangerPoints.push({ x: dx, y: dy });
      }
    }
    
    this.exploreState.map = map;
    
    const areaEl = document.getElementById('explore-area');
    if (areaEl) areaEl.textContent = mapData.name;
  },

  renderExploreMap() {
    const container = document.getElementById('explore-map-grid');
    if (!container) return;
    
    const map = this.exploreState.map;
    const playerPos = this.exploreState.playerPos;
    
    container.innerHTML = '';
    container.style.gridTemplateColumns = `repeat(${this.exploreState.mapWidth}, 45px)`;
    
    for (let y = 0; y < this.exploreState.mapHeight; y++) {
      for (let x = 0; x < this.exploreState.mapWidth; x++) {
        const cell = map[y][x];
        const cellEl = document.createElement('div');
        cellEl.className = 'map-cell';
        
        const isPlayer = x === playerPos.x && y === playerPos.y;
        const isRevealed = this.exploreState.revealedCells.has(`${x},${y}`);
        
        if (isPlayer) {
          cellEl.classList.add('player');
        } else if (!isRevealed) {
          cellEl.classList.add('fog');
        } else if (cell.isExit) {
          cellEl.classList.add('exit-point');
        } else if (cell.isDanger) {
          cellEl.classList.add('danger');
        } else {
          cellEl.classList.add('revealed');
        }
        
        if (isPlayer) {
          cellEl.textContent = '🧙';
        } else if (isRevealed) {
          if (cell.isExit) {
            cellEl.textContent = '🚪';
          } else if (cell.isDanger) {
            cellEl.textContent = '🐻';
          } else if (cell.items.length > 0) {
            const item = this.baseItems[cell.items[0]];
            cellEl.textContent = item?.icon || '✨';
          } else {
            const terrainIcons = { grass: '🌿', forest: '🌲', mountain: '⛰️' };
            cellEl.textContent = terrainIcons[cell.terrain] || '🌿';
          }
        } else {
          cellEl.textContent = '?';
        }
        
        cellEl.onclick = () => this.onMapCellClick(x, y);
        container.appendChild(cellEl);
      }
    }
    
    this.updateExploreProgress();
  },

  onMapCellClick(x, y) {
    const playerPos = this.exploreState.playerPos;
    const dx = x - playerPos.x;
    const dy = y - playerPos.y;
    
    if (Math.abs(dx) + Math.abs(dy) === 1) {
      if (dx === 1) this.movePlayer('right');
      else if (dx === -1) this.movePlayer('left');
      else if (dy === 1) this.movePlayer('down');
      else if (dy === -1) this.movePlayer('up');
    } else if (dx === 0 && dy === 0) {
      const cell = this.exploreState.map[y][x];
      if (cell.isExit) {
        this.tryExitExplore();
      } else if (cell.items.length > 0) {
        this.collectCurrentCell();
      }
    }
  },

  getRandomRareItem(mapData) {
    if (!mapData.rareItems || mapData.rareItems.length === 0) {
      return null;
    }
    
    const totalChance = mapData.rareItems.reduce((sum, item) => sum + item.chance, 0);
    let random = Math.random() * totalChance;
    
    for (const rareItem of mapData.rareItems) {
      random -= rareItem.chance;
      if (random <= 0) {
        return this.baseItems[rareItem.id];
      }
    }
    
    return this.baseItems[mapData.rareItems[0].id];
  },

  collectRareItem(item, triggerType) {
    if (!item) return false;
    if (this.exploreState.collectedItems >= this.exploreState.backpackCapacity) {
      this.addMessage(`🎒 远征背包已满，无法带走 ${item.name}。`, 'warning');
      return false;
    }
    
    const currentMapId = this.state.selectedMap?.id;
    const mapDiscovered = currentMapId ? this.getMapDiscovered(currentMapId) : null;
    
    const existing = this.state.inventory.find(i => i.item.id === item.id);
    if (existing) {
      existing.count++;
    } else {
      this.state.inventory.push({ item: { ...item }, count: 1 });
    }
    this.exploreState.collectedItems++;
    this.exploreState.collectedItemIds.push(item.id);
    this.recordBeanDiscovery(item);
    
    if (mapDiscovered && !mapDiscovered.items.has(item.id)) {
      mapDiscovered.items.add(item.id);
      this.addMessage(`📖 发现稀有素材: ${item.icon} ${item.name}！`, 'success');
    }
    
    const triggerText = triggerType === 'walk' ? '行走时' : '采集时';
    this.addMessage(`✨ ${triggerText}幸运获得稀有豆: ${item.icon} ${item.name}！`, 'success');
    
    this.renderExploreInventory();
    return true;
  },

  // 返回目标格的行动力成本；冒险穿越危险格时使用固定高成本，其余情况按地形结算。
  getExploreActionCost(cell, approach = 'terrain') {
    if (cell.isDanger && approach === 'risk') return this.rules.exploration.dangerCost;
    return this.rules.exploration.terrainCost[cell.terrain] || 1;
  },

  // 统一扣除行动力并记录本次远征的实际消耗，供探索专精结算使用。
  spendExploreActionPoints(cost) {
    const actualCost = Math.min(this.exploreState.actionPoints, Math.max(0, cost));
    this.exploreState.actionPoints -= actualCost;
    this.exploreState.actionPointsSpent += actualCost;
    return actualCost;
  },

  // 返回当前远征背包中未被样品盒保护的素材数量。
  getUnprotectedItemCount() {
    return Math.max(0, this.exploreState.collectedItemIds.length - this.exploreState.protectedCapacity);
  },

  // 从本次远征所得物品中扣除指定数量；默认只会损失保护格之外的素材。
  loseExpeditionItems(count, unprotectedOnly = true) {
    const lostItems = [];
    for (let i = 0; i < count && this.exploreState.collectedItemIds.length > 0; i++) {
      const protectedCount = unprotectedOnly ? Math.min(this.exploreState.protectedCapacity, this.exploreState.collectedItemIds.length) : 0;
      const candidateCount = this.exploreState.collectedItemIds.length - protectedCount;
      if (candidateCount <= 0) break;
      const lostIndex = protectedCount + Math.floor(Math.random() * candidateCount);
      const [itemId] = this.exploreState.collectedItemIds.splice(lostIndex, 1);
      const inventoryIndex = this.state.inventory.findIndex(entry => entry.item.id === itemId);
      if (inventoryIndex < 0) continue;

      const inventoryEntry = this.state.inventory[inventoryIndex];
      lostItems.push(inventoryEntry.item);
      inventoryEntry.count--;
      if (inventoryEntry.count <= 0) this.state.inventory.splice(inventoryIndex, 1);
      this.exploreState.collectedItems = Math.max(0, this.exploreState.collectedItems - 1);
    }
    return lostItems;
  },

  // 行动力耗尽时强制结束探索，并损失一半未受保护的远征素材。
  handleExploreExhaustion() {
    this.addMessage('🥵 行动力耗尽，只能紧急撤退！', 'danger');
    this.exitExplore({ unsafe: true, exhausted: true });
  },

  // 危险格提供绕路、消耗工具和冒险通过三种明确选择，不再由随机事件直接替玩家决定。
  presentDangerChoice(cell, x, y) {
    if (this.exploreState.pendingDanger) return;
    if (this.exploreState.actionPoints <= 0) {
      this.handleExploreExhaustion();
      return;
    }

    const terrainCost = this.getExploreActionCost(cell, 'terrain');
    const riskCost = this.getExploreActionCost(cell, 'risk');
    this.exploreState.pendingDanger = true;
    this.showOptionsDialog('⚠️ 前方发现危险区域', [
      {
        icon: '↩️',
        name: '绕路（1行动力）',
        description: '留在原地，保住物资并重新规划路线。',
        disabled: this.exploreState.actionPoints < 1,
        disabledReason: '行动力不足'
      },
      {
        icon: '🧰',
        name: `消耗工具（${terrainCost}行动力）`,
        description: `使用1份远征工具安全通过；当前 ${this.state.explorationSupplies} 份。`,
        disabled: this.state.explorationSupplies <= 0 || this.exploreState.actionPoints < terrainCost,
        disabledReason: this.state.explorationSupplies <= 0 ? '没有远征工具' : '行动力不足'
      },
      {
        icon: '🎲',
        name: `冒险通过（${riskCost}行动力）`,
        description: '有50%概率丢失1件未保护素材。',
        disabled: this.exploreState.actionPoints < riskCost,
        disabledReason: '行动力不足'
      }
    ], index => {
      this.exploreState.pendingDanger = false;
      if (index === 0) {
        this.spendExploreActionPoints(1);
        this.exploreState.dangerDecisions.push('detour');
        this.addMessage('↩️ 选择绕路：消耗1点行动力，保住了全部素材。', 'warning');
        this.renderExploreMap();
        if (this.exploreState.actionPoints <= 0) this.handleExploreExhaustion();
      } else if (index === 1) {
        this.state.explorationSupplies--;
        this.exploreState.dangerDecisions.push('tool');
        this.completeExploreMove(cell, x, y, 'tool');
      } else {
        this.exploreState.dangerDecisions.push('risk');
        this.completeExploreMove(cell, x, y, 'risk');
      }
    }, { allowDismiss: false });
  },

  // 完成一次已确定成本的移动，并统一处理揭图、危险结果、稀有掉落与撤离点提示。
  completeExploreMove(cell, newX, newY, approach = 'terrain') {
    const actionCost = this.getExploreActionCost(cell, approach);
    if (this.exploreState.actionPoints < actionCost) {
      this.handleExploreExhaustion();
      return;
    }
    this.spendExploreActionPoints(actionCost);

    if (cell.isDanger && !cell.dangerResolved) {
      const dangerTypes = ['野生动物出没', '地形复杂', '恶劣天气'];
      const availableDangers = dangerTypes.slice(0, Math.max(1, this.state.selectedMap?.dangerLevel || 1));
      const dangerType = availableDangers[Math.floor(Math.random() * availableDangers.length)];
      const currentMapId = this.state.selectedMap?.id;
      const mapDiscovered = currentMapId ? this.getMapDiscovered(currentMapId) : null;
      if (mapDiscovered && !mapDiscovered.dangers.has(dangerType)) {
        mapDiscovered.dangers.add(dangerType);
        this.addMessage(`📖 在本地区发现新危险: ${dangerType}！`, 'danger');
      }

      if (approach === 'tool') {
        this.addMessage(`🧰 消耗1份远征工具，安全穿越${dangerType}。`, 'success');
      } else if (approach === 'risk') {
        this.addMessage(`🎲 冒险穿越${dangerType}，消耗 ${actionCost} 点行动力。`, 'danger');
        if (Math.random() < 0.5) {
          const lostItems = this.loseExpeditionItems(1, true);
          if (lostItems.length > 0) {
            this.addMessage(`💥 冒险失败，遗失了未保护的 ${lostItems[0].icon} ${lostItems[0].name}。`, 'danger');
          } else {
            this.addMessage('🛡️ 样品盒保护了现有素材。', 'success');
          }
        } else {
          this.addMessage('🍀 冒险成功，没有遗失素材。', 'success');
        }
      }
      cell.dangerResolved = true;
    }

    this.exploreState.playerPos = { x: newX, y: newY };
    const revealRange = 2;
    for (let dy = -revealRange; dy <= revealRange; dy++) {
      for (let dx = -revealRange; dx <= revealRange; dx++) {
        const rx = newX + dx;
        const ry = newY + dy;
        if (rx >= 0 && rx < this.exploreState.mapWidth && ry >= 0 && ry < this.exploreState.mapHeight) {
          this.exploreState.revealedCells.add(`${rx},${ry}`);
          this.exploreState.map[ry][rx].isRevealed = true;
        }
      }
    }

    if (!cell.isExit && !cell.isDanger && Math.random() < 0.001) {
      const rareItem = this.getRandomRareItem(this.state.selectedMap);
      if (rareItem) this.collectRareItem(rareItem, 'walk');
    }
    if (cell.isExit) {
      const exitText = cell.isFarExit ? '远端撤离点，安全撤离可领取地区奖励' : '营地撤离点';
      this.addMessage(`🚪 到达${exitText}！点击此处或按ESC结束探索。`, 'success');
    }

    this.renderExploreMap();
    if (this.exploreState.actionPoints <= 0) {
      if (cell.isExit) this.exitExplore();
      else this.handleExploreExhaustion();
    }
  },

  movePlayer(direction) {
    if (this.exploreState.pendingDanger) return;
    const pos = this.exploreState.playerPos;
    let newX = pos.x;
    let newY = pos.y;
    
    switch (direction) {
      case 'up': newY--; break;
      case 'down': newY++; break;
      case 'left': newX--; break;
      case 'right': newX++; break;
    }
    
    if (newX < 0 || newX >= this.exploreState.mapWidth || newY < 0 || newY >= this.exploreState.mapHeight) {
      return;
    }
    
    const cell = this.exploreState.map[newY][newX];
    if (cell.isDanger && !cell.dangerResolved) {
      this.presentDangerChoice(cell, newX, newY);
      return;
    }
    this.completeExploreMove(cell, newX, newY, 'terrain');
  },

  collectCurrentCell() {
    const pos = this.exploreState.playerPos;
    const cell = this.exploreState.map[pos.y][pos.x];
    
    if (!cell || cell.items.length === 0) {
      this.addMessage('这里没有可采集的物品。', 'warning');
      return;
    }

    const remainingCapacity = this.exploreState.backpackCapacity - this.exploreState.collectedItems;
    if (remainingCapacity <= 0) {
      this.addMessage('🎒 远征背包已满，请前往撤离点结束探索。', 'warning');
      return;
    }

    const collectCost = this.rules.exploration.collectCost;
    if (this.exploreState.actionPoints < collectCost) {
      this.handleExploreExhaustion();
      return;
    }
    this.spendExploreActionPoints(collectCost);
    
    const currentMapId = this.state.selectedMap?.id;
    const mapDiscovered = currentMapId ? this.getMapDiscovered(currentMapId) : null;
    
    let collectedGreenBean = false;
    
    const collectedFromCell = cell.items.slice(0, remainingCapacity);
    collectedFromCell.forEach(itemId => {
      const item = this.baseItems[itemId];
      if (item) {
        const existing = this.state.inventory.find(i => i.item.id === itemId);
        if (existing) {
          existing.count++;
        } else {
          this.state.inventory.push({ item: { ...item }, count: 1 });
        }
        this.exploreState.collectedItems++;
        this.exploreState.collectedItemIds.push(itemId);
        this.recordBeanDiscovery(item);
        
        if (item.type === 'green_bean') {
          collectedGreenBean = true;
        }
        
        if (mapDiscovered && !mapDiscovered.items.has(itemId)) {
          mapDiscovered.items.add(itemId);
          this.addMessage(`📖 在本地区发现新素材: ${item.icon} ${item.name}！`, 'success');
        }
        
        this.addMessage(`✨ 采集到了 ${item.icon} ${item.name}！`, 'success');
      }
    });
    
    if (collectedGreenBean && Math.random() < 0.05) {
      const mapData = this.state.selectedMap;
      const rareItem = this.getRandomRareItem(mapData);
      if (rareItem) {
        this.collectRareItem(rareItem, 'collect');
      }
    }
    
    cell.items = cell.items.slice(collectedFromCell.length);
    this.renderExploreMap();
    this.renderExploreInventory();

    if (this.exploreState.actionPoints <= 0) {
      this.handleExploreExhaustion();
    }
  },

  updateExploreProgress() {
    const total = this.exploreState.mapWidth * this.exploreState.mapHeight;
    const revealed = this.exploreState.revealedCells.size;
    const progress = Math.floor((revealed / total) * 100);
    
    const progressEl = document.getElementById('explore-progress');
    const foundEl = document.getElementById('explore-found');
    const exitEl = document.getElementById('exit-count');
    const itemsEl = document.getElementById('explore-items');
    const actionPointsEl = document.getElementById('explore-action-points');
    const actionPointsDetailEl = document.getElementById('explore-action-points-detail');
    const backpackUsageEl = document.getElementById('explore-backpack-usage');
    const protectedEl = document.getElementById('explore-protected');
    const suppliesEl = document.getElementById('explore-supplies');
    const commissionEl = document.getElementById('explore-commission');
    
    if (progressEl) progressEl.textContent = `${progress}%`;
    if (foundEl) foundEl.textContent = this.exploreState.collectedItems;
    if (exitEl) exitEl.textContent = `${this.exploreState.exitPoints.length}/2`;
    if (itemsEl) itemsEl.textContent = `${this.exploreState.collectedItems}/${this.exploreState.backpackCapacity}`;
    if (actionPointsEl) actionPointsEl.textContent = `${this.exploreState.actionPoints}/${this.exploreState.maxActionPoints}`;
    if (actionPointsDetailEl) actionPointsDetailEl.textContent = `${this.exploreState.actionPoints}/${this.exploreState.maxActionPoints}`;
    if (backpackUsageEl) backpackUsageEl.textContent = `${this.exploreState.collectedItems}/${this.exploreState.backpackCapacity}`;
    if (protectedEl) protectedEl.textContent = `${Math.min(this.exploreState.collectedItems, this.exploreState.protectedCapacity)}/${this.exploreState.protectedCapacity}`;
    if (suppliesEl) suppliesEl.textContent = this.state.explorationSupplies;
    if (commissionEl) {
      const commission = this.state.activeCommission;
      const collectedCount = commission ? this.exploreState.collectedItemIds.filter(itemId => itemId === commission.itemId).length : 0;
      const item = commission ? this.baseItems[commission.itemId] : null;
      commissionEl.textContent = commission ? `${item?.name || '目标素材'} ${collectedCount}/${commission.targetCount}` : '未接取';
    }
  },

  renderExploreInventory() {
    const container = document.getElementById('explore-inventory');
    const countEl = document.getElementById('inventory-count');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (countEl) countEl.textContent = `${this.exploreState.collectedItems}/${this.exploreState.backpackCapacity}件`;

    const expeditionCounts = this.exploreState.collectedItemIds.reduce((counts, itemId) => {
      counts[itemId] = (counts[itemId] || 0) + 1;
      return counts;
    }, {});

    Object.entries(expeditionCounts).forEach(([itemId, count]) => {
      const item = this.baseItems[itemId];
      if (!item) return;
      const slot = document.createElement('div');
      slot.className = 'inventory-slot';
      slot.innerHTML = `
        <span class="item-icon">${item.icon}</span>
        ${count > 1 ? `<span class="item-count">${count}</span>` : ''}
      `;
      slot.title = `${item.name}: ${item.description}\n本次获得: ${count}\n标签: ${item.tags.join(', ')}`;
      container.appendChild(slot);
    });
  },

  tryExitExplore() {
    const pos = this.exploreState.playerPos;
    const cell = this.exploreState.map[pos.y][pos.x];
    
    if (cell.isExit) {
      this.exitExplore();
    } else {
      const confirmed = confirm('当前位置不是撤离点。强行撤退会遗失1件未保护素材（样品盒内不受影响），确定继续吗？');
      if (confirmed) {
        this.exitExplore({ unsafe: true });
      }
    }
  },

  // 结算探索：远端撤离点发放地区奖励，危险撤退则扣除本次远征所得物品。
  exitExplore(options = {}) {
    const { unsafe = false, exhausted = false } = options;
    const pos = this.exploreState.playerPos;
    const cell = this.exploreState.map[pos.y]?.[pos.x];
    const lossCount = exhausted ? Math.ceil(this.getUnprotectedItemCount() / 2) : 1;
    const lostItems = unsafe ? this.loseExpeditionItems(lossCount, true) : [];

    if (lostItems.length > 0) {
      this.addMessage(`📉 撤退损失: ${lostItems.map(item => `${item.icon} ${item.name}`).join('、')}`, 'danger');
    }

    if (!unsafe && cell?.isFarExit && !this.exploreState.reachedFarExit) {
      const rewards = this.state.selectedMap?.rewards || { gold: 0, reputation: 0 };
      this.state.gold += rewards.gold;
      this.state.reputation += rewards.reputation;
      this.exploreState.reachedFarExit = true;
      this.addMessage(`🏆 抵达远端撤离点，获得 ${rewards.gold} 金币和 ${rewards.reputation} 声望！`, 'success');
    }

    this.settleActiveCommission(unsafe);
    const explorationXp = this.exploreState.collectedItems * 4 + (cell?.isFarExit && !unsafe ? 10 : 0) + this.exploreState.dangerDecisions.length * 2;
    this.gainSpecializationXp('exploration', explorationXp);

    this.addMessage(`🎉 探索完成！`, 'success');
    this.addMessage(`本次采集了 ${this.exploreState.collectedItems} 个物品`);
    this.addMessage('前往工坊制作咖啡，然后卖给客人获取金币和声望！');
    
    this.state.exploredToday = true;
    this.showScene('workshop-scene');
    this.saveGame();
  },

  // ============================================
  // 制作工坊系统（改进版）
  // ============================================
  
  updateWorkshopStats() {
    const goldEl = document.getElementById('workshop-gold');
    const repEl = document.getElementById('workshop-reputation');
    if (goldEl) goldEl.textContent = this.state.gold;
    if (repEl) repEl.textContent = this.state.reputation;
  },

  renderWorkshopInventory() {
    const container = document.getElementById('workshop-inventory');
    if (!container) return;
    
    container.innerHTML = '';
    
    this.state.inventory.forEach((invItem, index) => {
      const slot = document.createElement('div');
      slot.className = 'inventory-slot';
      if (this.selectedWorkshopItem === index) {
        slot.style.borderColor = '#e94560';
        slot.style.boxShadow = '0 0 10px rgba(233, 69, 96, 0.5)';
      }
      
      slot.innerHTML = `
        <span class="item-icon">${invItem.item.icon}</span>
        ${invItem.count > 1 ? `<span class="item-count">${invItem.count}</span>` : ''}
      `;
      slot.title = `${invItem.item.name}: ${invItem.item.description}\n类型: ${invItem.item.type}\n标签: ${invItem.item.tags.join(', ')}`;
      
      slot.onclick = () => this.selectWorkshopItem(index);
      container.appendChild(slot);
    });
  },

  selectWorkshopItem(index) {
    if (this.selectedWorkshopItem === index) {
      this.selectedWorkshopItem = null;
    } else {
      this.selectedWorkshopItem = index;
      const item = this.state.inventory[index].item;
      this.addMessage(`📦 选中: ${item.icon} ${item.name} [${item.tags.join(', ')}]`);
    }
    this.renderWorkshopInventory();
  },

  renderCoffeeInventory() {
    const container = document.getElementById('coffee-inventory');
    const countEl = document.getElementById('coffee-stock-count');
    if (!container) return;
    
    container.innerHTML = '';
    if (countEl) countEl.textContent = `${this.state.coffeeStock.length}杯`;
    
    this.state.coffeeStock.forEach((coffee, index) => {
      const slot = document.createElement('div');
      slot.className = 'inventory-slot';
      slot.innerHTML = `
        <span class="item-icon">☕</span>
      `;
      slot.title = `${coffee.name}\n评分: ${coffee.score}\n标签: ${coffee.tags.join(', ')}\n价值: ${coffee.price}💰\n${coffee.description}`;
      container.appendChild(slot);
    });
  },

  putInSlot(slotType, count = 1) {
    if (this.selectedWorkshopItem === null) {
      this.addMessage('请先从背包中选择一个物品', 'warning');
      return;
    }
    
    const invItem = this.state.inventory[this.selectedWorkshopItem];
    if (!invItem) {
      this.addMessage('物品不存在！', 'warning');
      return;
    }
    
    const item = invItem.item;
    if (slotType === 'process' && item.isProcessed) {
      this.addMessage('该生豆已经完成预处理，请直接进入烘焙步骤。', 'warning');
      return;
    }
    const maxSlotCapacity = 10;
    let itemsArray = null;
    let slotId = '';
    let placeholder = '';
    let requiredType = '';
    let renderOptions = null;
    
    switch (slotType) {
      case 'process':
        itemsArray = this.craftState.processItems;
        slotId = 'processing-slot';
        placeholder = '点击放入生豆';
        requiredType = 'green_bean';
        renderOptions = () => this.renderProcessingOptions();
        break;
      case 'roast':
        itemsArray = this.craftState.roastItems;
        slotId = 'roast-slot';
        placeholder = '点击放入生豆';
        requiredType = 'green_bean';
        renderOptions = () => this.renderRoastOptions();
        break;
      case 'grind':
        itemsArray = this.craftState.grindItems;
        slotId = 'grind-slot';
        placeholder = '点击放入熟豆';
        requiredType = 'roasted_bean';
        renderOptions = () => this.renderGrindOptions();
        break;
      case 'brew':
        itemsArray = this.craftState.brewItems;
        slotId = 'brew-slot';
        placeholder = '点击放入咖啡粉';
        requiredType = 'coffee_powder';
        renderOptions = () => this.renderBrewOptions();
        break;
      case 'blend':
        if (item.type === 'coffee_liquid') {
          itemsArray = this.craftState.blendItems;
          slotId = 'blend-slot';
          placeholder = '点击放入咖啡液';
          requiredType = 'coffee_liquid';
          renderOptions = null;
        } else if (item.type === 'additive') {
          if (this.craftState.additives.length >= 3) {
            this.addMessage('最多只能添加3种配料！', 'warning');
            return;
          }
          const actualCount = Math.min(count, invItem.count);
          for (let i = 0; i < actualCount; i++) {
            this.craftState.additives.push({ ...item });
          }
          this.renderAdditivesOptions();
          this.addMessage(`➕ 添加配料: ${item.icon} ${item.name} x${actualCount}`);
          
          invItem.count -= actualCount;
          if (invItem.count <= 0) {
            this.state.inventory.splice(this.selectedWorkshopItem, 1);
            this.selectedWorkshopItem = null;
          }
          this.renderWorkshopInventory();
          return;
        } else {
          this.addMessage('调和需要咖啡液或配料！', 'warning');
          return;
        }
        break;
    }
    
    if (requiredType && item.type !== requiredType) {
      const typeNames = {
        'green_bean': '生咖啡豆',
        'roasted_bean': '熟咖啡豆',
        'coffee_powder': '咖啡粉',
        'coffee_liquid': '咖啡液'
      };
      this.addMessage(`需要${typeNames[requiredType] || requiredType}！`, 'warning');
      return;
    }
    
    const actualCount = Math.min(count, invItem.count, maxSlotCapacity - itemsArray.length);
    if (actualCount <= 0) {
      if (itemsArray.length >= maxSlotCapacity) {
        this.addMessage(`槽位已满！最多放入 ${maxSlotCapacity} 个物品`, 'warning');
      }
      return;
    }
    
    for (let i = 0; i < actualCount; i++) {
      itemsArray.push({ ...item });
    }
    
    this.updateSlotDisplayMultiple(slotId, itemsArray, placeholder);
    if (renderOptions) renderOptions();
    
    const slotNames = {
      'process': '预处理装置',
      'roast': '烘焙装置',
      'grind': '研磨装置',
      'brew': '萃取装置',
      'blend': '调和装置'
    };
    this.addMessage(`📦 将 ${item.icon} ${item.name} x${actualCount} 放入${slotNames[slotType]}`);
    
    invItem.count -= actualCount;
    if (invItem.count <= 0) {
      this.state.inventory.splice(this.selectedWorkshopItem, 1);
      this.selectedWorkshopItem = null;
    }
    
    this.updateSlotCounts();
    this.renderWorkshopInventory();
  },

  updateSlotDisplayMultiple(slotId, itemsArray, placeholder) {
    const slot = document.getElementById(slotId);
    if (!slot) return;
    
    if (itemsArray.length === 0) {
      slot.classList.remove('has-item');
      slot.innerHTML = `<span style="color: var(--text-secondary); font-size: 0.8rem;">${placeholder}</span>`;
      return;
    }
    
    slot.classList.add('has-item');
    
    if (itemsArray.length === 1) {
      const item = itemsArray[0];
      slot.innerHTML = `
        <div class="workstation-item" title="点击取出物品">
          <span class="workstation-item-icon">${item.icon}</span>
          <span class="workstation-item-name">${item.name}</span>
        </div>
      `;
    } else {
      const uniqueItems = {};
      itemsArray.forEach(item => {
        if (uniqueItems[item.id]) {
          uniqueItems[item.id].count++;
        } else {
          uniqueItems[item.id] = { item: item, count: 1 };
        }
      });
      
      const displayItems = Object.values(uniqueItems);
      slot.innerHTML = `
        <div class="workstation-item" title="点击取出物品">
          <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 4px;">
            ${displayItems.slice(0, 4).map(({ item, count }) => `
              <span style="font-size: 1.2rem;" title="${item.name} x${count}">${item.icon}</span>
            `).join('')}
          </div>
          <span class="workstation-item-name">共 ${itemsArray.length} 个物品</span>
        </div>
      `;
    }
  },

  updateSlotCounts() {
    const roastCount = document.getElementById('roast-count');
    const grindCount = document.getElementById('grind-count');
    const brewCount = document.getElementById('brew-count');
    const blendCount = document.getElementById('blend-count');
    const processCount = document.getElementById('processing-count');
    const processBtn = document.getElementById('process-all-btn');
    
    if (roastCount) roastCount.textContent = this.craftState.roastItems.length;
    if (grindCount) grindCount.textContent = this.craftState.grindItems.length;
    if (brewCount) brewCount.textContent = this.craftState.brewItems.length;
    if (blendCount) blendCount.textContent = this.craftState.blendItems.length;
    if (processCount) processCount.textContent = this.craftState.processItems.length;
    if (processBtn) processBtn.disabled = this.craftState.processItems.length === 0;
    
    const blendBtn = document.getElementById('blend-btn');
    if (blendBtn) {
      blendBtn.disabled = this.craftState.blendItems.length === 0;
    }
  },

  removeFromSlot(slotType) {
    let itemsArray = null;
    let slotId = '';
    let placeholder = '';
    let optionsContainerId = '';
    let optionsPlaceholder = '';
    
    switch (slotType) {
      case 'process':
        itemsArray = this.craftState.processItems;
        slotId = 'processing-slot';
        placeholder = '点击放入生豆';
        optionsContainerId = 'processing-options';
        optionsPlaceholder = '放入生豆后选择处理方式';
        break;
      case 'roast':
        itemsArray = this.craftState.roastItems;
        slotId = 'roast-slot';
        placeholder = '点击放入生豆';
        optionsContainerId = 'roast-options';
        optionsPlaceholder = '放入生豆后选择烘焙程度';
        break;
      case 'grind':
        itemsArray = this.craftState.grindItems;
        slotId = 'grind-slot';
        placeholder = '点击放入熟豆';
        optionsContainerId = 'grind-options';
        optionsPlaceholder = '放入熟豆后选择研磨粗细';
        break;
      case 'brew':
        itemsArray = this.craftState.brewItems;
        slotId = 'brew-slot';
        placeholder = '点击放入咖啡粉';
        optionsContainerId = 'brew-options';
        optionsPlaceholder = '放入咖啡粉后选择萃取方式';
        break;
      case 'blend':
        itemsArray = this.craftState.blendItems;
        slotId = 'blend-slot';
        placeholder = '点击放入咖啡液';
        optionsContainerId = null;
        break;
    }
    
    if (itemsArray.length === 0) return;
    
    const removedItems = [...itemsArray];
    itemsArray.length = 0;
    
    removedItems.forEach(item => {
      const existing = this.state.inventory.find(i => i.item.id === item.id);
      if (existing) {
        existing.count++;
      } else {
        this.state.inventory.push({ item: { ...item }, count: 1 });
      }
    });
    
    this.resetSlot(slotId, placeholder);
    
    if (optionsContainerId) {
      const container = document.getElementById(optionsContainerId);
      if (container) {
        container.innerHTML = `<div class="options-placeholder">${optionsPlaceholder}</div>`;
      }
    }
    
    if (slotType === 'blend') {
      const blendBtn = document.getElementById('blend-btn');
      if (blendBtn) blendBtn.disabled = true;
    }
    
    this.updateSlotCounts();
    this.addMessage(`➖ 取出 ${removedItems.length} 个物品`);
    this.renderWorkshopInventory();
  },

  clearSlot(slotType) {
    this.removeFromSlot(slotType);
  },

  clearProcessingSlot() {
    this.clearSlot('process');
  },

  clearRoastSlot() {
    this.clearSlot('roast');
  },

  clearGrindSlot() {
    this.clearSlot('grind');
  },

  clearBrewSlot() {
    this.clearSlot('brew');
  },

  clearBlendSlot() {
    this.clearSlot('blend');
  },

  renderProcessingInventory() {
    const container = document.getElementById('processing-inventory');
    if (!container) return;
    
    container.innerHTML = '';
    
    this.state.inventory.forEach((invItem, index) => {
      if (invItem.item.type !== 'green_bean') return;
      
      const slot = document.createElement('div');
      slot.className = 'inventory-slot';
      if (this.selectedWorkshopItem === index) {
        slot.style.borderColor = '#e94560';
        slot.style.boxShadow = '0 0 10px rgba(233, 69, 96, 0.5)';
      }
      
      slot.innerHTML = `
        <span class="item-icon">${invItem.item.icon}</span>
        ${invItem.count > 1 ? `<span class="item-count">${invItem.count}</span>` : ''}
      `;
      slot.title = `${invItem.item.name}: ${invItem.item.description}\n类型: ${invItem.item.type}\n标签: ${invItem.item.tags.join(', ')}`;
      
      slot.onclick = (e) => {
        const count = e.shiftKey ? Math.min(5, invItem.count) : 1;
        this.selectedWorkshopItem = index;
        this.putInSlot('process', count);
      };
      container.appendChild(slot);
    });
  },

  updateProcessingStats() {
    const goldEl = document.getElementById('processing-gold');
    const repEl = document.getElementById('processing-reputation');
    if (goldEl) goldEl.textContent = this.state.gold;
    if (repEl) repEl.textContent = this.state.reputation;
  },

  renderProcessingOptions() {
    const container = document.getElementById('processing-options');
    if (!container) return;
    
    if (this.craftState.processItems.length === 0) {
      container.innerHTML = '<div class="options-placeholder">放入生豆后选择处理方式</div>';
      return;
    }
    
    container.innerHTML = '';
    
    this.processMethods.forEach(method => {
      const btn = document.createElement('button');
      btn.className = 'craft-option-btn';
      
      let disabled = false;
      let disabledReason = '';
      
      if (method.requiredTool && !this.state.tools[method.requiredTool]) {
        disabled = true;
        disabledReason = `需要解锁工具: ${this.toolsShop[method.requiredTool]?.name || method.requiredTool}`;
      }
      
      if (method.exclusiveTo) {
        const hasEligibleBean = this.craftState.processItems.some(bean => 
          method.exclusiveTo.some(tag => bean.tags.includes(tag) || bean.name.includes(tag))
        );
        if (!hasEligibleBean) {
          disabled = true;
          disabledReason = `仅适用于海岛豆`;
        }
      }
      
      const addedTags = method.addedTags || [];
      const removedTags = method.removeTags || [];
      
      btn.innerHTML = `
        <div class="option-name">${method.icon} ${method.name}</div>
        <div class="option-desc">${method.description}</div>
        ${disabled ? `<div class="option-locked">🔒 ${disabledReason}</div>` : ''}
        <div class="option-preview">
          ${addedTags.length > 0 ? `<div><span class="tag-added">+${addedTags.join(' +')}</span></div>` : ''}
          ${removedTags.length > 0 ? `<div><span class="tag-removed">-${removedTags.join(' -')}</span></div>` : ''}
        </div>
      `;
      
      if (disabled) {
        btn.disabled = true;
      } else {
        if (this.craftState.processMethod === method.id) {
          btn.style.background = 'rgba(233, 69, 96, 0.2)';
          btn.style.borderColor = '#e94560';
        }
        btn.onclick = () => {
          this.craftState.processMethod = method.id;
          this.renderProcessingOptions();
          this.addMessage(`📋 已选择处理方式: ${method.icon} ${method.name}`);
        };
      }
      
      container.appendChild(btn);
    });
  },

  renderAdditivesOptions() {
    const container = document.getElementById('additives-options');
    const display = document.getElementById('selected-additives-display');
    
    if (!container) return;
    
    container.innerHTML = '';
    
    const additives = this.state.inventory.filter(i => i.item.type === 'additive');
    
    if (additives.length === 0) {
      container.innerHTML = '<span style="color: var(--text-secondary); font-size: 0.75rem;">没有可用配料</span>';
    } else {
      additives.forEach(invItem => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-secondary';
        btn.style.cssText = 'padding: 4px 8px; font-size: 0.7rem; margin: 2px;';
        
        const selectedCount = this.craftState.additives.filter(a => a.id === invItem.item.id).length;
        
        btn.innerHTML = `${invItem.item.icon} ${invItem.item.name} (${invItem.count})${selectedCount > 0 ? ` ✕${selectedCount}` : ''}`;
        btn.title = invItem.item.description;
        btn.disabled = invItem.count <= 0 || this.craftState.additives.length >= 3;
        
        if (selectedCount > 0) {
          btn.style.background = 'rgba(233, 69, 96, 0.3)';
          btn.style.borderColor = '#e94560';
        }
        
        btn.onclick = () => {
          const existingIndex = this.state.inventory.findIndex(i => i.item.id === invItem.item.id);
          if (existingIndex >= 0) {
            this.selectedWorkshopItem = existingIndex;
            this.putInSlot('blend', 1);
          }
        };
        
        container.appendChild(btn);
      });
    }
    
    if (display) {
      if (this.craftState.additives.length > 0) {
        const unique = {};
        this.craftState.additives.forEach(a => {
          unique[a.id] = unique[a.id] ? { ...unique[a.id], count: unique[a.id].count + 1 } : { item: a, count: 1 };
        });
        display.innerHTML = Object.values(unique).map(({ item, count }, idx) => 
          `<span style="cursor: pointer; padding: 2px 6px; background: rgba(233, 69, 96, 0.2); border-radius: 4px; margin: 0 2px;" 
                 onclick="Game.removeAdditiveById('${item.id}')" title="点击移除">
            ${item.icon} ${count > 1 ? `x${count}` : ''}
          </span>`
        ).join(' ');
      } else {
        display.textContent = '无';
      }
    }
  },

  removeAdditiveById(itemId) {
    const index = this.craftState.additives.findIndex(a => a.id === itemId);
    if (index >= 0) {
      this.removeAdditive(index);
    }
  },

  performProcessing(processMethodId) {
    if (this.craftState.processItems.length === 0) {
      this.addMessage('请先放入生豆！', 'warning');
      return;
    }
    
    const methodId = processMethodId || this.craftState.processMethod;
    if (!methodId) {
      this.addMessage('请先选择处理方式！', 'warning');
      return;
    }
    
    const method = this.processMethods.find(p => p.id === methodId);
    if (!method) {
      this.addMessage('无效的处理方式！', 'warning');
      return;
    }
    
    if (method.requiredTool && !this.state.tools[method.requiredTool]) {
      this.addMessage('需要解锁对应工具！', 'warning');
      return;
    }

    if (method.exclusiveTo) {
      const hasIneligibleBean = this.craftState.processItems.some(bean =>
        !method.exclusiveTo.some(tag => bean.tags.includes(tag) || bean.name.includes(tag))
      );
      if (hasIneligibleBean) {
        this.addMessage('所选处理法不适用于槽位中的全部生豆，请拆分批次。', 'warning');
        return;
      }
    }
    
    const processCount = this.craftState.processItems.length;
    const processedBeans = [];
    
    this.craftState.processItems.forEach(greenBean => {
      const processedBean = this.createProcessedBean(greenBean, methodId);
      processedBeans.push(processedBean);
    });
    
    processedBeans.forEach(bean => {
      const existing = this.state.inventory.find(i => i.item.id === bean.id);
      if (existing) {
        existing.count++;
      } else {
        this.state.inventory.push({ item: bean, count: 1 });
      }
    });
    
    this.addMessage(`🔬 预处理完成！`, 'success');
    this.addMessage(`   处理方式: ${method.name}`);
    this.addMessage(`   处理数量: ${processCount} 个`);
    this.addMessage(`   效果: ${method.description}`);
    
    this.craftState.processItems = [];
    this.craftState.processMethod = methodId;
    this.resetSlot('processing-slot', '点击放入生豆');
    
    const optionsContainer = document.getElementById('processing-options');
    if (optionsContainer) {
      optionsContainer.innerHTML = '<div class="options-placeholder">放入生豆后选择处理方式</div>';
    }
    
    this.updateSlotCounts();
    this.renderProcessingInventory();
    this.renderWorkshopInventory();
  },

  // 显示操作选项弹窗
  showOptionsDialog(title, options, callback, dialogOptions = {}) {
    const dialog = document.createElement('div');
    dialog.className = 'options-dialog';
    dialog.innerHTML = `
      <div class="dialog-content">
        <h3>${title}</h3>
        <div class="options-container">
          ${options.map((option, index) => `
            <button class="option-btn ${option.disabled ? 'disabled' : ''}" data-index="${index}" ${option.disabled ? 'disabled' : ''}>
              ${option.icon || ''} ${option.name}
              ${option.description ? `<small>${option.description}</small>` : ''}
              ${option.disabled ? `<small class="disabled-reason">${option.disabledReason}</small>` : ''}
            </button>
          `).join('')}
        </div>
      </div>
    `;
    
    document.body.appendChild(dialog);
    
    dialog.querySelectorAll('.option-btn:not(.disabled)').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        callback(index);
        document.body.removeChild(dialog);
      });
    });
    
    dialog.querySelector('.dialog-content').addEventListener('click', (e) => {
      e.stopPropagation();
    });
    
    if (dialogOptions.allowDismiss !== false) {
      dialog.addEventListener('click', () => {
        document.body.removeChild(dialog);
      });
    }
  },

  calculatePreviewTags(baseItem, processType, processOption) {
    let tags = [...baseItem.tags];
    let addedTags = [];
    let removedTags = [];
    let enhancedTags = [];
    let reducedTags = [];
    
    switch (processType) {
      case 'roast':
        const roast = this.roastLevels.find(r => r.id === processOption);
        if (roast) {
          if (roast.removeTags) {
            roast.removeTags.forEach(rt => {
              if (tags.includes(rt)) {
                removedTags.push(rt);
                tags = tags.filter(t => t !== rt);
              }
            });
          }
          
          roast.tags.forEach(rt => {
            if (!tags.includes(rt)) {
              addedTags.push(rt);
              tags.push(rt);
            }
          });
          
          if (roast.tagMultiplier) {
            Object.entries(roast.tagMultiplier).forEach(([tag, multiplier]) => {
              if (multiplier > 1) {
                enhancedTags.push(`${tag} (×${multiplier})`);
              } else if (multiplier < 1) {
                reducedTags.push(`${tag} (×${multiplier})`);
              }
            });
          }
        }
        break;
        
      case 'grind':
        const grind = this.grindLevels.find(g => g.id === processOption);
        if (grind) {
          grind.tags.forEach(gt => {
            if (!tags.includes(gt)) {
              addedTags.push(gt);
              tags.push(gt);
            }
          });
          
          if (grind.tagMultiplier) {
            Object.entries(grind.tagMultiplier).forEach(([tag, multiplier]) => {
              if (multiplier > 1) {
                enhancedTags.push(`${tag} (×${multiplier})`);
              } else if (multiplier < 1) {
                reducedTags.push(`${tag} (×${multiplier})`);
              }
            });
          }
        }
        break;
        
      case 'brew':
        const brew = this.brewMethods.find(b => b.id === processOption);
        if (brew) {
          brew.tags.forEach(bt => {
            if (!tags.includes(bt)) {
              addedTags.push(bt);
              tags.push(bt);
            }
          });
          
          if (brew.tagMultiplier) {
            Object.entries(brew.tagMultiplier).forEach(([tag, multiplier]) => {
              if (multiplier > 1) {
                enhancedTags.push(`${tag} (×${multiplier})`);
              } else if (multiplier < 1) {
                reducedTags.push(`${tag} (×${multiplier})`);
              }
            });
          }
        }
        break;
    }
    
    return {
      finalTags: tags,
      addedTags: addedTags,
      removedTags: removedTags,
      enhancedTags: enhancedTags,
      reducedTags: reducedTags
    };
  },

  showConfirmDialog(title, content, onConfirm, onCancel) {
    const dialog = document.createElement('div');
    dialog.className = 'confirm-dialog';
    dialog.innerHTML = `
      <div class="confirm-content">
        <h3>${title}</h3>
        <div class="confirm-body">
          ${content}
        </div>
        <div class="confirm-buttons">
          <button class="btn btn-secondary confirm-cancel">取消</button>
          <button class="btn btn-primary confirm-ok">确认</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(dialog);
    
    dialog.querySelector('.confirm-cancel').onclick = () => {
      document.body.removeChild(dialog);
      if (onCancel) onCancel();
    };
    
    dialog.querySelector('.confirm-ok').onclick = () => {
      document.body.removeChild(dialog);
      if (onConfirm) onConfirm();
    };
    
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        document.body.removeChild(dialog);
        if (onCancel) onCancel();
      }
    });
  },

  renderRoastOptions() {
    const container = document.getElementById('roast-options');
    if (!container) return;
    
    container.innerHTML = '';
    
    const hasItems = this.craftState.roastItems.length > 0;
    const firstItem = hasItems ? this.craftState.roastItems[0] : null;
    const itemCount = this.craftState.roastItems.length;
    
    this.roastLevels.forEach(roast => {
      const isLocked = roast.requiredTool && !this.state.tools[roast.requiredTool];
      const btn = document.createElement('button');
      btn.className = `craft-option-btn ${isLocked ? 'locked' : ''}`;
      btn.disabled = isLocked;
      
      let previewHtml = '';
      if (!isLocked && hasItems && firstItem) {
        const preview = this.calculatePreviewTags(firstItem, 'roast', roast.id);
        previewHtml = '<div class="option-preview">';
        
        if (preview.removedTags.length > 0) {
          previewHtml += `<div class="preview-removed">移除: ${preview.removedTags.map(t => `<span class="tag-removed">${t}</span>`).join(' ')}</div>`;
        }
        if (preview.addedTags.length > 0) {
          previewHtml += `<div class="preview-added">添加: ${preview.addedTags.map(t => `<span class="tag-added">${t}</span>`).join(' ')}</div>`;
        }
        if (preview.enhancedTags.length > 0) {
          previewHtml += `<div class="preview-enhanced">增强: ${preview.enhancedTags.map(t => `<span class="tag-enhanced">${t}</span>`).join(' ')}</div>`;
        }
        
        previewHtml += '</div>';
      }
      
      btn.innerHTML = `
        <div class="option-name">
          ${roast.icon} ${roast.name}
          ${itemCount > 0 ? `<span style="font-size: 0.7rem; color: var(--text-secondary); margin-left: 8px;">(x${itemCount})</span>` : ''}
        </div>
        <div class="option-desc">${roast.description}</div>
        ${previewHtml}
        ${isLocked ? `<div class="option-locked">🔒 需要解锁对应工具</div>` : ''}
      `;
      
      if (!isLocked) {
        btn.onclick = () => {
          if (!hasItems) {
            this.addMessage('请先放入生豆！', 'warning');
            return;
          }
          
          const preview = this.calculatePreviewTags(firstItem, 'roast', roast.id);
          
          let confirmContent = `
            <div class="preview-info">
              <div class="preview-row">
                <span class="preview-label">原料:</span>
                <span>${firstItem.icon} ${firstItem.name} x${itemCount}</span>
              </div>
              <div class="preview-row">
                <span class="preview-label">当前标签:</span>
                <span class="tag-list">${firstItem.tags.map(t => `<span class="preview-tag">${t}</span>`).join('')}</span>
              </div>
              <div class="preview-arrow">↓</div>
              <div class="preview-row">
                <span class="preview-label">制作方式:</span>
                <span>${roast.icon} ${roast.name}</span>
              </div>
          `;
          
          if (preview.removedTags.length > 0) {
            confirmContent += `<div class="preview-row preview-change">
              <span class="preview-label remove">移除标签:</span>
              <span class="tag-list">${preview.removedTags.map(t => `<span class="preview-tag tag-removed">${t}</span>`).join('')}</span>
            </div>`;
          }
          
          if (preview.addedTags.length > 0) {
            confirmContent += `<div class="preview-row preview-change">
              <span class="preview-label add">添加标签:</span>
              <span class="tag-list">${preview.addedTags.map(t => `<span class="preview-tag tag-added">${t}</span>`).join('')}</span>
            </div>`;
          }
          
          if (preview.enhancedTags.length > 0) {
            confirmContent += `<div class="preview-row preview-change">
              <span class="preview-label enhance">增强效果:</span>
              <span class="tag-list">${preview.enhancedTags.map(t => `<span class="preview-tag tag-enhanced">${t}</span>`).join('')}</span>
            </div>`;
          }
          
          confirmContent += `
              <div class="preview-row">
                <span class="preview-label">最终标签:</span>
                <span class="tag-list">${preview.finalTags.map(t => `<span class="preview-tag tag-final">${t}</span>`).join('')}</span>
              </div>
            </div>
          `;
          
          this.showConfirmDialog(
            `确认烘焙 (x${itemCount})`,
            confirmContent,
            () => this.performRoast(roast.id)
          );
        };
      }
      
      container.appendChild(btn);
    });
  },

  renderGrindOptions() {
    const container = document.getElementById('grind-options');
    if (!container) return;
    
    container.innerHTML = '';
    
    const hasItems = this.craftState.grindItems.length > 0;
    const firstItem = hasItems ? this.craftState.grindItems[0] : null;
    const itemCount = this.craftState.grindItems.length;
    
    this.grindLevels.forEach(grind => {
      const isLocked = grind.requiredTool && !this.state.tools[grind.requiredTool];
      const btn = document.createElement('button');
      btn.className = `craft-option-btn ${isLocked ? 'locked' : ''}`;
      btn.disabled = isLocked;
      
      let previewHtml = '';
      if (!isLocked && hasItems && firstItem) {
        const preview = this.calculatePreviewTags(firstItem, 'grind', grind.id);
        previewHtml = '<div class="option-preview">';
        
        if (preview.addedTags.length > 0) {
          previewHtml += `<div class="preview-added">添加: ${preview.addedTags.map(t => `<span class="tag-added">${t}</span>`).join(' ')}</div>`;
        }
        if (preview.enhancedTags.length > 0) {
          previewHtml += `<div class="preview-enhanced">增强: ${preview.enhancedTags.map(t => `<span class="tag-enhanced">${t}</span>`).join(' ')}</div>`;
        }
        
        previewHtml += '</div>';
      }
      
      btn.innerHTML = `
        <div class="option-name">
          ${grind.icon} ${grind.name}
          ${itemCount > 0 ? `<span style="font-size: 0.7rem; color: var(--text-secondary); margin-left: 8px;">(x${itemCount})</span>` : ''}
        </div>
        <div class="option-desc">${grind.description}</div>
        ${previewHtml}
        ${isLocked ? `<div class="option-locked">🔒 需要解锁对应工具</div>` : ''}
      `;
      
      if (!isLocked) {
        btn.onclick = () => {
          if (!hasItems) {
            this.addMessage('请先放入熟豆！', 'warning');
            return;
          }
          
          const preview = this.calculatePreviewTags(firstItem, 'grind', grind.id);
          
          let confirmContent = `
            <div class="preview-info">
              <div class="preview-row">
                <span class="preview-label">原料:</span>
                <span>${firstItem.icon} ${firstItem.name} x${itemCount}</span>
              </div>
              <div class="preview-row">
                <span class="preview-label">当前标签:</span>
                <span class="tag-list">${firstItem.tags.map(t => `<span class="preview-tag">${t}</span>`).join('')}</span>
              </div>
              <div class="preview-arrow">↓</div>
              <div class="preview-row">
                <span class="preview-label">制作方式:</span>
                <span>${grind.icon} ${grind.name}</span>
              </div>
          `;
          
          if (preview.addedTags.length > 0) {
            confirmContent += `<div class="preview-row preview-change">
              <span class="preview-label add">添加标签:</span>
              <span class="tag-list">${preview.addedTags.map(t => `<span class="preview-tag tag-added">${t}</span>`).join('')}</span>
            </div>`;
          }
          
          if (preview.enhancedTags.length > 0) {
            confirmContent += `<div class="preview-row preview-change">
              <span class="preview-label enhance">增强效果:</span>
              <span class="tag-list">${preview.enhancedTags.map(t => `<span class="preview-tag tag-enhanced">${t}</span>`).join('')}</span>
            </div>`;
          }
          
          confirmContent += `
              <div class="preview-row">
                <span class="preview-label">最终标签:</span>
                <span class="tag-list">${preview.finalTags.map(t => `<span class="preview-tag tag-final">${t}</span>`).join('')}</span>
              </div>
            </div>
          `;
          
          this.showConfirmDialog(
            `确认研磨 (x${itemCount})`,
            confirmContent,
            () => this.performGrind(grind.id)
          );
        };
      }
      
      container.appendChild(btn);
    });
  },

  renderBrewOptions() {
    const container = document.getElementById('brew-options');
    if (!container) return;
    
    container.innerHTML = '';
    
    const hasItems = this.craftState.brewItems.length > 0;
    const firstItem = hasItems ? this.craftState.brewItems[0] : null;
    const itemCount = this.craftState.brewItems.length;
    
    this.brewMethods.forEach(brew => {
      const isLocked = brew.requiredTool && !this.state.tools[brew.requiredTool];
      const btn = document.createElement('button');
      btn.className = `craft-option-btn ${isLocked ? 'locked' : ''}`;
      btn.disabled = isLocked;
      
      let previewHtml = '';
      if (!isLocked && hasItems && firstItem) {
        const preview = this.calculatePreviewTags(firstItem, 'brew', brew.id);
        previewHtml = '<div class="option-preview">';
        
        if (preview.addedTags.length > 0) {
          previewHtml += `<div class="preview-added">添加: ${preview.addedTags.map(t => `<span class="tag-added">${t}</span>`).join(' ')}</div>`;
        }
        if (preview.enhancedTags.length > 0) {
          previewHtml += `<div class="preview-enhanced">增强: ${preview.enhancedTags.map(t => `<span class="tag-enhanced">${t}</span>`).join(' ')}</div>`;
        }
        if (preview.reducedTags.length > 0) {
          previewHtml += `<div class="preview-reduced">减弱: ${preview.reducedTags.map(t => `<span class="tag-reduced">${t}</span>`).join(' ')}</div>`;
        }
        
        previewHtml += '</div>';
      }
      
      btn.innerHTML = `
        <div class="option-name">
          ${brew.icon} ${brew.name}
          ${itemCount > 0 ? `<span style="font-size: 0.7rem; color: var(--text-secondary); margin-left: 8px;">(x${itemCount})</span>` : ''}
        </div>
        <div class="option-desc">${brew.description}</div>
        ${previewHtml}
        ${isLocked ? `<div class="option-locked">🔒 需要解锁对应工具</div>` : ''}
      `;
      
      if (!isLocked) {
        btn.onclick = () => {
          if (!hasItems) {
            this.addMessage('请先放入咖啡粉！', 'warning');
            return;
          }
          
          const preview = this.calculatePreviewTags(firstItem, 'brew', brew.id);
          
          let confirmContent = `
            <div class="preview-info">
              <div class="preview-row">
                <span class="preview-label">原料:</span>
                <span>${firstItem.icon} ${firstItem.name} x${itemCount}</span>
              </div>
              <div class="preview-row">
                <span class="preview-label">当前标签:</span>
                <span class="tag-list">${firstItem.tags.map(t => `<span class="preview-tag">${t}</span>`).join('')}</span>
              </div>
              <div class="preview-arrow">↓</div>
              <div class="preview-row">
                <span class="preview-label">制作方式:</span>
                <span>${brew.icon} ${brew.name}</span>
              </div>
          `;
          
          if (preview.addedTags.length > 0) {
            confirmContent += `<div class="preview-row preview-change">
              <span class="preview-label add">添加标签:</span>
              <span class="tag-list">${preview.addedTags.map(t => `<span class="preview-tag tag-added">${t}</span>`).join('')}</span>
            </div>`;
          }
          
          if (preview.enhancedTags.length > 0) {
            confirmContent += `<div class="preview-row preview-change">
              <span class="preview-label enhance">增强效果:</span>
              <span class="tag-list">${preview.enhancedTags.map(t => `<span class="preview-tag tag-enhanced">${t}</span>`).join('')}</span>
            </div>`;
          }
          
          if (preview.reducedTags.length > 0) {
            confirmContent += `<div class="preview-row preview-change">
              <span class="preview-label reduce">减弱效果:</span>
              <span class="tag-list">${preview.reducedTags.map(t => `<span class="preview-tag tag-reduced">${t}</span>`).join('')}</span>
            </div>`;
          }
          
          confirmContent += `
              <div class="preview-row">
                <span class="preview-label">最终标签:</span>
                <span class="tag-list">${preview.finalTags.map(t => `<span class="preview-tag tag-final">${t}</span>`).join('')}</span>
              </div>
            </div>
          `;
          
          this.showConfirmDialog(
            `确认萃取 (x${itemCount})`,
            confirmContent,
            () => this.performBrew(brew.id)
          );
        };
      }
      
      container.appendChild(btn);
    });
  },

  performRoast(roastLevelId) {
    if (this.craftState.roastItems.length === 0) {
      this.addMessage('请先放入生豆！', 'warning');
      return;
    }
    
    const roast = this.roastLevels.find(r => r.id === roastLevelId);
    if (!roast) {
      this.addMessage('无效的烘焙程度！', 'warning');
      return;
    }
    
    if (roast.requiredTool && !this.state.tools[roast.requiredTool]) {
      this.addMessage('需要解锁对应工具！', 'warning');
      return;
    }
    
    const roastCount = this.craftState.roastItems.length;
    const roastedBeans = [];
    
    this.craftState.roastItems.forEach(greenBean => {
      const roastedBean = this.createRoastedBean(greenBean, roastLevelId);
      roastedBeans.push(roastedBean);
    });
    
    roastedBeans.forEach(bean => {
      const existing = this.state.inventory.find(i => i.item.id === bean.id);
      if (existing) {
        existing.count++;
      } else {
        this.state.inventory.push({ item: bean, count: 1 });
      }
    });
    
    const firstBean = this.craftState.roastItems[0];
    const firstRoasted = roastedBeans[0];
    
    this.addMessage(`🔥 烘焙完成！`, 'success');
    this.addMessage(`   烘焙数量: ${roastCount} 个`);
    this.addMessage(`   示例: ${firstBean.icon} ${firstBean.name} → ${firstRoasted.icon} ${firstRoasted.name}`);
    this.addMessage(`   烘焙程度: ${roast.name}`);
    this.addMessage(`   示例最终标签: ${firstRoasted.tags.join(', ')}`);
    this.gainSpecializationXp('roasting', roastCount * 5);
    
    this.craftState.roastItems = [];
    this.craftState.roastLevel = roastLevelId;
    this.resetSlot('roast-slot', '点击放入生豆');
    
    const roastContainer = document.getElementById('roast-options');
    if (roastContainer) {
      roastContainer.innerHTML = '<div class="options-placeholder">放入生豆后选择烘焙程度</div>';
    }
    
    this.updateSlotCounts();
    this.updateCraftProgress(1);
    this.renderWorkshopInventory();
  },

  performGrind(grindLevelId) {
    if (this.craftState.grindItems.length === 0) {
      this.addMessage('请先放入熟豆！', 'warning');
      return;
    }
    
    const grind = this.grindLevels.find(g => g.id === grindLevelId);
    if (!grind) {
      this.addMessage('无效的研磨粗细！', 'warning');
      return;
    }
    
    if (grind.requiredTool && !this.state.tools[grind.requiredTool]) {
      this.addMessage('需要解锁对应工具！', 'warning');
      return;
    }
    
    const grindCount = this.craftState.grindItems.length;
    const powders = [];
    
    this.craftState.grindItems.forEach(roastedBean => {
      const powder = this.createCoffeePowder(roastedBean, grindLevelId);
      powders.push(powder);
    });
    
    powders.forEach(powder => {
      const existing = this.state.inventory.find(i => i.item.id === powder.id);
      if (existing) {
        existing.count++;
      } else {
        this.state.inventory.push({ item: powder, count: 1 });
      }
    });
    
    const firstBean = this.craftState.grindItems[0];
    const firstPowder = powders[0];
    
    this.addMessage(`⚙️ 研磨完成！`, 'success');
    this.addMessage(`   研磨数量: ${grindCount} 个`);
    this.addMessage(`   示例: ${firstBean.icon} ${firstBean.name} → ${firstPowder.icon} ${firstPowder.name}`);
    this.addMessage(`   研磨粗细: ${grind.name}`);
    this.addMessage(`   示例最终标签: ${firstPowder.tags.join(', ')}`);
    
    this.craftState.grindItems = [];
    this.craftState.grindLevel = grindLevelId;
    this.resetSlot('grind-slot', '点击放入熟豆');
    
    const grindContainer = document.getElementById('grind-options');
    if (grindContainer) {
      grindContainer.innerHTML = '<div class="options-placeholder">放入熟豆后选择研磨粗细</div>';
    }
    
    this.updateSlotCounts();
    this.updateCraftProgress(2);
    this.renderWorkshopInventory();
  },

  performBrew(brewMethodId) {
    if (this.craftState.brewItems.length === 0) {
      this.addMessage('请先放入咖啡粉！', 'warning');
      return;
    }
    
    const brew = this.brewMethods.find(b => b.id === brewMethodId);
    if (!brew) {
      this.addMessage('无效的萃取方式！', 'warning');
      return;
    }
    
    if (brew.requiredTool && !this.state.tools[brew.requiredTool]) {
      this.addMessage('需要解锁对应工具！', 'warning');
      return;
    }
    
    const brewCount = this.craftState.brewItems.length;
    const liquids = [];
    
    this.craftState.brewItems.forEach(powder => {
      const liquid = this.createCoffeeLiquid(powder, brewMethodId);
      liquids.push(liquid);
    });
    
    liquids.forEach(liquid => {
      const existing = this.state.inventory.find(i => i.item.id === liquid.id);
      if (existing) {
        existing.count++;
      } else {
        this.state.inventory.push({ item: liquid, count: 1 });
      }
    });
    
    const firstPowder = this.craftState.brewItems[0];
    const firstLiquid = liquids[0];
    
    this.addMessage(`💧 萃取完成！`, 'success');
    this.addMessage(`   萃取数量: ${brewCount} 个`);
    this.addMessage(`   示例: ${firstPowder.icon} ${firstPowder.name} → ${firstLiquid.icon} ${firstLiquid.name}`);
    this.addMessage(`   萃取方式: ${brew.name}`);
    this.addMessage(`   示例最终标签: ${firstLiquid.tags.join(', ')}`);
    
    this.craftState.brewItems = [];
    this.craftState.brewMethod = brewMethodId;
    this.resetSlot('brew-slot', '点击放入咖啡粉');
    
    const brewContainer = document.getElementById('brew-options');
    if (brewContainer) {
      brewContainer.innerHTML = '<div class="options-placeholder">放入咖啡粉后选择萃取方式</div>';
    }
    
    this.updateSlotCounts();
    this.updateCraftProgress(3);
    this.renderWorkshopInventory();
  },

  // 改进的调和系统：根据所有原料和工艺动态生成咖啡
  performBlend() {
    if (this.craftState.blendItems.length === 0) {
      this.addMessage('请先放入咖啡液！', 'warning');
      return;
    }
    
    const blendCount = this.craftState.blendItems.length;
    const coffees = [];

    // 批量调和按“每杯一份配料”扣料，防止少量配料复制到整批咖啡。
    if (blendCount > 1 && this.craftState.additives.length > 0) {
      const recipeCounts = this.craftState.additives.reduce((counts, additive) => {
        counts[additive.id] = (counts[additive.id] || 0) + 1;
        return counts;
      }, {});
      const missingAdditives = Object.entries(recipeCounts).filter(([itemId, perCup]) => {
        const available = this.state.inventory.find(entry => entry.item.id === itemId)?.count || 0;
        return available < perCup * (blendCount - 1);
      });

      if (missingAdditives.length > 0) {
        this.addMessage('批量调和的配料不足：每杯都需要完整的一份配方。', 'warning');
        return;
      }

      Object.entries(recipeCounts).forEach(([itemId, perCup]) => {
        const inventoryIndex = this.state.inventory.findIndex(entry => entry.item.id === itemId);
        const extraRequired = perCup * (blendCount - 1);
        this.state.inventory[inventoryIndex].count -= extraRequired;
        if (this.state.inventory[inventoryIndex].count <= 0) this.state.inventory.splice(inventoryIndex, 1);
      });
    }
    
    this.craftState.blendItems.forEach(liquid => {
      const coffee = this.createFinishedCoffee(liquid, [...this.craftState.additives]);
      coffees.push(coffee);
    });
    coffees.forEach(coffee => this.recordRecipe(coffee));
    
    if (coffees.length === 1) {
      this.craftState.finishedCoffee = coffees[0];
      this.showFinishedCoffee(coffees[0]);
      
      this.addMessage(`☕ 咖啡制作完成！`, 'success');
      this.addMessage(`   名称: ${coffees[0].name}`);
      this.addMessage(`   评分: ${coffees[0].score}`);
      this.addMessage(`   标签: ${coffees[0].tags.join(', ')}`);
      this.addMessage(`   描述: ${coffees[0].description}`);
      this.addMessage(`   建议售价: ${coffees[0].price} 金币`);
    } else {
      coffees.forEach(coffee => {
        this.state.coffeeStock.push(coffee);
      });
      
      this.addMessage(`☕ 批量咖啡制作完成！`, 'success');
      this.addMessage(`   制作数量: ${blendCount} 杯`);
      this.addMessage(`   已自动存入咖啡库存`);
    }
    
    this.craftState.blendItems = [];
    this.craftState.additives = [];
    document.getElementById('blend-btn').disabled = true;
    this.resetSlot('blend-slot', '点击放入咖啡液');
    this.renderAdditivesOptions();
    
    this.updateSlotCounts();
    this.updateCraftProgress(4);
    this.renderCoffeeInventory();
    this.renderWorkshopInventory();
    this.renderProgressSummary();
    this.saveGame();
  },

  resetSlot(slotId, placeholder) {
    const slot = document.getElementById(slotId);
    if (slot) {
      slot.classList.remove('has-item');
      slot.innerHTML = `<span style="color: var(--text-secondary); font-size: 0.8rem;">${placeholder}</span>`;
    }
  },

  updateCraftProgress(step) {
    const steps = document.querySelectorAll('#craft-progress .progress-step');
    steps.forEach((el, index) => {
      const icon = el.querySelector('.progress-step-icon');
      if (index < step) {
        el.classList.add('completed');
        if (icon) {
          icon.classList.remove('pending');
          icon.classList.add('completed');
          icon.textContent = '✓';
        }
      }
    });
  },

  showFinishedCoffee(coffee) {
    const container = document.getElementById('finished-coffee-container');
    if (!container) return;
    
    container.classList.remove('hidden');
    
    document.getElementById('finished-coffee-name').textContent = coffee.name;
    document.getElementById('finished-coffee-desc').textContent = coffee.description;
    document.getElementById('finished-coffee-positive').textContent = `+${coffee.score}`;
    document.getElementById('finished-coffee-negative').textContent = coffee.defects?.length || 0;
    document.getElementById('finished-coffee-score').textContent = `${coffee.score}/100 (💰${coffee.price})`;
    
    const tagsContainer = document.getElementById('finished-coffee-tags');
    // 将完整六维风味显示在成品卡中，确保玩家能理解同一工艺为何得到当前品质。
    const flavorNames = {
      acidity: '酸质',
      sweetness: '甜感',
      aroma: '香气',
      body: '醇厚',
      bitterness: '苦度',
      cleanliness: '洁净度'
    };
    const flavorText = Object.entries(coffee.flavorProfile || {})
      .map(([dimension, value]) => `${flavorNames[dimension] || dimension} ${value}`)
      .join(' · ');
    const breakdownText = (coffee.scoreBreakdown || [])
      .map(item => `${item.label}${item.value >= 0 ? '+' : ''}${item.value}`)
      .join(' · ');
    tagsContainer.innerHTML = `
      ${(coffee.mainFlavorTags || coffee.tags).slice(0, 3).map(t => `<span class="coffee-tag">${t}</span>`).join('')}
      <div style="width: 100%; margin-top: 8px; color: var(--text-secondary); font-size: 0.78rem;">
        风味六维：${flavorText || '暂无数据'}
      </div>
      <div style="width: 100%; margin-top: 4px; color: var(--text-secondary); font-size: 0.78rem;">
        品质依据：${breakdownText || '基础品质'}
      </div>
      <div style="width: 100%; margin-top: 4px; color: var(--accent-gold); font-size: 0.78rem;">
        稀有度/创新：${coffee.rarityInnovation?.score || 0}/20
      </div>
    `;
  },

  storeCoffee() {
    if (!this.craftState.finishedCoffee) {
      this.addMessage('没有可存储的咖啡！', 'warning');
      return;
    }
    
    this.state.coffeeStock.push(this.craftState.finishedCoffee);
    this.addMessage(`📦 咖啡已存入库存: ${this.craftState.finishedCoffee.name}`, 'success');
    
    document.getElementById('finished-coffee-container').classList.add('hidden');
    this.craftState.finishedCoffee = null;
    
    this.renderCoffeeInventory();
    this.saveGame();
  },

  // ============================================
  // 商店系统
  // ============================================
  
  updateShopStats() {
    const goldEl = document.getElementById('shop-gold');
    const repEl = document.getElementById('shop-reputation');
    const dayEl = document.getElementById('shop-day');
    if (goldEl) goldEl.textContent = this.state.gold;
    if (repEl) repEl.textContent = this.state.reputation;
    if (dayEl) dayEl.textContent = this.state.day;
    
    document.getElementById('sold-count').textContent = this.shopState.soldToday;
    document.getElementById('today-income').textContent = `${this.shopState.incomeToday}💰`;
    const satisfaction = this.shopState.soldToday > 0
      ? Math.round(this.shopState.satisfactionTotal / this.shopState.soldToday)
      : 0;
    const satisfactionEl = document.getElementById('satisfaction');
    if (satisfactionEl) satisfactionEl.textContent = `${satisfaction}%`;
    
    const totalCustomers = this.shopState.customers.length;
    const remaining = totalCustomers - this.shopState.customers.filter(c => c.served).length;
    document.getElementById('customer-count').textContent = remaining;
    const totalCountEl = document.getElementById('customer-total-count');
    if (totalCountEl) totalCountEl.textContent = totalCustomers;
  },

  // 获取并初始化单个顾客的跨日关系记录，作为回头客偏好与故事阶段的唯一来源。
  getCustomerHistory(customerName) {
    this.ensureProgressState();
    this.state.customerHistory[customerName] ||= {
      visits: 0,
      successfulOrders: 0,
      favoriteTag: null,
      lastMatch: null
    };
    return this.state.customerHistory[customerName];
  },

  // 将模板与历史偏好合成为当天顾客；回头客会把上次喜欢的主风味作为加分需求。
  buildDailyCustomer(template, index) {
    const history = this.getCustomerHistory(template.name);
    const demands = template.demands.map(demand => ({ ...demand }));
    if (history.favoriteTag && !demands.some(demand => demand.tag === history.favoriteTag)) {
      demands.push({ tag: history.favoriteTag, required: false, returningPreference: true });
    }
    history.visits++;
    const stories = this.customerStories[template.name] || ['正在逐渐了解你的咖啡。'];
    const storyIndex = Math.min(history.successfulOrders, stories.length - 1);
    return {
      ...template,
      demands,
      id: `customer_${this.state.day}_${index}_${template.name}`,
      day: this.state.day,
      served: false,
      visitCount: history.visits,
      successfulOrders: history.successfulOrders,
      isReturning: history.successfulOrders > 0,
      storyText: stories[storyIndex]
    };
  },

  generateCustomers() {
    if (this.shopState.customers.length > 0 && this.shopState.customers[0].day === this.state.day) {
      this.renderCustomers();
      this.renderDailyOrders();
      return;
    }
    
    const count = this.rules.dailyCustomerCount;
    const returningNames = Object.entries(this.state.customerHistory || {})
      .filter(([, history]) => history.successfulOrders > 0)
      .sort((a, b) => b[1].successfulOrders - a[1].successfulOrders)
      .map(([name]) => name);
    const returningTemplate = returningNames.length > 0
      ? this.customerTemplates.find(template => template.name === returningNames[0])
      : null;
    const templatePool = this.customerTemplates
      .filter(template => template.name !== returningTemplate?.name)
      .sort(() => Math.random() - 0.5);
    const selectedTemplates = [returningTemplate, ...templatePool].filter(Boolean).slice(0, count);
    const customers = selectedTemplates.map((template, index) => this.buildDailyCustomer(template, index));
    
    this.shopState.customers = customers;
    this.renderCustomers();
    this.renderDailyOrders();
    this.addMessage(`🏪 今天有 ${count} 位客人来到店里！`, 'info');
  },

  renderCustomers() {
    const container = document.getElementById('customers-grid');
    if (!container) return;
    
    container.innerHTML = '';
    
    this.shopState.customers.forEach((customer, index) => {
      if (customer.served) return;
      
      const card = document.createElement('div');
      card.className = `customer-card ${this.shopState.selectedCustomer?.id === customer.id ? 'selected' : ''}`;
      
      card.innerHTML = `
        <div class="customer-header">
          <div class="customer-avatar">${customer.avatar}</div>
          <div class="customer-info">
            <div class="customer-name">${customer.name}</div>
            <div class="customer-type">${customer.type}${customer.isReturning ? ` · 回头客第${customer.visitCount}次` : ''}</div>
          </div>
        </div>
        <div class="customer-demands">
          <div class="demands-title">需求:</div>
          <div class="demand-tags">
            ${customer.demands.map(d => `
              <span class="demand-tag ${d.required ? '' : 'optional'}">
                ${d.required ? '⭐' : '○'} ${d.tag}
              </span>
            `).join('')}
          </div>
        </div>
        <div class="customer-reward">
          <div class="reward-info">
            <div class="reward-item"><span>💰</span> ${customer.basePrice}起</div>
            <div class="reward-item"><span>⭐</span> ${customer.reputation}</div>
          </div>
        </div>
        <div class="customer-story">📖 ${customer.storyText}</div>
      `;
      
      card.onclick = () => this.selectCustomer(customer);
      container.appendChild(card);
    });
  },

  selectCustomer(customer) {
    this.shopState.selectedCustomer = customer;
    this.renderCustomers();
    this.updateMatchInfo();
    
    const area = document.getElementById('selected-customer-area');
    if (area) {
      area.innerHTML = `
        <div style="text-align: center; padding: 10px;">
          <div style="font-size: 2rem; margin-bottom: 5px;">${customer.avatar}</div>
          <div style="font-weight: bold;">${customer.name}</div>
          <div style="font-size: 0.75rem; color: var(--accent-gold); margin-top: 4px;">${customer.isReturning ? `回头客 · 第${customer.visitCount}次来访` : '初次来访'}</div>
          <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 10px;">
            需求: ${customer.demands.map(d => d.tag).join(', ')}
          </div>
          <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 8px;">${customer.storyText}</div>
        </div>
      `;
    }
    
    this.addMessage(`👋 选中客人: ${customer.name}`);
  },

  renderShopCoffeeInventory() {
    const container = document.getElementById('shop-coffee-inventory');
    const countEl = document.getElementById('shop-coffee-count');
    if (!container) return;
    
    container.innerHTML = '';
    if (countEl) countEl.textContent = `${this.state.coffeeStock.length}杯`;
    
    this.state.coffeeStock.forEach((coffee, index) => {
      const slot = document.createElement('div');
      slot.className = 'inventory-slot';
      if (this.shopState.selectedCoffee?.id === coffee.id) {
        slot.style.borderColor = '#e94560';
        slot.style.boxShadow = '0 0 10px rgba(233, 69, 96, 0.5)';
      }
      
      slot.innerHTML = `
        <span class="item-icon">☕</span>
      `;
      slot.title = `${coffee.name}\n评分: ${coffee.score}\n标签: ${coffee.tags.join(', ')}\n价值: ${coffee.price}💰\n${coffee.description}`;
      
      slot.onclick = () => this.selectCoffeeForSale(coffee, index);
      container.appendChild(slot);
    });
  },

  selectCoffeeForSale(coffee, index) {
    this.shopState.selectedCoffee = coffee;
    this.renderShopCoffeeInventory();
    this.updateMatchInfo();
    this.addMessage(`☕ 选中咖啡: ${coffee.name} (评分: ${coffee.score}, 标签: ${coffee.tags.join(', ')})`);
  },

  // 将必需需求、可选需求、品质和避雷标签合并为统一成交评分，供界面预览与实际结算复用。
  calculateCustomerMatch(customer, coffee) {
    const requiredDemands = customer.demands.filter(demand => demand.required);
    const optionalDemands = customer.demands.filter(demand => !demand.required);
    const requiredMatch = requiredDemands.filter(demand => coffee.tags.includes(demand.tag)).length;
    const optionalMatch = optionalDemands.filter(demand => coffee.tags.includes(demand.tag)).length;
    const evaluationTags = [...new Set([...(coffee.sourceTags || coffee.tags), ...coffee.tags, ...(coffee.defects || [])])];
    const avoidHits = (customer.avoidTags || []).filter(tag => evaluationTags.includes(tag));
    const defectCount = coffee.defects?.length || 0;
    const requiredRatio = requiredDemands.length > 0 ? requiredMatch / requiredDemands.length : 1;
    const optionalRatio = optionalDemands.length > 0 ? optionalMatch / optionalDemands.length : 0;
    const allRequiredMet = requiredMatch === requiredDemands.length;
    const demandScore = Math.round(requiredRatio * 40 + optionalRatio * 10);
    const craftScore = Math.round(Math.max(0, Math.min(100, coffee.score)) * 0.3);
    const rarityInnovationScore = Math.max(0, Math.min(20, coffee.rarityInnovation?.score || 0));
    const penaltyScore = avoidHits.length * 15 + defectCount * 5;
    let matchPercent = demandScore + craftScore + rarityInnovationScore - penaltyScore;
    if (!allRequiredMet) matchPercent = Math.min(matchPercent, 49);
    matchPercent = Math.max(0, Math.min(100, matchPercent));

    const businessMultiplier = 1 + this.getSpecializationTier('business') * 0.05;
    const finalPrice = Math.max(10, Math.floor((customer.basePrice * (0.55 + matchPercent / 100) + coffee.score * 0.35) * businessMultiplier));
    let reputationChange = 0;
    if (matchPercent >= 65) {
      reputationChange = Math.max(1, Math.round(customer.reputation * matchPercent / 100));
    } else if (matchPercent < 40) {
      reputationChange = -Math.max(1, Math.ceil(customer.reputation * (40 - matchPercent) / 80));
    }

    const improvementTips = [];
    requiredDemands.filter(demand => !coffee.tags.includes(demand.tag)).forEach(demand => improvementTips.push(`让主风味或工艺体现“${demand.tag}”`));
    avoidHits.forEach(tag => improvementTips.push(`避免带有“${tag}”的原料或工艺`));
    (coffee.defects || []).forEach(defect => {
      const tipMap = {
        '过萃苦涩': '改用更粗研磨，或换成适合细磨的萃取方式',
        '水感': '改用更细研磨，或延长浸泡型萃取',
        '焦味': '降低烘焙度，或改用更适合深烘的意式萃取',
        '烘焙失配': '按萃取方式推荐的烘焙度重新制作',
        '花果香衰减': '花果香豆避免深烘，优先浅烘或中烘',
        '风味过载': '将配料控制在两种以内',
        '风味混杂': '减少互相竞争的强势风味'
      };
      improvementTips.push(tipMap[defect] || `消除缺陷“${defect}”`);
    });
    if (craftScore < 21) improvementTips.push('提高处理、烘焙、研磨与萃取的兼容度');
    if (rarityInnovationScore < 10) improvementTips.push('尝试更稀有的豆子或特色处理/萃取');

    return {
      requiredMatch,
      totalRequired: requiredDemands.length,
      optionalMatch,
      totalOptional: optionalDemands.length,
      avoidHits,
      defectCount,
      allRequiredMet,
      demandScore,
      craftScore,
      rarityInnovationScore,
      penaltyScore,
      matchPercent,
      finalPrice,
      reputationChange,
      improvementTips: [...new Set(improvementTips)].slice(0, 4)
    };
  },

  updateMatchInfo() {
    const matchArea = document.getElementById('match-area');
    const matchInfoEl = document.getElementById('match-info');
    const sellBtn = document.getElementById('sell-coffee-btn');
    
    if (!this.shopState.selectedCustomer || !this.shopState.selectedCoffee) {
      matchArea.classList.add('hidden');
      if (sellBtn) sellBtn.disabled = true;
      return;
    }
    
    matchArea.classList.remove('hidden');
    
    const customer = this.shopState.selectedCustomer;
    const coffee = this.shopState.selectedCoffee;
    
    const match = this.calculateCustomerMatch(customer, coffee);
    const matchClass = match.matchPercent >= 65 ? 'success' : match.matchPercent < 40 ? 'danger' : '';
    
    matchInfoEl.innerHTML = `
      <div class="match-item">
        <span class="match-label">需求匹配（50%）:</span>
        <span class="match-value ${match.allRequiredMet ? 'success' : 'danger'}">${match.demandScore}/50 · 必需${match.requiredMatch}/${match.totalRequired} · 可选${match.optionalMatch}/${match.totalOptional}</span>
      </div>
      <div class="match-item">
        <span class="match-label">工艺品质（30%）:</span>
        <span class="match-value">${match.craftScore}/30 · 原始${coffee.score}/100</span>
      </div>
      <div class="match-item">
        <span class="match-label">稀有度/创新（20%）:</span>
        <span class="match-value">${match.rarityInnovationScore}/20</span>
      </div>
      <div class="match-item">
        <span class="match-label">避雷命中:</span>
        <span class="match-value ${match.avoidHits.length > 0 ? 'danger' : 'success'}">${match.avoidHits.join('、') || '无'}</span>
      </div>
      <div class="match-item">
        <span class="match-label">成品缺陷:</span>
        <span class="match-value ${match.defectCount > 0 ? 'danger' : 'success'}">${coffee.defects?.join('、') || '无'}</span>
      </div>
      <div class="match-item">
        <span class="match-label">处罚:</span>
        <span class="match-value ${match.penaltyScore > 0 ? 'danger' : 'success'}">${match.penaltyScore > 0 ? `-${match.penaltyScore}` : '0'}</span>
      </div>
      <div class="match-item">
        <span class="match-label">综合匹配度:</span>
        <span class="match-value ${matchClass}">${match.matchPercent}%</span>
      </div>
      <div class="match-item" style="padding-top: 10px; border-top: 1px solid var(--border-color); font-weight: bold;">
        <span class="match-label">${match.matchPercent >= 85 ? '✅ 完美匹配' : match.matchPercent >= 65 ? '👍 良好匹配' : match.matchPercent >= 40 ? '⚠️ 勉强接受' : '❌ 顾客不满'}:</span>
        <span class="match-value gold">${match.finalPrice}💰</span>
      </div>
      <div class="match-improvement">
        <strong>💡 下次改进：</strong>${match.improvementTips.length > 0 ? match.improvementTips.join('；') : '当前配方已很好地满足这位顾客。'}
      </div>
    `;
    
    if (sellBtn) {
      sellBtn.disabled = false;
      sellBtn.textContent = `💰 售卖 (${match.finalPrice}金币)`;
    }
    
    this.calculatedMatch = match;
    this.calculatedPrice = match.finalPrice;
    this.allRequiredMet = match.allRequiredMet;
  },

  sellToCustomer() {
    if (!this.shopState.selectedCustomer || !this.shopState.selectedCoffee) {
      this.addMessage('请先选择客人和咖啡！', 'warning');
      return;
    }
    
    if (!this.calculatedMatch || this.calculatedMatch.matchPercent < 65) {
      const confirmed = confirm('该咖啡的综合匹配度较低，售卖可能导致声望下降。确定继续吗？');
      if (!confirmed) return;
    }
    
    const customer = this.shopState.selectedCustomer;
    const coffee = this.shopState.selectedCoffee;
    const match = this.calculatedMatch || this.calculateCustomerMatch(customer, coffee);
    const price = match.finalPrice;
    
    this.state.gold += price;
    this.shopState.incomeToday += price;
    this.shopState.soldToday++;
    this.shopState.satisfactionTotal += match.matchPercent;
    this.state.reputation = Math.max(0, this.state.reputation + match.reputationChange);
    this.gainSpecializationXp('business', Math.max(2, Math.round(match.matchPercent / 10)));

    const customerHistory = this.getCustomerHistory(customer.name);
    customerHistory.lastMatch = match.matchPercent;
    if (match.matchPercent >= 65) {
      customerHistory.successfulOrders++;
      customerHistory.favoriteTag = (coffee.mainFlavorTags || coffee.tags)[0] || customerHistory.favoriteTag;
    }

    if (match.reputationChange > 0) {
      this.addMessage(`⭐ 匹配度 ${match.matchPercent}%，获得 ${match.reputationChange} 声望值`, 'success');
    } else if (match.reputationChange < 0) {
      this.addMessage(`📉 匹配度仅 ${match.matchPercent}%，失去 ${Math.abs(match.reputationChange)} 声望值`, 'danger');
    } else {
      this.addMessage(`⚠️ 匹配度 ${match.matchPercent}%，声望没有变化`, 'warning');
    }
    
    const coffeeIndex = this.state.coffeeStock.findIndex(c => c.id === coffee.id);
    if (coffeeIndex >= 0) {
      this.state.coffeeStock.splice(coffeeIndex, 1);
    }
    
    const customerIndex = this.shopState.customers.findIndex(c => c.id === customer.id);
    if (customerIndex >= 0) {
      this.shopState.customers[customerIndex].served = true;
    }
    
    this.addMessage(`💰 售出 ${coffee.name} 给 ${customer.name}，获得 ${price} 金币！`, 'success');
    
    this.shopState.selectedCustomer = null;
    this.shopState.selectedCoffee = null;
    this.calculatedMatch = null;
    
    this.renderCustomers();
    this.renderShopCoffeeInventory();
    this.updateShopStats();
    this.updateMatchInfo();
    this.renderDailyOrders();
    this.renderProgressSummary();
    
    document.getElementById('selected-customer-area').innerHTML = `
      <div class="no-selection">选择一位客人进行售卖</div>
    `;
    this.saveGame();
  },

  clearShopSelection() {
    this.shopState.selectedCustomer = null;
    this.shopState.selectedCoffee = null;
    this.renderCustomers();
    this.renderShopCoffeeInventory();
    this.updateMatchInfo();
    document.getElementById('selected-customer-area').innerHTML = `
      <div class="no-selection">选择一位客人进行售卖</div>
    `;
  },

  nextDay() {
    const remainingCustomers = this.shopState.customers.filter(c => !c.served);
    
    if (remainingCustomers.length > 0) {
      const confirmed = confirm(`还有 ${remainingCustomers.length} 位客人没有接待。确定要结束今天吗？`);
      if (!confirmed) return;
    }

    const satisfaction = this.shopState.soldToday > 0
      ? Math.round(this.shopState.satisfactionTotal / this.shopState.soldToday)
      : 0;
    this.state.dayHistory.push({
      day: this.state.day,
      sold: this.shopState.soldToday,
      income: this.shopState.incomeToday,
      satisfaction,
      maintenance: this.getMaintenanceCost()
    });
    if (this.state.dayHistory.length > 30) this.state.dayHistory.shift();

    this.evaluateFestival();
    const maintenanceCost = this.getMaintenanceCost();
    const paidMaintenance = Math.min(this.state.gold, maintenanceCost);
    this.state.gold -= paidMaintenance;
    if (paidMaintenance < maintenanceCost) {
      this.state.reputation = Math.max(0, this.state.reputation - 2);
      this.addMessage(`🔧 维护费需要 ${maintenanceCost} 金币，本日仅支付 ${paidMaintenance}，声望下降2。`, 'danger');
    } else {
      this.addMessage(`🔧 支付店铺与设备维护费 ${maintenanceCost} 金币。`, 'info');
    }
    
    this.state.day++;
    this.state.exploredToday = false;
    this.state.selectedMap = null;
    this.state.activeCommission = null;
    this.shopState.soldToday = 0;
    this.shopState.incomeToday = 0;
    this.shopState.satisfactionTotal = 0;
    this.shopState.customers = [];
    this.shopState.selectedCustomer = null;
    this.shopState.selectedCoffee = null;
    
    this.addMessage(`🌅 新的一天开始了！第 ${this.state.day} 天`, 'success');
    
    this.showScene('map-select-scene');
    this.saveGame();
  },

  setupEventListeners() {
    document.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      
      if (this.state.currentScene === 'explore-scene') {
        switch (key) {
          case 'arrowup':
          case 'w':
            this.movePlayer('up');
            e.preventDefault();
            break;
          case 'arrowdown':
          case 's':
            this.movePlayer('down');
            e.preventDefault();
            break;
          case 'arrowleft':
          case 'a':
            this.movePlayer('left');
            e.preventDefault();
            break;
          case 'arrowright':
          case 'd':
            this.movePlayer('right');
            e.preventDefault();
            break;
          case ' ':
            this.collectCurrentCell();
            e.preventDefault();
            break;
          case 'escape':
            this.tryExitExplore();
            break;
        }
      }
    });
    
    document.getElementById('processing-slot')?.addEventListener('click', (e) => {
      if (this.selectedWorkshopItem !== null) {
        const count = e.shiftKey ? 5 : 1;
        this.putInSlot('process', count);
      } else {
        this.removeFromSlot('process');
      }
    });
    
    document.getElementById('roast-slot')?.addEventListener('click', (e) => {
      if (this.selectedWorkshopItem !== null) {
        const count = e.shiftKey ? 5 : 1;
        this.putInSlot('roast', count);
      } else {
        this.removeFromSlot('roast');
      }
    });
    
    document.getElementById('grind-slot')?.addEventListener('click', (e) => {
      if (this.selectedWorkshopItem !== null) {
        const count = e.shiftKey ? 5 : 1;
        this.putInSlot('grind', count);
      } else {
        this.removeFromSlot('grind');
      }
    });
    
    document.getElementById('brew-slot')?.addEventListener('click', (e) => {
      if (this.selectedWorkshopItem !== null) {
        const count = e.shiftKey ? 5 : 1;
        this.putInSlot('brew', count);
      } else {
        this.removeFromSlot('brew');
      }
    });
    
    document.getElementById('blend-slot')?.addEventListener('click', (e) => {
      if (this.selectedWorkshopItem !== null) {
        const count = e.shiftKey ? 5 : 1;
        this.putInSlot('blend', count);
      } else {
        this.removeFromSlot('blend');
      }
    });
  },

  init() {
    this.setupEventListeners();
    this.updateContinueButton();
    
    document.querySelectorAll('.workstation-slot').forEach(slot => {
      slot.style.cursor = 'pointer';
    });
    
    console.log('☕ CoffeeHunter 游戏 v2.0 初始化完成！');
    console.log('📝 改进内容：');
    console.log('   - 每道工序保留前序工序的标签');
    console.log('   - 烘焙/研磨/萃取可选择参数');
    console.log('   - 咖啡名称根据原料和工艺动态生成');
    console.log('   - 保留产地信息（哥伦比亚/埃塞俄比亚/肯尼亚/巴西）');
    console.log('   - 新增独立预处理房间');
    console.log('   - 所有制作步骤支持复数材料');
    console.log('   - Shift+点击 可批量放入5个物品');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Game.init();
});
