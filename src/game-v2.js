// ============================================
// CoffeeHunter 游戏主逻辑 v2
// 改进：保留每道工序的标签，不同原料产生不同产物
// ============================================

const Game = {
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
    discovered: {}
  },
  
  exploreState: {
    map: [],
    playerPos: { x: 0, y: 0 },
    mapWidth: 17,
    mapHeight: 13,
    exitPoints: [],
    dangerPoints: [],
    revealedCells: new Set(),
    collectedItems: 0
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
    incomeToday: 0
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
      textureBonus: 'light'
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
      removeTags: ['清爽', '干净通透']
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
      removeTags: ['焦味', '木质苦']
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
      basePrice: 70,
      reputation: 14
    }
  ],

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
      type: 'processed_bean',
      icon: process.icon,
      description: `使用${process.name}处理的${greenBean.name}`,
      origin: greenBean.origin,
      processMethod: processMethodId,
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
      roastLevel: roastLevel,
      processMethod: greenBean.processMethod,
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
      roastLevel: roastedBean.roastLevel,
      grindLevel: grindLevel,
      processMethod: roastedBean.processMethod,
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
      roastLevel: powder.roastLevel,
      grindLevel: powder.grindLevel,
      brewMethod: brewMethod,
      processMethod: powder.processMethod,
      tags: tags,
      basePowder: powder,
      brewInfo: brew
    };
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
    
    const name = this.generateCoffeeName(coffeeLiquid, additives, allTags);
    
    const baseScore = 5;
    const roastBonus = coffeeLiquid.roastLevel === 'medium' ? 2 : 0;
    const additiveBonus = additives.length * 2;
    const originBonus = coffeeLiquid.origin ? 1 : 0;
    const specialTagBonus = allTags.includes('特色') ? 3 : 0;
    
    const score = baseScore + roastBonus + additiveBonus + originBonus + specialTagBonus + Math.floor(Math.random() * 5);
    
    const basePrice = 30 + score * 5;
    
    return {
      id: `coffee_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name,
      tags: allTags,
      score: score,
      price: basePrice,
      origin: coffeeLiquid.origin,
      roastLevel: coffeeLiquid.roastLevel,
      grindLevel: coffeeLiquid.grindLevel,
      brewMethod: coffeeLiquid.brewMethod,
      baseLiquid: coffeeLiquid,
      additives: [...additives],
      description: this.generateCoffeeDescription(coffeeLiquid, additives, allTags)
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
        this.renderMapCards();
        this.updateMenuStats();
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
      discovered: discovered
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
    
    this.shopState = { customers: [], selectedCustomer: null, selectedCoffee: null, soldToday: 0, incomeToday: 0 };
    this.messages = [];
    
    this.addMessage('🎮 欢迎来到 CoffeeHunter！', 'success');
    this.addMessage('选择一个地区开始你的咖啡探索之旅！');
    
    this.showScene('map-select-scene');
  },
  
  showHelp() {
    alert(`CoffeeHunter 游戏说明 v2.0\n\n` +
          `【游戏流程】\n` +
          `1. 地图选择：选择不同难度的地区探索\n` +
          `2. 探索：使用方向键或WASD移动，采集咖啡豆和材料\n` +
          `3. 制作：在工坊烘焙→研磨→萃取→调和咖啡\n` +
          `4. 售卖：在商店卖给客人，匹配需求获得更多金币\n\n` +
          `【制作系统改进】\n` +
          `• 不同生豆烘焙后保留原有标签（哥伦比亚/埃塞俄比亚等）\n` +
          `• 烘焙程度影响标签（浅烘/中烘/深烘）\n` +
          `• 研磨粗细影响标签（粗磨/中磨/细磨）\n` +
          `• 萃取方式影响标签（意式/手冲/冷萃）\n` +
          `• 最终咖啡名称根据原料和工艺动态生成\n\n` +
          `【操作】\n` +
          `↑↓←→ / WASD：移动\n` +
          `空格键：采集\n` +
          `点击物品选择，点击装置槽位放入`);
  },

  // ============================================
  // 地图选择
  // ============================================
  
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
    this.renderMapCards();
    
    const btn = document.getElementById('start-explore-btn');
    if (btn) btn.disabled = false;
    
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
    
    this.initializeExploreMap();
    this.showScene('explore-scene');
    this.addMessage(`🚀 开始探索 ${this.state.selectedMap.icon} ${this.state.selectedMap.name}！`, 'success');
    this.addMessage('使用方向键移动，空格键采集物品。');
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
        
        map[y][x] = { position: { x, y }, isRevealed, terrain, items, isExit: false, isDanger: false };
      }
    }
    
    map[startY][startX].isExit = true;
    map[startY][startX].terrain = 'exit';
    this.exploreState.exitPoints.push({ x: startX, y: startY });
    
    const exit2X = width - 2 - Math.floor(Math.random() * 3);
    const exit2Y = Math.floor(Math.random() * (height - 2)) + 1;
    if (exit2Y !== startY || exit2X !== startX) {
      map[exit2Y][exit2X].isExit = true;
      map[exit2Y][exit2X].terrain = 'exit';
      this.exploreState.exitPoints.push({ x: exit2X, y: exit2Y });
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
    
    const currentMapId = this.state.selectedMap?.id;
    const mapDiscovered = currentMapId ? this.getMapDiscovered(currentMapId) : null;
    
    const existing = this.state.inventory.find(i => i.item.id === item.id);
    if (existing) {
      existing.count++;
    } else {
      this.state.inventory.push({ item: { ...item }, count: 1 });
    }
    this.exploreState.collectedItems++;
    
    if (mapDiscovered && !mapDiscovered.items.has(item.id)) {
      mapDiscovered.items.add(item.id);
      this.addMessage(`📖 发现稀有素材: ${item.icon} ${item.name}！`, 'success');
    }
    
    const triggerText = triggerType === 'walk' ? '行走时' : '采集时';
    this.addMessage(`✨ ${triggerText}幸运获得稀有豆: ${item.icon} ${item.name}！`, 'success');
    
    this.renderExploreInventory();
    return true;
  },

  movePlayer(direction) {
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
    
    if (cell.isDanger) {
      const dangerType = '野生动物出没';
      const currentMapId = this.state.selectedMap?.id;
      const mapDiscovered = currentMapId ? this.getMapDiscovered(currentMapId) : null;
      
      if (mapDiscovered && !mapDiscovered.dangers.has(dangerType)) {
        mapDiscovered.dangers.add(dangerType);
        this.addMessage(`📖 在本地区发现新危险: ${dangerType}！`, 'danger');
      }
      this.addMessage('⚠️ 遇到野生动物！无法前往该位置。', 'danger');
      return;
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
    
    if (!cell.isExit && !cell.isDanger) {
      if (Math.random() < 0.001) {
        const mapData = this.state.selectedMap;
        const rareItem = this.getRandomRareItem(mapData);
        if (rareItem) {
          this.collectRareItem(rareItem, 'walk');
        }
      }
    }
    
    if (cell.isExit) {
      this.addMessage('🚪 到达逃离点！点击此处或按ESC结束探索。', 'success');
    }
    
    this.renderExploreMap();
  },

  collectCurrentCell() {
    const pos = this.exploreState.playerPos;
    const cell = this.exploreState.map[pos.y][pos.x];
    
    if (!cell || cell.items.length === 0) {
      this.addMessage('这里没有可采集的物品。', 'warning');
      return;
    }
    
    const currentMapId = this.state.selectedMap?.id;
    const mapDiscovered = currentMapId ? this.getMapDiscovered(currentMapId) : null;
    
    let collectedGreenBean = false;
    
    cell.items.forEach(itemId => {
      const item = this.baseItems[itemId];
      if (item) {
        const existing = this.state.inventory.find(i => i.item.id === itemId);
        if (existing) {
          existing.count++;
        } else {
          this.state.inventory.push({ item: { ...item }, count: 1 });
        }
        this.exploreState.collectedItems++;
        
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
    
    cell.items = [];
    this.renderExploreMap();
    this.renderExploreInventory();
  },

  updateExploreProgress() {
    const total = this.exploreState.mapWidth * this.exploreState.mapHeight;
    const revealed = this.exploreState.revealedCells.size;
    const progress = Math.floor((revealed / total) * 100);
    
    const progressEl = document.getElementById('explore-progress');
    const foundEl = document.getElementById('explore-found');
    const exitEl = document.getElementById('exit-count');
    const itemsEl = document.getElementById('explore-items');
    
    if (progressEl) progressEl.textContent = `${progress}%`;
    if (foundEl) foundEl.textContent = this.exploreState.collectedItems;
    if (exitEl) exitEl.textContent = `${this.exploreState.exitPoints.length}/2`;
    if (itemsEl) itemsEl.textContent = this.state.inventory.reduce((sum, i) => sum + i.count, 0);
  },

  renderExploreInventory() {
    const container = document.getElementById('explore-inventory');
    const countEl = document.getElementById('inventory-count');
    if (!container) return;
    
    container.innerHTML = '';
    
    const totalCount = this.state.inventory.reduce((sum, i) => sum + i.count, 0);
    if (countEl) countEl.textContent = `${totalCount}件`;
    
    this.state.inventory.forEach(invItem => {
      const slot = document.createElement('div');
      slot.className = 'inventory-slot';
      slot.innerHTML = `
        <span class="item-icon">${invItem.item.icon}</span>
        ${invItem.count > 1 ? `<span class="item-count">${invItem.count}</span>` : ''}
      `;
      slot.title = `${invItem.item.name}: ${invItem.item.description}\n数量: ${invItem.count}\n标签: ${invItem.item.tags.join(', ')}`;
      container.appendChild(slot);
    });
  },

  tryExitExplore() {
    const pos = this.exploreState.playerPos;
    const cell = this.exploreState.map[pos.y][pos.x];
    
    if (cell.isExit) {
      this.exitExplore();
    } else {
      const confirmed = confirm('确定要结束探索吗？将返回咖啡制作工坊。');
      if (confirmed) {
        this.exitExplore();
      }
    }
  },

  exitExplore() {
    this.addMessage(`🎉 探索完成！`, 'success');
    this.addMessage(`本次采集了 ${this.exploreState.collectedItems} 个物品`);
    this.addMessage('前往工坊制作咖啡，然后卖给客人获取金币和声望！');
    
    this.state.exploredToday = true;
    this.showScene('workshop-scene');
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
        btn.disabled = selectedCount >= invItem.count || this.craftState.additives.length >= 3;
        
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
  showOptionsDialog(title, options, callback) {
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
    
    dialog.addEventListener('click', () => {
      document.body.removeChild(dialog);
    });
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
    
    this.craftState.blendItems.forEach(liquid => {
      const coffee = this.createFinishedCoffee(liquid, [...this.craftState.additives]);
      coffees.push(coffee);
    });
    
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
    document.getElementById('finished-coffee-negative').textContent = '0';
    document.getElementById('finished-coffee-score').textContent = `${coffee.score} (💰${coffee.price})`;
    
    const tagsContainer = document.getElementById('finished-coffee-tags');
    tagsContainer.innerHTML = coffee.tags.map(t => `<span class="coffee-tag">${t}</span>`).join('');
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
    
    const totalCustomers = this.shopState.customers.length;
    const remaining = totalCustomers - this.shopState.customers.filter(c => c.served).length;
    document.getElementById('customer-count').textContent = remaining;
  },

  generateCustomers() {
    if (this.shopState.customers.length > 0 && this.shopState.customers[0].day === this.state.day) {
      this.renderCustomers();
      return;
    }
    
    const count = 5 + Math.floor(Math.random() * 3);
    const customers = [];
    
    for (let i = 0; i < count; i++) {
      const template = this.customerTemplates[Math.floor(Math.random() * this.customerTemplates.length)];
      customers.push({
        ...template,
        id: `customer_${i}`,
        day: this.state.day,
        served: false
      });
    }
    
    this.shopState.customers = customers;
    this.renderCustomers();
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
            <div class="customer-type">${customer.type}</div>
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
          <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 10px;">
            需求: ${customer.demands.map(d => d.tag).join(', ')}
          </div>
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
    
    let requiredMatch = 0;
    let optionalMatch = 0;
    let totalRequired = 0;
    
    customer.demands.forEach(demand => {
      const matches = coffee.tags.includes(demand.tag);
      if (demand.required) {
        totalRequired++;
        if (matches) requiredMatch++;
      } else {
        if (matches) optionalMatch++;
      }
    });
    
    const allRequiredMet = requiredMatch === totalRequired;
    const matchScore = requiredMatch * 2 + optionalMatch;
    
    let finalPrice;
    if (allRequiredMet) {
      finalPrice = Math.floor(customer.basePrice * (1 + matchScore * 0.2) + coffee.score * 2);
    } else {
      finalPrice = Math.floor(coffee.price * 0.5);
    }
    
    matchInfoEl.innerHTML = `
      <div class="match-item">
        <span class="match-label">必需需求匹配:</span>
        <span class="match-value ${allRequiredMet ? 'success' : 'danger'}">${requiredMatch}/${totalRequired}</span>
      </div>
      <div class="match-item">
        <span class="match-label">可选需求匹配:</span>
        <span class="match-value">${optionalMatch}</span>
      </div>
      <div class="match-item">
        <span class="match-label">客人需求标签:</span>
        <span class="match-value">${customer.demands.map(d => d.tag).join(', ')}</span>
      </div>
      <div class="match-item">
        <span class="match-label">咖啡标签:</span>
        <span class="match-value">${coffee.tags.join(', ')}</span>
      </div>
      <div class="match-item" style="padding-top: 10px; border-top: 1px solid var(--border-color); font-weight: bold;">
        <span class="match-label">${allRequiredMet ? '✅ 完美匹配' : '⚠️ 需求不满足，仅能售出半价'}:</span>
        <span class="match-value gold">${finalPrice}💰</span>
      </div>
    `;
    
    if (sellBtn) {
      sellBtn.disabled = false;
      sellBtn.textContent = `💰 售卖 (${finalPrice}金币)`;
    }
    
    this.calculatedPrice = finalPrice;
    this.allRequiredMet = allRequiredMet;
  },

  sellToCustomer() {
    if (!this.shopState.selectedCustomer || !this.shopState.selectedCoffee) {
      this.addMessage('请先选择客人和咖啡！', 'warning');
      return;
    }
    
    if (!this.allRequiredMet) {
      const confirmed = confirm('该咖啡不满足客人的全部必需需求！确定要售卖吗？客人可能会不满意。');
      if (!confirmed) return;
    }
    
    const customer = this.shopState.selectedCustomer;
    const coffee = this.shopState.selectedCoffee;
    const price = this.calculatedPrice || coffee.price;
    
    this.state.gold += price;
    this.shopState.incomeToday += price;
    this.shopState.soldToday++;
    
    let reputationGain = 0;
    if (this.allRequiredMet) {
      // 完美匹配，获得全部声望
      reputationGain = customer.reputation;
      this.addMessage(`⭐ 完美匹配！获得 ${reputationGain} 声望值`, 'success');
    } else {
      // 不完美匹配，根据匹配程度计算声望
      let requiredMatch = 0;
      let optionalMatch = 0;
      let totalRequired = 0;
      
      customer.demands.forEach(demand => {
        const matches = coffee.tags.includes(demand.tag);
        if (demand.required) {
          totalRequired++;
          if (matches) requiredMatch++;
        } else {
          if (matches) optionalMatch++;
        }
      });
      
      // 计算声望值：必需需求匹配权重更高
      reputationGain = Math.floor((requiredMatch / totalRequired) * customer.reputation * 0.6 + 
                                (optionalMatch / (customer.demands.length - totalRequired || 1)) * customer.reputation * 0.4);
      if (reputationGain > 0) {
        this.addMessage(`⭐ 部分匹配！获得 ${reputationGain} 声望值`, 'info');
      } else {
        this.addMessage(`⚠️ 匹配度太低，未获得声望值`, 'warning');
      }
    }
    
    this.state.reputation += reputationGain;
    
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
    
    this.renderCustomers();
    this.renderShopCoffeeInventory();
    this.updateShopStats();
    this.updateMatchInfo();
    
    document.getElementById('selected-customer-area').innerHTML = `
      <div class="no-selection">选择一位客人进行售卖</div>
    `;
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
    
    this.state.day++;
    this.state.exploredToday = false;
    this.shopState.soldToday = 0;
    this.shopState.incomeToday = 0;
    this.shopState.customers = [];
    
    this.addMessage(`🌅 新的一天开始了！第 ${this.state.day} 天`, 'success');
    
    this.showScene('map-select-scene');
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