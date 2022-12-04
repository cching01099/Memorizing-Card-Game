const Symbols = [
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17989/__.png', // 黑桃
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17992/heart.png', // 愛心
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17991/diamonds.png', // 方塊
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17988/__.png' // 梅花
]

const GAME_STATE = {
  FirstCardAwaits: 'FirstCardAwaits',
  SecondCardAwaits: 'SecondCardAwaits',
  CardMatchFailed: 'CardMatchFailed',
  CardMatched: 'CardMatched',
  GameFinished: 'GameFinished',
}

const view = { //因為有52張卡片要渲染，所以拆成兩個函式

  getCardContent(index) { //負責”生成牌面“的內容，包括花色和數字
    const number = this.transformNumber((index % 13) + 1)//index是32，32除以13=2...6 (%是要看餘數：6)--> 6+1 =數字是7
    const symbol = Symbols[Math.floor(index / 13)] // 32/13=2...方塊 (因為[0,1,2,3] =[黑桃,愛心,方塊,梅花])

    return `<p>${number}</p>
    <img src="${symbol}" alt="">
    <p>${number}</p>`
  },

  getCardElement(index) { //負責”牌背“
    //翻牌遊戲一開始是顯示牌背朝上+back
    return `<div data-index= "${index}" class="card back"></div>`
  }, //因為views是物件，所以property跟property之間要用逗號隔開


  //特殊數字要轉換成英文字母
  transformNumber(number) {
    switch (number) {
      case 1:
        return 'A'
      case 11:
        return 'J'
      case 12:
        return 'Q'
      case 13:
        return 'K'
      default: //其他預設的（就是數字）
        return number
    }
  },

  //為了要用controller內部叫出displayCards，所以要將utility拔掉並移到controller裡，而indexes就是被打亂的牌組陣列的變數
  displayCards(indexes) { //負責選出＃cards並抽換內容
    const rootElement = document.querySelector('#cards')
    //產生含有連續數字0-51的陣列：Array.from(Array(52).keys()) 要透過getCardElement這個函式轉換成另一個資料，中間的轉換者就是map()，從函式裡轉換出來的是陣列，但要透過join()去合併成一個大字串，才能當成 HTML template 來使用
    // rootElement.innerHTML = Array.from(Array(52).keys()).map(index => this.getCardElement(index)).join('')

    // utility.getRandomNumberArray(52)被洗亂的牌組陣列
    rootElement.innerHTML = indexes.map(index => this.getCardElement(index)).join('')
  },

  //翻牌
  //flipCard(card)>>for只有一張卡牌
  //但傳進去的參數可能不只一個數字 >> flipCards(1,2,3,4,5)，...可以把cards = [1,2,3,4,5]陣列
  flipCards(...cards) { //cards =[1,2,3,4]
    // console.log(card.dataset.index) 測試翻牌後的數字index
    cards.map(card => {
      //點擊覆蓋的牌->要“回傳正面”牌的內容(花色、數字)
      if (card.classList.contains('back')) {
        card.classList.remove('back')
        card.innerHTML = this.getCardContent(Number(card.dataset.index))
        return
      }
      //點翻開的牌->重新蓋回去卡片，且牌面的內容要清空，要“回傳背面”的樣式
      card.classList.add('back')
      card.innerHTML = null
    })
  },

  //兩張牌配對成功後的卡牌樣式變化
  pairCards(...cards) {
    cards.map(card => {
      card.classList.add('paired')
    })
  },

  //score的畫面渲染
  renderScore(score) {
    document.querySelector('.score').textContent = `Score: ${score}`
  },

  //TriedTimes的畫面渲染
  renderTriedTimes(times) {
    document.querySelector('.tried').textContent = `You've tried: ${times} times`
  },

  //錯誤牌卡的動畫
  appendWrongAnimation(...cards) {
    cards.map(card => {
      card.classList.add('wrong')
      //如果沒有加監聽事件，按了一次動畫，卡牌就沒辦法在做動畫的行為了，因為卡牌就已綁上wrong的標籤
      card.addEventListener('animationend', event =>
        event.target.classList.remove('wrong')
        , { once: true }) //eventlistener只會被觸發一次，就要卸載這個監聽
    })
  },

  //遊戲結束
  showGameFinished() {
    const div = document.createElement('div')
    div.classList.add('completed')
    div.innerHTML = `
      <p>Complete!</p>
      <p>Score: ${model.score}</p>
      <p>You've tried: ${model.triedTimes} times</p>
    `
    const header = document.querySelector('#header')
    header.before(div) //在header前面加入一個元素(div)
  }
}

