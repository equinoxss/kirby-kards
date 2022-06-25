let cardTime = 60000;
let blackTime = 120000;
const bellTime = 2000;

let audio = null;
let customCardListBuilt = false;
let customImgElement = null;
let customImgChosen = null;
let desireHandlersBound = false;

let segments = [];
const singles = [ 'imgs/land.jpg', 'imgs/water.jpg', 'imgs/fire.jpg', 'imgs/wind.jpg', 'imgs/ether.jpg' ];
const decks = {
  land: { i: 'imgs/land.jpg', c: [ 'imgs/land.jpg', 'imgs/land-water.jpeg', 'imgs/land-fire.jpeg', 'imgs/land-wind.jpeg', 'imgs/land-ether.jpeg' ] },
  water: { i: 'imgs/water.jpg', c: [ 'imgs/water.jpg', 'imgs/water-land.jpeg', 'imgs/water-fire.jpeg', 'imgs/water-wind.jpeg', 'imgs/water-ether.jpeg' ] },
  fire: { i: 'imgs/fire.jpg', c: [ 'imgs/fire.jpg', 'imgs/fire-land.jpeg', 'imgs/fire-water.jpeg', 'imgs/fire-wind.jpeg', 'imgs/fire-ether.jpeg' ] },
  wind: { i: 'imgs/wind.jpg', c: [ 'imgs/wind.jpg', 'imgs/wind-land.jpeg', 'imgs/wind-water.jpeg', 'imgs/wind-fire.jpeg', 'imgs/wind-ether.jpeg' ] },
  ether: { i: 'imgs/ether.jpg', c: [ 'imgs/ether.jpg', 'imgs/ether-land.jpeg', 'imgs/ether-water.jpeg', 'imgs/ether-fire.jpeg', 'imgs/ether-wind.jpeg' ] },
};

function start() {
  if (typeChosen !== 'p' || pairChosen.length === 2) {
    audio = new Audio();
    audio.autoplay = true;

    playSilent();
    buildSegments();
    prepare();
    next();
  }
}

function prepare() {
  viewer.classList.add('show');
  document.querySelector('body').classList.add('no-scroll');
  document.querySelector('body').requestFullscreen();
}

function done() {
  viewer.classList.remove('show','cover');
  document.querySelector('body').classList.remove('no-scroll');
  document.exitFullscreen();
}

function buildSegments() {
  segments = [];

  segments.push({ i: 'imgs/count-3.jpeg', t: 675 });
  segments.push({ i: 'imgs/count-2.jpeg', t: 675 });
  segments.push({ i: 'imgs/count-1.jpeg', t: 675 });

  if (typeChosen === 'b') {
    addBreathSegments();
  } else {
    cardTime = document.querySelector('#cardTime').value * 60000;
    blackTime = document.querySelector('#vizTime').value * 60000;

    if (typeChosen === 'c') {
      customChosen.filter(img => !!img).map(img => {
        if (img.endsWith('breath-btn.jpeg')) {
          addBreathSegments(true);
        } else {
          segments.push({ i: img, t: cardTime });
          segments.push({ t: blackTime, b: true });
        }
      });
    } else if (typeChosen === 'f') {
      addFlashingSegments();
      viewer.classList.add('cover');

    } else if (typeChosen !== 'p') {
      const images = typeChosen === 's' ? singles : decks[deckChosen].c;

      images.forEach(img => {
        segments.push({ i: img, t: cardTime });
        segments.push({ t: blackTime, b: true });
      });

      segments.push({ i: 'imgs/commun.jpg', t: cardTime });
      segments.push({ t: blackTime, b: true });
    } else {
      segments.push({ i: `imgs/${pairChosen[0]}-${pairChosen[1]}.jpeg`, t: cardTime });
      segments.push({ t: blackTime, b: true });
      segments.push({ i: `imgs/${pairChosen[1]}-${pairChosen[0]}.jpeg`, t: cardTime });
      segments.push({ t: blackTime, b: true });
    }
  }

  segments.push({ done: true });
}

