const API_KEY = '181dc552d07f9ed15c594f7ad49257c546a61ebcc2d4b72aa016216d298c7c43';

const tickersHandlers = new Map();
const socket = new WebSocket(`wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`)

const AGGREGATE_INDEX = "5";

socket.addEventListener('message', (e) => {
  const {TYPE: type, FROMSYMBOL: currency, PRICE: newPrice} = JSON.parse(e.data)

  if (type !== AGGREGATE_INDEX || newPrice === undefined) {
    return
  }

  const handlers = tickersHandlers.get(currency) ?? []
  handlers.forEach(fn => fn(newPrice))
})

function sendToWebSocket(message) {
  const stringifiedMessage = JSON.stringify(message)

  if(socket.readyState === WebSocket.OPEN) {
    socket.send(stringifiedMessage)
  } else {
    socket.addEventListener('open', () => {
      socket.send(stringifiedMessage)
    }, {once: true})
  }
  
}

function subscribeToTickerOnWs(ticker) {
  sendToWebSocket({
    "action": "SubAdd",
    "subs": [`5~CCCAGG~${ticker}~USD`]
  })
}

function unsubscribeFromTickerOnWs(ticker) {
  sendToWebSocket({
    "action": "SubRemove",
    "subs": [`5~CCCAGG~${ticker}~USD`]
  })
}

export const subscribeToTicker = (ticker, cb) => {
  const subscribers = tickersHandlers.get(ticker) || []
  tickersHandlers.set(ticker, [...subscribers, cb])
  subscribeToTickerOnWs(ticker)
}

export const unsubscribeToTicker = (ticker) => {
  tickersHandlers.delete(ticker)
  unsubscribeFromTickerOnWs(ticker)
}