//洗牌演算法 fisher-yates
const utility = {
  getRandomNumberArray(count) {
    // count = 5 => [2,3,4,1,0] 回傳數字是0-4 但順序位置是隨機的
    const number = Array.from(Array(count).keys())
    for (let index = number.length - 1; index > 0; index--) { //取出最後一張卡牌，開始跑回圈
      let randomIndex = Math.floor(Math.random() * (index + 1)) //找出隨機一張卡牌
        ;[number[index], number[randomIndex]] = [number[randomIndex], number[index]] //解構賦值
    }
    return number
  }

}
//console.log(utility.getRandomNumberArray(5))=>測試getRandomNumberArray有效不，發現會回傳[0,1,4,2,3] 裡面順序隨機

//資料的管理：最重要就是要知道翻開的牌是哪張
const model = {
  revealedCards: [], //暫存牌組，每次翻牌就把卡片丟進去
  //比對兩張牌的數字
  isRevealedCardsMatched() {
    return this.revealedCards[0].dataset.index % 13 === this.revealedCards[1].dataset.index % 13
  },

  score: 0,

  triedTimes: 0,
}


const controller = {
  currentState: GAME_STATE.FirstCardAwaits,

  generateCards() { //啟動遊戲初始化的函式
    view.displayCards(utility.getRandomNumberArray(52))
  },
  //推進遊戲：依照不同的遊戲狀態，做不同的行為
  dispatchCardAction(card) {

    //如果不是牌背，代表已經攤開在正面了，不用做任何事情
    if (!card.classList.contains('back')) {
      return //就中止函式
    }

    switch (this.currentState) {
      case GAME_STATE.FirstCardAwaits:
        //翻牌-->把翻到的牌推進到暫存牌組陣列中-->接下來進入的狀態就是：等待第二次翻牌
        view.flipCards(card)
        model.revealedCards.push(card)
        this.currentState = GAME_STATE.SecondCardAwaits
        break

      case GAME_STATE.SecondCardAwaits:
        view.renderTriedTimes((++model.triedTimes))
        //翻牌-->把翻到的牌推進到暫存牌組陣列中-->接下來要檢查翻開的兩張卡是否數字相同
        view.flipCards(card)
        model.revealedCards.push(card)
        //判斷配對是否成功
        //console.log(model.isRevealedCardsMatched())-->先判斷isRevealedCardsMatched有沒有成功回傳布林值(true/false)
        if (model.isRevealedCardsMatched()) {
          //配對正確-->停留在局上
          this.currentState = GAME_STATE.CardMatched
          view.renderScore((model.score += 10))
          // view.pairCard(model.revealedCards[0])
          // view.pairCard(model.revealedCards[1])這兩行等於下面那一行有含展開運算子...
          view.pairCards(...model.revealedCards)
          model.revealedCards = []
          //配對全部都正確>>遊戲結束
          if (model.score === 260) {
            console.log('showGameFinished')
            this.currentState = GAME_STATE.GameFinished
            view.showGameFinished()
            return //就中止函式
          }
          this.currentState = GAME_STATE.FirstCardAwaits
        } else {
          //配對失敗-->卡牌會重新翻回到背面
          this.currentState = GAME_STATE.CardMatchFailed
          view.appendWrongAnimation(...model.revealedCards)
          setTimeout(this.resetCards, 1000) //提醒：setTimeout 要傳進去的是函式她的本身，而不是呼叫這個函式的結果(restCards())
        }
        break
    }

    console.log('curret state:', this.currentState)
    console.log('revealed cards:', model.revealedCards)
  },

  //本來放在setTimeout裡面的函式，獨立拉出來做管理
  resetCards() {
    // view.flipCard(model.revealedCards[0])
    // view.flipCard(model.revealedCards[1]) 這兩行等於下面那一行有含展開運算子...
    view.flipCards(...model.revealedCards)
    model.revealedCards = [] //要清空上一次翻牌的卡牌內容
    controller.currentState = GAME_STATE.FirstCardAwaits //原本this. 要改成controller.，因為當執行setTimeout時會將resetCards這個函式做為參數傳進去，而這時候的this就會變成setTimeout
  }

}


controller.generateCards()


//監聽翻牌的事件，(每張卡片都有加上監聽器）
document.querySelectorAll('.card').forEach(card => { //一次選出所有的.card，透過DOM得出的節點是node list(是類陣列)，所以不能用map要用forEach
  card.addEventListener('click', event => {
    controller.dispatchCardAction(card)
  })
})
