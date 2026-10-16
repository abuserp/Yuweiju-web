const GameData = (function () {

  const ATTR = {
    fresh: { name: '鲜', color: '#4fa06b', tier: 1 },
    aroma: { name: '香', color: '#e0762e', tier: 1 },
    spicy: { name: '辛', color: '#cf3f2e', tier: 1 },
    sour:  { name: '酸', color: '#c3cc4a', tier: 1 },
    sticky:{ name: '糯', color: '#cdb896', tier: 1 },
    sweet: { name: '甜', color: '#e08fb4', tier: 2 },
    cool:  { name: '凉', color: '#4f93c4', tier: 2 },
    numb:  { name: '麻', color: '#9b59b6', tier: 3 },
    rich:  { name: '醇', color: '#c9962c', tier: 3 }
  };

  const ING = {
    rice:    { name: '米面', price: 2,  staple: true,  color: '#ddd0ad' },
    spice:   { name: '香料', price: 4,  staple: true,  color: '#a8512c' },
    veg:     { name: '时蔬', price: 4,  shelf: 2, color: '#7fae5c' },
    tofu:    { name: '豆腐', price: 5,  shelf: 2, color: '#efe6cc' },
    poultry: { name: '羽兽', price: 7,  shelf: 3, color: '#c99a6a' },
    meat:    { name: '兽肉', price: 10, shelf: 3, color: '#b8635c' },
    fish:    { name: '鳞',   price: 12, shelf: 2, color: '#7fa8b8' }
  };
  const STOCK_KEYS = Object.keys(ING).filter(k => !ING[k].staple);
  const STAPLE_KEYS = Object.keys(ING).filter(k => ING[k].staple);

  const DISHES = [

    { id: 'yangchunmian', name: '阳春面',   attrs: ['fresh'],  cost: { rice: 1 },              price: 18, cook: 2.0, unlock: { type: 'start' } },
    { id: 'jiachangdoufu',name: '家常豆腐', attrs: ['fresh'],  cost: { tofu: 1 },              price: 21, cook: 2.4, unlock: { type: 'start' } },
    { id: 'danchaofan',   name: '蛋炒饭',   attrs: ['aroma'],  cost: { rice: 1, poultry: 1 },  price: 25, cook: 2.4, unlock: { type: 'start' } },
    { id: 'youpochemian', name: '油泼扯面', attrs: ['spicy'],  cost: { rice: 1, spice: 1 },    price: 22, cook: 2.6, unlock: { type: 'start' } },
    { id: 'culiubaicai',  name: '醋溜白菜', attrs: ['sour'],   cost: { veg: 1, spice: 1 },     price: 24, cook: 2.2, unlock: { type: 'start' } },

    { id: 'shaoyushou',   name: '烧羽兽',   attrs: ['aroma', 'spicy'], cost: { poultry: 1, spice: 1 }, price: 24, cook: 3.4, unlock: { type: 'start' } },
    { id: 'zhengbaozi',   name: '蒸包子',   attrs: ['fresh', 'aroma'], cost: { rice: 1, meat: 1 },     price: 25, cook: 3.0, unlock: { type: 'start' } },
    { id: 'suanlatang',   name: '酸辣汤',   attrs: ['sour', 'spicy'],  cost: { veg: 1, spice: 1 },     price: 21, cook: 2.6, unlock: { type: 'start' } },

    { id: 'qingzhenglin', name: '清蒸鳞',   attrs: ['fresh'],           cost: { fish: 1, spice: 1 },  price: 37, cook: 4.0, unlock: { type: 'aff', at: 30 } },
    { id: 'guihuagao',    name: '桂花糕',   attrs: ['sweet', 'sticky'], cost: { rice: 1, veg: 1 },    price: 24, cook: 2.8, unlock: { type: 'aff', at: 70 } },
    { id: 'huntun',       name: '清汤馄饨', attrs: ['fresh', 'aroma'],  cost: { rice: 1, meat: 1 },   price: 30, cook: 3.0, unlock: { type: 'mastery', from: 'yangchunmian',  need: 10 } },
    { id: 'hongyufuru',   name: '红玉腐乳', attrs: ['fresh', 'aroma'],  cost: { tofu: 2, spice: 1 },  price: 32, cook: 3.4, unlock: { type: 'mastery', from: 'jiachangdoufu', need: 12 } },
    { id: 'youmensun',    name: '油焖笋',   attrs: ['fresh', 'sweet'],  cost: { veg: 2 },             price: 26, cook: 3.0, unlock: { type: 'mastery', from: 'culiubaicai',   need: 16 } },

    { id: 'lvdoutang',    name: '绿豆汤',     attrs: ['cool', 'sweet'],   cost: { veg: 1, rice: 1 },            price: 30, cook: 2.6, unlock: { type: 'aff', at: 110 } },
    { id: 'shuanglingeng',name: '霜鳞羹',     attrs: ['fresh', 'rich'],   cost: { fish: 1, tofu: 1 },           price: 41, cook: 4.4, unlock: { type: 'aff', at: 150 } },
    { id: 'baizhuolin',   name: '白灼鳞',     attrs: ['fresh'],           cost: { fish: 1 },                    price: 40, cook: 3.6, unlock: { type: 'aff', at: 190 } },
    { id: 'liangbansansi',name: '凉拌三丝',   attrs: ['sour', 'cool'],    cost: { veg: 1, spice: 1 },           price: 32, cook: 2.2, unlock: { type: 'aff', at: 230 } },
    { id: 'tangguazhan',  name: '糖瓜粘',     attrs: ['sweet'],           cost: { rice: 1 },                    price: 30, cook: 2.6, unlock: { type: 'aff', at: 270 } },
    { id: 'zhaqiehe',     name: '炸茄盒',     attrs: ['aroma', 'rich'],   cost: { veg: 1, meat: 1, rice: 1 },   price: 40, cook: 3.6, unlock: { type: 'mastery', from: 'zhengbaozi', need: 14 } },
    { id: 'congyoutui',   name: '葱油烩腿肉', attrs: ['aroma', 'fresh'],  cost: { poultry: 2, spice: 1 },       price: 42, cook: 4.6, unlock: { type: 'mastery', from: 'shaoyushou', need: 18 } },

    { id: 'maladoufu',   name: '麻辣豆腐',   attrs: ['spicy', 'numb'],            cost: { tofu: 1, spice: 2 },          price: 46, cook: 3.0, unlock: { type: 'aff', at: 310 } },
    { id: 'weilizi',     name: '白糖煨栗子', attrs: ['sweet', 'aroma'],           cost: { veg: 1, spice: 1 },           price: 41, cook: 2.8, unlock: { type: 'aff', at: 350 } },
    { id: 'shizibing',   name: '桂香柿子饼', attrs: ['sweet', 'aroma', 'sticky'], cost: { rice: 1, veg: 1 },            price: 38, cook: 3.4, unlock: { type: 'aff', at: 390 } },
    { id: 'wuxianghui',  name: '五香烩鳞',   attrs: ['fresh', 'spicy', 'aroma'],  cost: { fish: 2, tofu: 1, spice: 2 }, price: 67, cook: 6.2, unlock: { type: 'aff', at: 430 } },
    { id: 'wushengpan',  name: '五省盘',     attrs: ['fresh', 'aroma', 'sour'],   cost: { veg: 1, meat: 1, spice: 1 },  price: 48, cook: 4.4, unlock: { type: 'mastery', from: 'youpochemian', need: 20 } },

    { id: 'banlinanrou', name: '板栗炖腩肉', attrs: ['rich', 'sweet', 'aroma'],   cost: { meat: 2, veg: 1 },                     price: 66, cook: 5.6, unlock: { type: 'aff', at: 470 } },
    { id: 'maoxuewang',  name: '特辣毛血旺', attrs: ['spicy', 'numb', 'rich'],    cost: { meat: 1, poultry: 1, spice: 2 },       price: 67, cook: 6.4, unlock: { type: 'aff', at: 510 } },
    { id: 'diaolanyuqi', name: '雕栏玉砌',   attrs: ['fresh', 'rich', 'aroma'],   cost: { fish: 2, poultry: 1, veg: 1 },         price: 77, cook: 8.0, unlock: { type: 'aff', at: 545 } },
    { id: 'xuwentang',   name: '须问汤',     attrs: ['fresh', 'aroma', 'rich'],   cost: { meat: 2, poultry: 1, veg: 1 },         price: 73, cook: 7.6, unlock: { type: 'mastery', from: 'wushengpan',   need: 30 } },
    { id: 'sanxianguo',  name: '三鲜烩锅',   attrs: ['fresh', 'rich', 'aroma'],   cost: { fish: 1, meat: 1, poultry: 1, veg: 1 },price: 75, cook: 7.2, unlock: { type: 'mastery', from: 'qingzhenglin', need: 14 } },

    { id: 'changshoumian', name: '长寿面',  attrs: ['fresh', 'aroma'],         cost: { rice: 1, poultry: 1 },              price: 33, cook: 4.0, unlock: { type: 'event', by: '望' } },
    { id: 'lanroumian',    name: '烂肉面',  attrs: ['rich', 'aroma'],          cost: { meat: 1, rice: 1 },                 price: 36, cook: 3.8, unlock: { type: 'event', by: '杜遥夜与老鲤' } },
    { id: 'malalinwan',    name: '麻辣鳞丸',attrs: ['spicy', 'numb', 'fresh'], cost: { fish: 1, spice: 1 },                price: 48, cook: 4.4, unlock: { type: 'event', by: '孑与槐琥' } },
    { id: 'juhongsu',      name: '桔红酥',  attrs: ['sweet', 'aroma', 'sour'], cost: { rice: 1, veg: 1 },                  price: 38, cook: 3.6, unlock: { type: 'event', by: '煌与行箸' } },
    { id: 'yiqingerbai',   name: '一清二白',attrs: ['fresh', 'cool'],          cost: { tofu: 2, veg: 1 },                  price: 47, cook: 4.0, unlock: { type: 'event', by: '煌' } },

    { id: 'fenzhengrou',   name: '粉蒸兽肉',attrs: ['rich', 'sticky'],         cost: { meat: 1, rice: 1 },                 price: 36, cook: 4.2, unlock: { type: 'event', by: '阿贵' } },
    { id: 'shengrouhuo',   name: '胜肉火方',attrs: ['rich', 'aroma', 'sticky'],cost: { meat: 3, spice: 1 },                price: 76, cook: 7.6, unlock: { type: 'event', by: '左乐' } },
    { id: 'jinyucangxin',  name: '金玉藏心',attrs: ['rich', 'sweet', 'aroma'], cost: { poultry: 2, veg: 1 },               price: 60, cook: 6.4, unlock: { type: 'event', by: '绩' } },
    { id: 'wensiqiuju',    name: '文思秋菊',attrs: ['fresh', 'cool', 'aroma'], cost: { tofu: 1, veg: 1, fish: 1 },         price: 63, cook: 6.0, unlock: { type: 'event', by: '宁辞秋' } }
  ];

  const TAKEOUT = [
    { id: 'to_suanlafen', name: '鼎丰楼·酸辣粉',   attrs: ['sour', 'spicy', 'numb'],   price: 40, cost: 56, cook: 0 },
    { id: 'to_malaban',   name: '鼎丰楼·麻辣拌',   attrs: ['numb', 'spicy', 'aroma'],  price: 42, cost: 58, cook: 0 },
    { id: 'to_xueer',     name: '鼎丰楼·冰糖雪耳', attrs: ['sweet', 'cool', 'sticky'], price: 40, cost: 56, cook: 0 },
    { id: 'to_lingeng',   name: '鼎丰楼·高汤鳞羹', attrs: ['fresh', 'rich', 'aroma'],  price: 48, cost: 66, cook: 0 },
    { id: 'to_tangou',    name: '鼎丰楼·糯米糖藕', attrs: ['sticky', 'sweet', 'cool'], price: 38, cost: 54, cook: 0 }
  ];

  const AFFECTION = [
    { at: 0,   title: '生手', cookSpeed: 1.00 },
    { at: 110, title: '面熟', cookSpeed: 1.10 },
    { at: 250, title: '合手', cookSpeed: 1.22 },
    { at: 400, title: '得力', cookSpeed: 1.36 },
    { at: 550, title: '知味', cookSpeed: 1.52 }
  ];

  const SLOTS = [
    { need: 0, price: 0 }, { need: 0, price: 0 }, { need: 0, price: 0 },
    { need: 0, price: 0 }, { need: 0, price: 0 },
    { need: 0,   price: 100 },
    { need: 110, price: 130 },
    { need: 110, price: 160 },
    { need: 250, price: 200 },
    { need: 250, price: 240 }
  ];

  const TALK = {
    yu: {
      jam: [
        '店小胃口大，桌子摆不下。',
        '老姜你睡着了？',
        '菜堆着要凉的。',
        '再做就没地方放了。'
      ],
      idle: [
        '……刀该磨了。',
        '灶上没活，先把料理一理。',
        '今天香料用得快。',
        '哥哥姐姐会不会来呢？'
      ],
      cooking: [
        '火候到了。',
        '这锅得再颠两下。',
        '别催，快了。',
        '油温正好。'
      ]
    },
    guest: {
      waiting: [
        '这菜还没好啊……',
        '闻着倒是挺香。',
        '再等等，再等等。',
        '肚子都叫了。',
        '不急，不急……大概。'
      ],
      again: [
        '再来一道。',
        '没吃够，再点一个。',
        '好吃，再上一道！',
        '食指大动啊！'
      ],
      eatBoth: [
        '活着就为了这一口',
        '就冲这一口，值了。',
        '太他妈香了。',
        '这才叫会做菜。'
      ],
      eatOne: [
        '嗯，就是这个味。',
        '差着点意思，不过挺香。',
        '还行，能吃饱。',
        '热乎的就是不一样。'
      ],
      eatMiss: [
        '……我要的好像不是这个。',
        '这是什么味儿啊。',
        '罢了，来都来了。',
        '老姜你干嘛?'
      ],
      leaveBoth: [
        '下回还来，一定。',
        '这家我记住了。',
        '不愧是余味居',
        '明天我还来。'
      ],
      leaveOne: [
        '吃饱了，走了。',
        '还行吧，下次再看。',
        '钱搁桌上了啊。'
      ],
      leaveMiss: [
        '唉，这顿算白吃了。',
        '下次我说清楚点。',
        '……不评价了。',
        '钱照付，话不多说。'
      ],
      angry: [
        '不等了。',
        '算了，换一家。',
        '这店忙不过来啊。',
        '老姜睡着了？'
      ]
    },
    jiang: {
      idle: [
        '今天人不少。',
        '大厨，还顶得住吗？',
        '账还没记呢。',
        '外头起风了。'
      ],
      combo: [
        '手顺起来了！',
        '就这个节奏。',
        '大厨跟上！'
      ],

      stuffed: [
        '客官，悠着点。',
        '这是要把本吃回本啊。',
        '胃口不小啊这位。',
        '再吃可扶墙了啊。'
      ]
    },
    order: {
      one: [
        '累了一天，想吃点 {taste} 的东西呢。',
        '今天就想来点 {taste} 的。',
        '有没有 {taste} 一些的？',
        '嘴里没味，来点 {taste} 的吧。'
      ],
      again: [
        '我不是点过了么？',
        '刚才那道不做了？',
        '换一道也行，看你。',
        '……嗯？还要再点？'
      ],
      two: [
        '累了一天，想吃点 {taste} 的东西呢。',
        '这会儿最馋 {taste} 这一口。',
        '要是有 {taste} 的，那就再好不过了。',
        '走了半天路，想吃 {taste} 的。'
      ]
    }
  };

  function talk(who, key) {
    const pool = TALK[who] && TALK[who][key];
    if (!pool || !pool.length) return '';
    return pool[Math.floor(Math.random() * pool.length)];
  }

  const CUSTOMERS = [

    { id: 'jiefang',  name: '街坊',       color: '#8c9bb0', weight: 4, patience: 40, pay: 1.00, cravePool: null },
    { id: 'tianshi',  name: '天师',       color: '#7d6f9c', weight: 1, patience: 32, pay: 1.15, cravePool: null },
    { id: 'dalisi',   name: '大理寺官员', color: '#6f8ea8', weight: 1, patience: 28, pay: 1.20, cravePool: null },
    { id: 'youke',    name: '游客',       color: '#c2a24a', weight: 2, patience: 36, pay: 1.10, cravePool: null },
    { id: 'xunwei',   name: '巡卫',       color: '#6f9e8c', weight: 2, patience: 44, pay: 0.95, cravePool: null },
    { id: 'xuesheng', name: '学生',       color: '#b8896a', weight: 3, patience: 48, pay: 0.80, cravePool: null }
  ];

  const CONFIG = {
    tile: 44,
    dayLength: 100,
    maxConcurrent: 4,
    spawnBase: 9.0,
    spawnMin: 4.5,
    spawnDayStep: 0.25,
    pairChance: 0.20,
    playerSpeed: 168,

    stepLoop: true,

    stepLoopGuest: true,
    stepDist: 30,
    stepDistGuest: 34,
    stepGuestGap: 0.11,
    customerSpeed: 108,
    reach: 68,
    tableReach: 74,
    counterCap: 4,
    hatchCap: 2,
    eatTime: 3.2,
    wrongPay: 0.5,
    bothPay: 1.2,
    twoCravingChance: 0.55,

    reorderChance: 0.5,
    reorderMax: 2,
    talkAfter: 0.5,
    growlAt: 0.25,
    aff: { served: 1, matched: 1, both: 1, angry: -3, wrong: -2, dismiss: -1 },
    comboMax: 8,
    comboSpeed: 0.5,
    comboMove: 0.35,
    comboFlow: 0.35,
    returnChance: 0.12,

    yuStation: [
      { x: 192, y: 152 },
      { x: 152, y: 152 }
    ],
    yuStationPick: 'rotate',
    yuIdle:    { x: 305, y: 152 },

    seatX: { '2,8': 119, '3,8': 161, '6,8': 298, '7,8': 340,
             '2,11': 124, '7,11': 328, '2,14': 124, '7,14': 328 },
    seatY: { '2,8': 391, '3,8': 391, '6,8': 391, '7,8': 391,
             '2,11': 512, '7,11': 512, '2,14': 638, '7,14': 638 },

    blockers: [
      { x: 276, y: 675, w: 128, h: 73 },
      { x: 95,  y: 307, w: 89, h: 69 },
      { x: 266, y: 307, w: 89, h: 69 },
      { x: 96,  y: 434, w: 53, h: 58 },
      { x: 302, y: 434, w: 53, h: 58 },
      { x: 96,  y: 562, w: 53, h: 62 },
      { x: 302, y: 562, w: 53, h: 62 }
    ],

    readySlots: [
      { x: 148, y: 200 },
      { x: 187, y: 200 },
      { x: 226, y: 200 },
      { x: 265, y: 200 }
    ],
    specialEveryDay: false,

    specialChance: 0.7,
    specialAt: 0.5,
    spoilage: true,
    sellRate: 0.5,
    takeoutWait: 6,
    rentBase: 50,
    rentGrow: 12,
    startMoney: 340,
    startIngredients: {},
    startMenu: ['yangchunmian', 'jiachangdoufu', 'danchaofan', 'youpochemian', 'culiubaicai']
  };

  const MAP = [
    '##########',
    '##KKKKKK##',
    '##KKKKKK##',
    '##KKKKKK##',
    '##CCCCCC##',
    '#........#',
    '#........#',
    '#.WW..WW.#',
    '#........#',
    '#........#',
    '#.T....T.#',
    '#........#',
    '#........#',
    '#.T....T.#',
    '#........#',
    '#.....XXO#',
    '####DD####'
  ];

  function dish(id) { return DISHES.find(d => d.id === id) || TAKEOUT.find(d => d.id === id); }
  function isTakeoutDish(d) { return TAKEOUT.indexOf(d) >= 0; }
  function dishColor(d) { return ATTR[d.attrs[0]].color; }
  function attrName(k) { return ATTR[k].name; }
  function ingCost(d) {
    return Object.keys(d.cost).reduce((s, k) => s + ING[k].price * d.cost[k], 0);
  }

  function takeoutPrice(d) { return d.cost; }
  function netProfit(d) { return d.price - ingCost(d); }
  function bestNet(d) { return Math.round(d.price * CONFIG.bothPay) - ingCost(d); }
  function hiddenUntilUnlocked(d) { return d.unlock.type === 'event' || d.unlock.type === 'mastery'; }

  function unlockText(d) {
    const u = d.unlock;
    if (u.type === 'start') return '开张菜';
    if (u.type === 'aff') return '默契 ' + u.at;
    if (u.type === 'event') return u.by + ' 传授';
    if (u.type === 'mastery') {
      const from = dish(u.from);
      return (from ? from.name : u.from) + ' 做够 ' + u.need + ' 次';
    }
    return '';
  }

  function menuAttrs(menuIds) {
    const out = [];
    (menuIds || []).forEach(id => {
      const dd = dish(id);
      if (dd) dd.attrs.forEach(a => { if (out.indexOf(a) < 0) out.push(a); });
    });
    return out;
  }

  function pickCravings(menuIds, unlockedAttrs) {
    const pool = menuAttrs(menuIds);
    if (!pool.length) return [];
    const first = pool[Math.floor(Math.random() * pool.length)];
    if (Math.random() > CONFIG.twoCravingChance) return [first];
    const wide = (unlockedAttrs && unlockedAttrs.length) ? unlockedAttrs : pool;
    const rest = wide.filter(a => a !== first);
    if (!rest.length) return [first];
    return [first, rest[Math.floor(Math.random() * rest.length)]];
  }

  function pickCustomerType() {
    const total = CUSTOMERS.reduce((s, c) => s + c.weight, 0);
    let r = Math.random() * total;
    for (const c of CUSTOMERS) { r -= c.weight; if (r <= 0) return c; }
    return CUSTOMERS[0];
  }

  return {
    ATTR, ING, STOCK_KEYS, STAPLE_KEYS, DISHES, TAKEOUT, AFFECTION, SLOTS, CUSTOMERS, CONFIG, MAP, TALK, talk,
    dish, dishColor, attrName, ingCost, netProfit, bestNet, takeoutPrice, unlockText, hiddenUntilUnlocked, isTakeoutDish,
    pickCravings, pickCustomerType, menuAttrs
  };
})();