function addBreathSegments(addBlack) {
  const bTime = document.querySelector('#breathTime').value;
  const sTime = document.querySelector('#sessionTime').value;
  const square = document.querySelector('#squareBreathing').checked;

  const cycles = Math.ceil( (sTime * 60) / ((square ? 4 : 2) * bTime) );

  for (let i=0;i<cycles;i++) {
    segments.push({ i: 'imgs/breath-up.jpeg', t: bTime * 1000 });
    square && segments.push({ i: 'imgs/breath-up-hold.jpeg', t: bTime * 1000 });
    segments.push({ i: 'imgs/breath-down.jpeg', t: bTime * 1000 });
    square && segments.push({ i: 'imgs/breath-down-hold.jpeg', t: bTime * 1000 });
  }
  
  if (addBlack) {
    segments.push({ t: bTime * 1000, b: true });
  }
}

function addFlashingSegments() {
  const data = getDesireData();
  const chosenDesire = desireGroup.querySelector('.radio.selected').dataset.id;
  const speed = Number(document.querySelector('#flashSpeed').value);
  const time = Number(document.querySelector('#flashTime').value) * 60000;
  const count = Math.ceil(time / speed);
  const spliceWidth = Math.ceil(3000 / speed);

  const availableImgs = data[chosenDesire].map(img => ({ i: img, t: speed }));
  let items = [];

  for (let i=0; i < Math.round(count / availableImgs.length); i++) {
    items = items.concat(availableImgs);
  }
  
  const baseCards = [
    { i: 'imgs/land.jpg', t: speed },
    { i: 'imgs/wind.jpg', t: speed },
    { i: 'imgs/fire.jpg', t: speed },
    { i: 'imgs/water.jpg', t: speed }
  ];

  let spliceIdx = spliceWidth;
  while (spliceIdx < items.length) {
    const item = baseCards.shift();
    items.splice(spliceIdx, 0, item);
    baseCards.push(item);
    spliceIdx += spliceWidth;
  }

  segments = items;
}

let currentSegment = null;
let currentStart = 0;
let timers = [];
let viewerPaused = false;

function next() {
  try {
    currentSegment = segments.shift();

    viewer.style.backgroundImage = currentSegment.i ? `url(${currentSegment.i})` : null;

    timers = [];
    currentStart = Date.now();

    currentSegment.t && timers.push( setTimeout(() => next(), currentSegment.t) );
    currentSegment.b && timers.push( setTimeout(() => playChime(), Math.max(0, currentSegment.t - 1000)) );
    currentSegment.done && done();
  } catch(e) {
    exitMeditation();
  }
}

function pause() {
  viewerPaused = true;
  timers.forEach(t => clearTimeout(t));
  currentSegment.t = currentSegment.t - (Date.now() - currentStart);
  segments.unshift(currentSegment);
  document.querySelector('#playButton').classList.remove('hidden');
}

function resume() {
  viewerPaused = false;
  document.querySelector('#playButton').classList.add('hidden');
  next();
}

function exitMeditation() {
  timers.forEach(t => clearTimeout(t));
  viewer.style.backgroundImage = null;
  done();
}

function playSilent() {
  audio.src = 'data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
}

function playChime() {
  audio.src = 'sounds/bell2.mp3';

  setTimeout(() => playSilent(), bellTime);
}

function updateSelectedDeck() {
  deckButtons.forEach( btn => btn.classList.remove('selected') );

  if (typeChosen === 'd') {
    selectDeck.querySelector(`.radio[data-id=${deckChosen}]`).classList.add('selected');
  } else if (typeChosen === 'p') {
    if (pairChosen[0]) {
      selectDeck.querySelector(`.radio[data-id=${pairChosen[0]}]`).classList.add('selected');
      if (pairChosen[1]) {
        selectDeck.querySelector(`.radio[data-id=${pairChosen[1]}]`).classList.add('selected');
      }
    }
  }
}

