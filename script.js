function $(selector) {
  return document.querySelector(selector);
}
function $$(selector) {
  return document.querySelectorAll(selector);
}

// -------------------
// dom
// -------------------
var lotteryStage = $('.lottery-stage');
var lotteryCards = $('.lottery-stage_cards');
var lotteryMask = $('.lottery-stage__mask');
var lotteryCloseBtn = $('.lottery-stage_close-button');
var button = $('.action-area button');

var CLASS_NAME = {
  item: {
    duration: 'item-duration',
    wrapper: 'item-wrapper',
    size: 'item-size',
    position: 'item-position',
    entity: 'item-entity',
    current: 'item_current',
    pre: 'item_pre',
    next: 'item_next',
    lottery: 'item_lottery'
  }
};

function randomBgColor(delay) {
  delay = delay === undefined ? 3000 : delay;
  var className = 'bg-color-';
  var timer;

  function changeColor() {
    var key = (Math.floor(Math.random() * 100) % 9).toString();
    document.body.className = className + key;
    setTimeout(changeColor, delay);
  }

  timer = setTimeout(changeColor, delay);
}

function createLotteryCard(itemData) {
  var itemWrapper = document.createElement('div');
  var itemSize = document.createElement('div');
  var itemEntity = document.createElement('div');
  itemWrapper.className = CLASS_NAME.item.wrapper;
  itemSize.className = CLASS_NAME.item.size;
  itemEntity.className = [CLASS_NAME.item.position, CLASS_NAME.item.entity].join(' ');

  [itemWrapper, itemSize, itemEntity].forEach(v =>
    v.classList.add(CLASS_NAME.item.duration)
  );

  itemWrapper.dataset.id = itemData.id;

  itemEntity.innerHTML =
    '<div class="pic-wrapper"><img src=' +
    itemData.imgSrc +
    '></div>' +
    '<div class="title">' +
    itemData.title +
    '</div>' +
    '<div class="description">' +
    itemData.description +
    '</div>';

  itemSize.appendChild(itemEntity);
  itemWrapper.appendChild(itemSize);
  return itemWrapper;
}

function createLotteryCards(dataSource) {
  var fragment = document.createDocumentFragment();
  dataSource.forEach(data => {
    var elem = createLotteryCard(data);
    fragment.appendChild(elem);
  });
  lotteryCards.appendChild(fragment);
}

function toggleHighLightLottery() {
  lotteryCards.classList.toggle('lottery-stage_cards_plain');
  lotteryMask.classList.toggle('hidden');
  lotteryCloseBtn.classList.toggle('hidden');
  $('.' + CLASS_NAME.item.current).classList.toggle(CLASS_NAME.item.lottery);
}

function changeCardTransitionDuration(speed) {
  var items = $$('.' + CLASS_NAME.item.duration);
  items = Array.prototype.slice.call(items);
  items.forEach(item => {
    item.style.transitionDuration = speed + 'ms';
  });
}

function handleOnTriggerStart(elem, lottery) {
  elem.innerHTML = 'STOP';
  elem.classList.add('active');
}

function handleOnTriggerStop(elem, lotteryId) {
  elem.innerHTML = 'START';
  elem.classList.remove('active');
}

function handleOnLotteryClose(elem) {}

// -------------------
// spin
// -------------------
function minusIndex(idx, ceilLimit) {
  var i = idx - 1;
  return i < 0 ? ceilLimit - 1 : i;
}

function plusIndex(idx, ceilLimit) {
  var i = idx + 1;
  return i % ceilLimit;
}

function makeSpin(items, index, ceilLimit) {
  items.forEach(item => {
    [CLASS_NAME.item.next, CLASS_NAME.item.current, CLASS_NAME.item.pre].forEach(
      className => {
        if (item.classList.contains(className)) {
          item.classList.remove(className);
        }
      }
    );
  });
  items[minusIndex(index, ceilLimit)].classList.add(CLASS_NAME.item.next);
  items[index].classList.add(CLASS_NAME.item.current);
  items[plusIndex(index, ceilLimit)].classList.add(CLASS_NAME.item.pre);
}

// -------------------
// lottery
// -------------------
function getCardIndex(itemsData, id) {
  return itemsData.map(v => v.id).indexOf(id);
}

