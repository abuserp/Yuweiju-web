(function () {
  const JIANG = { who: '老姜', side: 'right', color: '#f0b24a', char: 'Laojiang' };
  const YU = { who: '余', side: 'right', color: '#5f9e8c', char: 'Yu' };
  const say = (base, text, extra) => Object.assign({}, base, { text: text }, extra || {});

  const LAOLI = { who: '老鲤', color: '#c2a24a', char: 'Laolee' };
  const DUYE = { who: '杜遥夜', color: '#6f8ea8', char: 'Duyaoye' };

  const pack = {
    id: 'yan-guests',
    name: '炎国来客',
    version: 1,

    guests: [

      {
        id: 'wang', name: '望', color: '#b8452f',
        patience: 66, pay: 2.0, crave: ['fresh', 'sticky'],
        appear: { minDay: 2, weight: 3, cooldown: 2, maxVisits: 3 },
        stages: [
          {
            visit: 1,
            lines: [

              say(YU, '唉，也不知道我二哥现在怎么样了。', { look: 'Avg_avg_2026_yu_1-11$1' , bgm: 'm_dia_path_loop.wav' }),
              say(JIANG, '不是说在罗德岛逮住了本人么，有工作了挺好的。', { look: 'Avg_avg_npc_1621_1-2$1' }),
              say(YU, '不是这样的，大哥说，那只是二哥的一个化身，只是个小小棋子。', { look: 'Avg_avg_2026_yu_1-10$1' }),
              say(JIANG, '还挺方便。', { look: 'Avg_avg_npc_1621_1-3$1' }),
              say(YU, '别打岔！二哥本体还待在冰冷的岁陵，万一他哪天沉沉睡去，化身的力量就会消失。', { look: 'Avg_avg_2026_yu_1-2$1' }),
              say(JIANG, '倒是给秉烛人省事了。', { look: 'Avg_avg_npc_1621_1-4$1' }),
              say(YU, '我每天担心的茶不思饭不想，看谁都像二哥，已经影响到视觉了，进来的顾客好像二哥啊。', { look: 'Avg_avg_2026_yu_1-4$1', sfx: 'guest.enter' }),
              { who: '望', text: '……', char: 'Wang', look: 'Avg_avg_2027_wang_1-11$1' },
              say(JIANG, '坏了，我怎么看他也像你二哥，这也能传染？', { look: 'Avg_avg_npc_1621_1-9$1' }),
              { who: '望', text: '……', char: 'Wang', look: 'Avg_avg_2027_wang_1-11$1' },
              { who: '望', text: '来一碗面。', char: 'Wang', look: 'Avg_avg_2027_wang_1-3$1' },
              say(YU, '二哥！！！！！', { look: 'Avg_avg_2026_yu_1-6$1' })
            ],
            effects: { flags: ['met_wang'] }
          },
          {
            visit: 2,
            lines: [
              say(YU, '二哥你怎么从岁陵里出来了。', { look: 'Avg_avg_2026_yu_1-8$1' , bgm: 'm_dia_path_loop.wav'}),
              { who: '望', text: '我并非本体……，只是受博士所托办事，偶然路过这里。', char: 'Wang', look: 'Avg_avg_2027_wang_1-4$1' },
              say(YU, '上次大战在即，你怕是在破庙里没怎么品出滋味，今天难得回家一趟，我给你好好做一顿！', { look: 'Avg_avg_2026_yu_1-20$1' }),
              { who: '望', text: '不必那么复杂。', char: 'Wang', look: 'Avg_avg_2027_wang_1-9$1' },
              say(YU, '不复杂不复杂！', { look: 'Avg_avg_2026_yu_1-20$1', exit: 'slideRight', loopStart: { id: 'kitchen.wok', vol: 0.2 } }),
              { who: '望', text: '他在这里过的怎么样。', char: 'Wang', look: 'Avg_avg_2027_wang_1-11$1' },
              say(JIANG, '过得挺好，就是每个月房租挺愁人。', { look: 'Avg_avg_npc_1621_1-4$1' }),
              { who: '望', text: '这房子是老七的，还账确实是个大事。', char: 'Wang', look: 'Avg_avg_2027_wang_1-5$1' },
              { who: '熟客', text: '老姜，再加个菜！', color: '#8c9bb0', char: 'Npc' },
              say(JIANG, '来了！您先等着，我先去招呼下客人。', { look: 'Avg_avg_npc_1621_1-5$1' }),
              { who: '望', text: '（这次来本就是去大理寺找人，先去对面看看人在不在吧）', char: 'Wang', look: 'Avg_avg_2027_wang_1-9$1' },
              { who: '望', text: '（姑且放一枚棋子占座）', char: 'Wang', look: 'Avg_avg_2027_wang_1-10$1' },
              { who: '望', text: '（离去）', char: 'Wang', look: 'Avg_avg_2027_wang_1-10$1', exit: 'fade', loopStop: 'kitchen.wok' },
              say(YU, '二哥！饭来了！', { look: 'Avg_avg_2026_yu_1-20$1', fx: 'slideLeft' }),
              { who: '棋子', text: '……', color: '#5c6470', noPortrait: true, bgmStop: true, sfx: 'story.reveal', hold: 2500 },
              say(YU, '二哥！！！！！', { look: 'Avg_avg_2026_yu_1-10$1' })
            ],
            effects: { unlockDish: ['changshoumian'], affection: 5 }
          },
          {
            visit: 3,
            lines: [
              say(YU, '老姜！我二哥怎么变棋子了？', { look: 'Avg_avg_2026_yu_1-8$1', bgm:'m_dia_mist_loop.wav' }),
              say(JIANG, '我不道啊，刚才还在呢，我去给李叔点单，回头就变成这个了。', { look: 'Avg_avg_npc_1621_1-8$1' }),
              say(YU, '我最担心的事情还是发生了啊！！', { look: 'Avg_avg_2026_yu_1-10$1' }),
              say(YU, '我还给你烤了串！！', { look: 'Avg_avg_2026_yu_1-13$1' }),
              say(YU, '早知道是最后一面我就烤嫩点了啊！', { look: 'Avg_avg_2026_yu_1-14$1' }),
              say(JIANG, '大厨，节哀顺变。', { look: 'Avg_avg_npc_1621_1-10$1' }),
              { who: '棋子', text: '……', color: '#5c6470', noPortrait: true, bgmStop: true },
              { who: '望', text: '（进门）', char: 'Wang', look: 'Avg_avg_2027_wang_1-10$1', fx: true , sfx: 'guest.enter'},
              { who: '望', text: '发生了什么。', char: 'Wang', look: 'Avg_avg_2027_wang_1-11$1' },
              { who: '重岳', text: '二弟，博士说还有个附件补充，我给你送过来了。', color: '#4f6d8c', char: 'Chyue', look: 'Avg_avg_2024_chyue_1-11$1', fx: 'slideLeft' ,  sfx: 'guest.enter'},
              say(YU, '（泪眼婆娑）', { look: 'Avg_avg_2026_yu_1-14$1' }),
              { who: '重岳', text: '......', color: '#4f6d8c', char: 'Chyue', look: 'Avg_avg_2024_chyue_1-8$1' },
              { who: '颉?', text: '你又欺负幺弟。', color: '#9b59b6', char: 'Jie', look: 'Avg_avg_npc_2125_1-6$1' },
              { who: '望', text: '……', char: 'Wang', look: 'Avg_avg_2027_wang_1-2$1' },
              { who: '重岳', text: '说话！', color: '#4f6d8c', char: 'Chyue', look: 'Avg_avg_2024_chyue_1-6$1' },
              { who: '望', text: '搞么子。', char: 'Wang', look: 'Avg_avg_2027_wang_1-3$1' },
              say(YU, '二哥！！！', { look: 'Avg_avg_2026_yu_1-10$1',sfx:'story.fight' })
            ],
            effects: { affection: 10, regularWeight: { xunwei: 1.6 } }
          }
        ]
      },

      {
        id: 'duyaoye-laoli', name: '杜遥夜与老鲤', color: '#6f8ea8',
        party: 2, members: ['杜遥夜', '老鲤'], colors: ['#6f8ea8', '#c2a24a'],
        patience: 58, pay: 1.4, crave: ['aroma', 'rich'],
        appear: { minDay: 4, weight: 2, cooldown: 3, maxVisits: 3 },
        stages: [
          {
            visit: 1,
            lines: [
              say(LAOLI, '小丫头第一次来百灶吧，给你介绍一下……', { look: 'Avg_avg_322_lmlee_1-9$1'  , bgm: 'm_dia_path_loop.wav'}),
              say(DUYE, '再说一遍！本人有名字！而且我以前来过百灶！', { look: 'Avg_avg_npc_296_1-7$1' }),
              say(LAOLI, '那杜遥夜小姐怕是没来过余味居，不然也不会一路怀疑我要坑害你了。', { look: 'Avg_avg_322_lmlee_1-10$1' }),
              say(DUYE, '谁叫你是个龙门骗子！说是为梁大人那个事赔礼，结果进城后东拐西绕的……', { look: 'Avg_avg_npc_296_1-3$1' }),
              say(JIANG, '二位客官，外面热，门口吵架伤肝火，里边坐里边坐。', { look: 'Avg_avg_npc_1621_1-4$1' }),
              say(LAOLI, '先上两壶茶吧。', { look: 'Avg_avg_322_lmlee_1-10$1' }),
              say(DUYE, '（警惕地看着老鲤）怎嘛，你又要吃面！', { look: 'Avg_avg_npc_296_1-1$1' }),
              say(LAOLI, '是有点似曾相识。', { look: 'Avg_avg_322_lmlee_1-1$1' }),
              say(DUYE, '那就来两碗烂肉面！', { look: 'Avg_avg_npc_296_1$2' }),
              say(LAOLI, '你不吃？', { look: 'Avg_avg_322_lmlee_1-10$1' }),
              say(DUYE, '？', { look: 'Avg_avg_npc_296_1-2$1' }),
              say(YU, '我们这没有这菜牌，你们都没得吃。', { look: 'Avg_avg_2026_yu_1-21$1' })
            ]
          },
          {
            visit: 2,
            lines: [
              say(LAOLI, '这百灶的口味是不一样，和尚蜀的比……', { look: 'Avg_avg_322_lmlee_1-2$1'  , bgm: 'm_dia_path_loop.wav'}),
              say(YU, '和尚蜀比怎么样？', { look: 'Avg_avg_2026_yu_1-6$1' }),
              say(LAOLI, '多了几分街坊烟火，少了几分山水清灵。', { look: 'Avg_avg_322_lmlee_1-9$1' }),
              say(DUYE, '我怎么没吃出来？', { look: 'Avg_avg_npc_296_1$2' }),
              say(YU, '你是说我的菜味道不对？', { look: 'Avg_avg_2026_yu_1-6$1' }),
              say(LAOLI, '非也非也，是食材的差别而不是手艺的差距。', { look: 'Avg_avg_322_lmlee_1-9$1' }),
              say(DUYE, '又在瞎骗人了。', { look: 'Avg_avg_npc_296_1-2$1' }),
              say(JIANG, '早知道去尚蜀进货了。', { look: 'Avg_avg_npc_1621_1-8$1' }),
              say(YU, '听起来你对手艺颇为自信，正好打烊了，我这厨房借给你，你露两手？', { look: 'Avg_avg_2026_yu_1-1$1' }),
              say(JIANG, '大厨？', { look: 'Avg_avg_npc_1621_1-9$1' }),
              say(LAOLI, '那就，献丑了？', { look: 'Avg_avg_322_lmlee_1-10$1' }),
              say(DUYE, '我看是露馅了吧。', { look: 'Avg_avg_npc_296_1-4$1' })
            ],
            effects: { unlockDish: ['lanroumian'], affection: 8 }
          },
          {
            visit: 3,
            lines: [
              { who: '', text: '不多时，三碗烂肉面端了上来，余凑近闻了闻，满意地点了点头。'  , bgm: 'm_dia_path_loop.wav'},
              say(DUYE, '这是你做的？', { look: 'Avg_avg_npc_296_1$2' }),
              say(LAOLI, '我看后厨摆了三碗面，直接端过来了。', { look: 'Avg_avg_322_lmlee_1-1$1' }),
              say(DUYE, '不是说他们这没有这道菜嘛？', { look: 'Avg_avg_npc_296_1$2' }),
              say(LAOLI, '是啊，我逗你的。', { look: 'Avg_avg_322_lmlee_1-2$1' }),
              say(DUYE, '你！', { look: 'Avg_avg_npc_296_1-5$1' }),
              say(JIANG, '大厨，闻着挺香，怎么说，要不要加进菜单。', { look: 'Avg_avg_npc_1621_1-4$1' }),
              say(YU, '还不错，这份菜谱可以留下来了。', { look: 'Avg_avg_2026_yu_1-20$1' }),
              say(JIANG, '太好了，新菜品可以卖贵一点，而且成本还低。', { look: 'Avg_avg_npc_1621_1-4$1' }),
              say(YU, '你似乎见过很多我的家人。', { look: 'Avg_avg_2026_yu_1-2$1' }),
              say(LAOLI, '机缘巧合罢了，被朋友摆了一道后，有几面之缘而已。', { look: 'Avg_avg_322_lmlee_1-1$1' }),
              say(YU, '那我们的缘分还不浅，你们有空常来啊。', { look: 'Avg_avg_2026_yu_1-21$1' }),
              say(DUYE, '这次是凑巧！以后我自己一个人来！', { look: 'Avg_avg_npc_296_1-5$1' })
            ],
            effects: { affection: 12, regularWeight: { dalisi: 2.0 } }
          }
        ]
      },

      {

        id: 'jie-huaihu', name: '孑与槐琥', color: '#7a4a52',
        party: 2, members: ['孑', '槐琥'], colors: ['#7a4a52', '#b09550'],
        sprites: ['jie', 'huaihu'],
        patience: 54, pay: 1.5, crave: ['spicy', 'numb'],
        appear: { minDay: 6, needAff: 140, weight: 2, cooldown: 3, maxVisits: 3 },
        stages: [
          {
            visit: 1,
            lines: [
              { who: '槐琥', text: '到了到了，就是这里，难得来百灶旅游，可不能不来这里，果然很小嘛！', char: 'Waaifu', look: 'Avg_avg_243_waaifu_1-3$1', color: '#b09550' },
              { who: '孑', text: '比我的摊子大多了…', char: 'Strong', look: 'Avg_avg_272_strong_1-2$1', color: '#7a4a52' },
              say(JIANG, '客官里边请！…嗯？',{look: 'Avg_avg_npc_1621_1-2$1'}),
              { who: '孑', text: '…', char: 'Strong', look: '', color: '#7a4a52' },
              say(JIANG, '（来者不善，看着像是来收保护费的）',{look: 'Avg_avg_npc_1621_1-6$1'}),
              { who: '孑', text: '（完了，他肯定以为我是来受保护费的）', char: 'Strong', look: 'Avg_avg_272_strong_1-3$1', color: '#7a4a52' },
              { who: '槐琥', text: '别看他长得凶，其实不是来受保护费的。', char: 'Waaifu', look: 'Avg_avg_243_waaifu_1-4$1', color: '#b09550' },
              { who: '孑', text: '我们是龙门来的游客，是慕名而来…', char: 'Strong', look: 'Avg_avg_272_strong_1-2$1', color: '#7a4a52' },
              say(JIANG, '等等？我在关于龙门的内部情报见过你，疑似叉烧帮和咸鱼帮的老大。',{look:'Avg_avg_npc_1621_1-9$1'}),
              { who: '孑', text: '那个是误会…', char: 'Strong', look: 'Avg_avg_272_strong_1-1$1', color: '#7a4a52' },
              say(JIANG, '雇佣了一个武林高手当保镖？',{look:'Avg_avg_npc_1621_1-3$1'}),
              { who: '孑', text: '那个只是经常在一起…', char: 'Strong', look: 'Avg_avg_272_strong_1-4$1', color: '#7a4a52' },
              say(JIANG, '单挑了庞贝？',{look:'Avg_avg_npc_1621_1-4$1'}),
              { who: '槐琥', text: '这倒是真的。', char: 'Waaifu', look: 'Avg_avg_243_waaifu_1-9$1', color: '#b09550' },
              say(JIANG, '总之最后是加入了罗德岛，大厨，你同事来啦！',{look:'Avg_avg_npc_1621_1-4$1'}),
              say(YU, '哦？欢迎欢迎，我看看是谁来了。',{look:'Avg_avg_2026_yu_1-20$1'}),
              say(YU, '恩希欧迪斯，你怎么和槐琥在一起？',{look:'Avg_avg_2026_yu_1-1$1'})
            ],
            effects: { flags: ['met_jiehuaihu'] }
          },
          {
            visit: 2,
            lines: [
              say(YU, '嘻嘻，开个小玩笑。二位既然难得来百灶一次，那想吃什么就开口，这顿免单！',{look:'Avg_avg_2026_yu_1-21$1'}),
              say(JIANG, '大厨…这月的房租…',{look:'Avg_avg_npc_1621_1-6$1'}),
              say(YU, '…相对的，你露一手，就上次在罗德岛厨房做的那个鳞丸，给老姜来一碗！',{look:'Avg_avg_2026_yu_1-3$1'}),
              say(JIANG, '鳞丸？龙门的那个特产小吃？',{look:'Avg_avg_npc_1621_1-9$1'}),
              { who: '槐琥', text: '孑做的鳞丸非常好吃，我上本科的时候每天回家都会去他那里。', char: 'Waaifu', look: 'Avg_avg_243_waaifu_1-3$1', color: '#b09550' },
              { who: '孑', text: '（虽说不是每次都来买鱼丸）', char: 'Strong', look: 'Avg_avg_272_strong_1-4$1', color: '#7a4a52' },
              { who: '槐琥', text: '我爸也赞不绝口！', char: 'Waaifu', look: 'Avg_avg_243_waaifu_1-3$1', color: '#b09550' },
              say(YU, '（看来已经见过家长了）',{look:'Avg_avg_2026_yu_1-13$1'}),
              { who: '槐琥', text: '将来在龙门会再多一个鱼丸之神！', char: 'Waaifu', look: 'Avg_avg_243_waaifu_1-4$1', color: '#b09550' },
              say(JIANG, '（未来都已经想好了啊）'),
              say(YU, '你们什么时候结婚？',{look:'Avg_avg_2026_yu_1-20$1'}),
              say(JIANG, '大厨你怎么直接说出来了！',{look:'Avg_avg_npc_1621_1-9$1'}),
              { who: '孑', text: '先想把房子买了…', char: 'Strong', look: 'Avg_avg_272_strong_1-4$1', color: '#7a4a52' },
              say(YU, '我恰好认识一个做房产生意的。',{look:'Avg_avg_2026_yu_1-4$1'}),
              say(JIANG, '你自己这个店都没盘下来啊！',{look:'Avg_avg_npc_1621_1-7$1'})
            ],

            effects: { unlockDish: ['malalinwan'], affection: 6 }
          }

        ]
      }
    ],

    regulars: []
  };

  if (typeof Mods !== 'undefined') Mods.register(pack, 'builtin');
})();