function addCustomCards() {
  if (!customCardListBuilt) {
    customCardListBuilt = true;
    const imgs = Object.keys(decks).reduce( (acc, key) => {
      const cards = decks[key].c.map(path => `<img src="${path}" draggable="true" ondragstart="drag(event)" onclick="selectCustomImg(event)" />`);
      return acc.concat(cards);
    }, []);

    imgs.push('<img src="imgs/commun.jpg" draggable="true" ondragstart="drag(event)" onclick="selectCustomImg(event)" />');
    imgs.push('<img src="imgs/breath-btn.jpeg" draggable="true" ondragstart="drag(event)" onclick="selectCustomImg(event)" />');

    customGroup.querySelector('.card-list').innerHTML = imgs.join('');
  }
}

function renderCustomSequence() {
  let hasBreath = false;

  const cards = customChosen.map((img,idx) => {
    hasBreath |= img.endsWith('breath-btn.jpeg');

    return `
      <div class="custom-slot" data-idx="${idx}" 
          ondragover="dragOver(event)" ondragenter="dragEnter(event)" ondragleave="dragLeave(event)" ondrop="drop(event,${idx})"
          onmouseenter="mouseEnter(event,${idx})" onmouseleave="mouseLeave(event)" onclick="placeCustomImg(event, ${idx})">
        <img src="${img}">
        <div class="remove-img hidden" onclick="clearCustomCard(event,${idx})">&times;</div>
      </div>`
  });

  hasBreath 
    ? breathTime.classList.remove('hidden')
    : breathTime.classList.add('hidden');

  customGroup.querySelector('.chosen-cards').innerHTML = cards.join('');
}

function bindDesireHandlers() {
  if (!desireHandlersBound) {
    desireHandlersBound = true;

    const buttons = document.querySelectorAll('.radio-buttons.desire .radio');
    for (const radioButton of buttons) {
      radioButton.addEventListener('click', evt => {
        buttons.forEach( btn => btn.classList.remove('selected') );
        evt.target.classList.add('selected');
      });
    }
  }
}

function drag(ev) {
  ev.dataTransfer.setData("text", ev.target.src);
}

function selectCustomImg(ev) {
  clearCustomImgSelection();
  if (customImgChosen !== ev.target.src) {
    customImgChosen = ev.target.src;
    ev.target.classList.toggle('selected');
  } else {
    customImgChosen = null;
  }
}

function clearCustomImgSelection() {
  customGroup.querySelectorAll('.card-list img').forEach( img => img.classList.remove('selected'));
}

function dragOver(ev) {
  ev.preventDefault();
}

function dragEnter(ev) {
  ev.preventDefault();
  ev.target.classList.add('active-drop');
}

function dragLeave(ev) {
  ev.preventDefault();
  ev.target.classList.remove('active-drop');
}

function drop(ev,idx) {
  ev.preventDefault();
  customChosen[idx] = ev.dataTransfer.getData("text");
  renderCustomSequence();
}

function placeCustomImg(ev, idx) {
  ev.preventDefault();
  if (customImgChosen) {
    customChosen[idx] = customImgChosen;
    customImgChosen = null;
    clearCustomImgSelection();
    renderCustomSequence();
  }
}

function mouseEnter(ev,idx) {
  if (customChosen[idx]) {
    ev.target.querySelector('.remove-img').classList.remove('hidden');
  }
}

function mouseLeave(ev) {
  ev.target.querySelector('.remove-img').classList.add('hidden');
}

function clearCustomCard(ev,idx) {
  customChosen[idx] = '';
  renderCustomSequence();
}

function addCustomCard() {
  customChosen.push('');
  renderCustomSequence();
}