function Lottery(values) {
  this.dataSource = values.dataSource;
  this.index = values.index || this.getRandomLotteryId();
  this.initialSpeed = values.speed || Lottery.defaultSpeed;
  this.spinSpeed = values.spinSpeed || Lottery.defaultSpinSpeed;
  this.speed = this.initialSpeed;

  this.slaveTimer = null;
  this.lotterySpinning = false;
  this.lotteryId = null;

  this.items = [];

  this.trigger = null;
  this.closeBtn = null;
}
Lottery.defaultSpeed = 1000;
Lottery.defaultSpinSpeed = 300;
Lottery.prototype = {
  spin: function(index) {
    index = index === undefined ? this.index : index;
    var ceilLimit = this.items.length;

    if (index < 0 || index >= ceilLimit) {
      this.index = index = this.getRandomLotteryId();
    }
    makeSpin(this.items, index, this.items.length);

    if (index === ceilLimit - 1) {
      index = 0;
    } else {
      index += 1;
    }
    this.index = index;
  },

  slave: function(index) {
    var self = this;
    this.slaveTimer = setTimeout(function() {
      self.spin.call(self, index);
      self.slave.call(self);
    }, this.speed);
  },

  init: function(options) {
    createLotteryCards(this.dataSource);
    changeCardTransitionDuration(this.speed);

    var items = $$('.' + CLASS_NAME.item.wrapper);
    this.items = Array.prototype.slice.call(items);

    this.spin(this.index);
    this.slave();

    this.getLotteryId = options.getRandomLotteryId || this.getRandomLotteryId;

    this.bindTrigger(options.trigger, {
      onStart: options.onStart,
      onStop: options.onStop
    });
    this.bindCloseBtn(options.closeBtn, {
      onClose: options.onClose
    });
  },

  stop: function() {
    this.stopSlave();
  },
  stopSlave: function() {
    clearTimeout(this.slaveTimer);
    this.slaveTimer = null;
  },

  changeSpeed: function(speed) {
    if (this.slaveTimer) {
      this.stopSlave();
      this.spin();
      this.speed = speed;
      changeCardTransitionDuration(this.speed);
      this.slave();
    } else {
      this.speed = speed;
      changeCardTransitionDuration(this.speed);
    }
  },

  getRandomLotteryId: function() {
    var length = this.dataSource.length;
    var min = 0;
    var max = length - 1;
    var index = Math.floor(Math.random() * (max - min + 1) + min);
    return this.dataSource[index].id;
  },

  getLottery: function(lotteryId) {
    this.stopSlave();
    this.spin(lotteryId);
    toggleHighLightLottery();
  },

  bindTrigger: function(trigger, handler) {
    var self = this;
    if (trigger) {
      this.trigger = trigger;
      trigger.onclick = function() {
        if (self.lotterySpinning) {
          self.lotterySpinning = false;
          self.lotteryId = self.getLotteryId();
          self.getLottery(self.lotteryId);
          handler.onStop && handler.onStop(trigger, self.lotteryId);
        } else {
          self.lotterySpinning = true;
          self.changeSpeed(self.spinSpeed);
          handler.onStart && handler.onStart(trigger, self);
        }
      };
    }
  },

  bindCloseBtn: function(closeBtn, handler) {
    var self = this;
    if (closeBtn) {
      this.closeBtn = closeBtn;
      closeBtn.onclick = function() {
        toggleHighLightLottery();
        self.changeSpeed(1);
        self.slave(self.lotteryId);
        self.changeSpeed(self.initialSpeed);
        handler.onClose && handler.onClose(closeBtn, self);
      };
    }
  }
};

Lottery.prototype.constructor = Lottery;

// -------------------
// run
// -------------------
randomBgColor(2000);

var lotteryIndex = 0;
var lotteryIds = [0, 8, 5];
var itemsData = [
  {
    id: 0,
    title: 'MAC迷你唇膏礼盒',
    description: '口若含朱丹，手如削葱根',
    imgSrc: './assets/lottery-mac.png'
  },
  {
    id: 1,
    title: '美图M8 · 清新芭比粉',
    description: '北方有佳人，绝世而独立',
    imgSrc: './assets/lottery-meitu_phone.png'
  },
  {
    id: 2,
    title: '棒棒哒',
    description: '月上柳梢头，人约黄昏后',
    imgSrc: './assets/lottery.png'
  },
  {
    id: 3,
    title: '晶莹光彩 · SKII',
    description: '愿为双鸿鹄，奋翅起高飞',
    imgSrc: './assets/lottery-skII.png'
  },
  {
    id: 4,
    title: 'LIVHERT北极熊抱枕',
    description: '文采双鸳鸯，裁为合欢被',
    imgSrc: './assets/lottery-hold_pillow.png'
  },
  {
    id: 5,
    title: '施华洛世奇 · 黑天鹅项链',
    description: '绿水结绿玉，白波生白硅',
    imgSrc: './assets/lottery-necklace.png'
  },
  {
    id: 6,
    title: '么么哒',
    description: '足下蹑丝履，头上玳瑁光',
    imgSrc: './assets/lottery.png'
  },
  {
    id: 7,
    title: '永恒之恋 · 北欧风插花',
    description: '愿君多采撷，此物最相思',
    imgSrc: './assets/lottery-vase.png'
  },
  {
    id: 8,
    title: '美美哒',
    description: '盈盈一水间，脉脉不得语',
    imgSrc: './assets/lottery.png'
  },
  {
    id: 9,
    title: '韩版兔子小萝卜耳钉',
    description: '腰若流纨素，耳著明月珰',
    imgSrc: './assets/lottery-earrings.png'
  },
  {
    id: 10,
    title: '么么哒',
    description: '迢迢牵牛星，皎皎河汉女',
    imgSrc: './assets/lottery.png'
  }
];

function getRandomLotteryId() {
  if (lotteryIndex < lotteryIds.length) {
    return lotteryIds[lotteryIndex++];
  } else {
    return 8;
  }
}

var lottery = new Lottery({ dataSource: itemsData, speed: 1500, spinSpeed: 300 });
lottery.init({
  trigger: button,
  closeBtn: lotteryCloseBtn,
  getRandomLotteryId: getRandomLotteryId,
  onStart: handleOnTriggerStart,
  onStop: handleOnTriggerStop,
  onClose: handleOnLotteryClose
});