const ctas = {
  d: 'Choose a Deck',
  p: 'Choose Two Cards to Pair',
  o: 'Choose One Card',
  c: 'Choose a Deck',
  f: 'Choose a Deck',
  b: 'Choose a Deck'
};

const programButtons = document.querySelectorAll('.radio-buttons.program .radio')
const deckButtons = document.querySelectorAll('.radio-buttons.deck .radio');
const selectDeck = document.querySelector('#selectDeck');
const sequenceTime = document.querySelector('.card-time.sequence');
const breathTime = document.querySelector('.card-time.breath');
const desireTime = document.querySelector('.card-time.desire');
const deckGroup = document.querySelector('.group.deck');
const customGroup = document.querySelector('.group.custom');
const desireGroup = document.querySelector('.group.desire');
const viewer = document.querySelector('.viewer');
const playButton = document.querySelector('#playButton')

const onMobile = window.innerWidth <= 512;
let typeChosen = 's';
let deckChosen = 'land';
const pairChosen = [];
const customChosen =  onMobile ? ['','','','',''] : ['','','','','',''];

for (const radioButton of programButtons) {
  radioButton.addEventListener('click', evt => {
    const newVal = evt.target.dataset.id;
    if (newVal !== typeChosen) {
      typeChosen = newVal;

      sequenceTime.classList.remove('hidden');
      desireTime.classList.add('hidden');
      breathTime.classList.add('hidden');

      deckGroup.classList.remove('hidden');
      customGroup.classList.add('hidden');
      desireGroup.classList.add('hidden');

      if (typeChosen === 'b') {
        sequenceTime.classList.add('hidden');
        breathTime.classList.remove('hidden');
      } else if (typeChosen === 'c') {
        deckGroup.classList.add('hidden');
        customGroup.classList.remove('hidden');
      } else if (typeChosen === 'f') {
        sequenceTime.classList.add('hidden');
        deckGroup.classList.add('hidden');
        desireGroup.classList.remove('hidden');
        desireTime.classList.remove('hidden');
      }
      // } else {
      //   sequenceTime.classList.remove('hidden');
      //   desireTime.classList.add('hidden');
      // }

      if (typeChosen === 's' || typeChosen === 'b') {
        selectDeck.classList.add('dimmed');
      } else if (typeChosen === 'c') {
        addCustomCards();
        renderCustomSequence();
      } else if (typeChosen === 'f') {
        bindDesireHandlers();
      } else {
        selectDeck.classList.remove('dimmed');
        updateSelectedDeck();
      }

      selectDeck.querySelector('div:first-child').innerText = ctas[typeChosen];

      programButtons.forEach( btn => btn.classList.remove('selected') );
      evt.target.classList.add('selected');
    }
  });
}

for (const radioButton of deckButtons) {
  radioButton.addEventListener('click', evt => {
    const newVal = evt.target.dataset.id;
    if (typeChosen === 'd') {
      if (newVal !== deckChosen) {
        deckChosen = newVal;
      }
    } else if (typeChosen === 'p') {
      const idx = pairChosen.indexOf(newVal);
      if (idx >= 0) {
        pairChosen.splice(idx,1);
      } else if (pairChosen.length < 2) {
        pairChosen.push(newVal);
      }
    }

    updateSelectedDeck();
  });
}

let clickTime = -600;
let clickWatcher = null;
viewer.addEventListener('click', ev => {
  if (viewerPaused) {
    resume();
  } else {
    clickWatcher && clearTimeout(clickWatcher);

    if (ev.timeStamp - clickTime < 600) {
      exitMeditation();
    } else {
      clickWatcher = setTimeout(() => pause(), 1000);
    }
    
    clickTime = ev.timeStamp;
  }
});

document.querySelector('#cardTime').value = cardTime / 60000;
document.querySelector('#vizTime').value = blackTime / 60000;
document.querySelector('#breathTime').value = 4;
document.querySelector('#sessionTime').value = 3;

onMobile && (document.querySelector('.add-custom').innerText = '+');