<br><br>
<p align="center"> 
    <img src="images/logo-light.svg#gh-light-mode-only" alt="Mida" width="352px">
    <img src="images/logo-dark.svg#gh-dark-mode-only" alt="Mida" width="352px">
</p>
<br>
<p align="center">
    <b>The TypeScript framework for trading in financial markets</b>
    <br><br>
    <a href="https://www.mida.org">Home</a> &mdash;
    <a href="https://www.mida.org/documentation">Documentation</a> &mdash;
    <a href="https://www.mida.org/ecosystem">Ecosystem</a>
</p>
<br>
<p align="center">
    <a href="https://www.npmjs.com/package/@reiryoku/mida">
        <img src="https://img.shields.io/npm/v/@reiryoku/mida" alt="">
    </a>
    <a href="./LICENSE">
        <img src="https://img.shields.io/npm/l/@reiryoku/mida" alt="">
    </a>
    <a href="https://discord.gg/cKyWTUsr3q">
        <img src="https://img.shields.io/discord/780532638846287904?label=community" alt="">
    </a>
</p>
<br><br>

## Introduction
Mida is the TypeScript framework for trading financial assets such as stocks,
crypto, forex or commodities. It is designed from the ground up to provide a solid,
versatile and platform-neutral environment for creating trading bots, indicators,
market analysis tools or just trading applications depending on use cases.

Join the community on [Discord](https://discord.gg/cKyWTUsr3q) and [Telegram](https://t.me/joinmida)
to get help you with your first steps.
<br>

## Table of contents
* [Ecosystem](#ecosystem)
* [Supported platforms](#supported-platforms)
* [Installation](#installation)
* [Usage](#usage)
    * [Account login](#account-login)
    * [Balance, equity and margin](#balance-equity-and-margin)
    * [Orders, deals and positions](#orders-deals-and-positions)
    * [Symbols and assets](#symbols-and-assets)
    * [Ticks and candlesticks](#ticks-and-candlesticks)
    * [Trading bots (expert advisors)](#trading-bots-expert-advisors)
    * [Technical indicators](#technical-indicators)
* [License and disclaimer](#license-and-disclaimer)
* [Contributors](#contributors)

## Ecosystem
| Project                                                               | Status                                                                                                                | Description                                           |
|-----------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------|
| [Mida](https://github.com/Reiryoku-Technologies/Mida)                 | [![Image](https://img.shields.io/npm/v/@reiryoku/mida)](https://www.npmjs.com/package/@reiryoku/mida)                 | The Mida core                                         |
| [Mida Binance](https://github.com/Reiryoku-Technologies/Mida-Binance) | [![Image](https://img.shields.io/npm/v/@reiryoku/mida-binance)](https://www.npmjs.com/package/@reiryoku/mida-binance) | A Mida plugin for trading with Binance                |
| [Mida cTrader](https://github.com/Reiryoku-Technologies/Mida-cTrader) | [![Image](https://img.shields.io/npm/v/@reiryoku/mida-ctrader)](https://www.npmjs.com/package/@reiryoku/mida-ctrader) | A Mida plugin for using cTrader accounts              |
| [Mida Tulipan](https://github.com/Reiryoku-Technologies/Mida-Tulipan) | [![Image](https://img.shields.io/npm/v/@reiryoku/mida-tulipan)](https://www.npmjs.com/package/@reiryoku/mida-tulipan) | A Mida plugin providing technical analysis indicators |
| [Apollo](https://github.com/Reiryoku-Technologies/Apollo)             | [![Image](https://img.shields.io/npm/v/@reiryoku/apollo)](https://www.npmjs.com/package/@reiryoku/apollo)             | A library for getting real-time economic data         |

## Supported platforms
Mida is platform-neutral, this means any trading platform could
be easily integrated in the ecosystem.<br>
Here are some of the most popular platforms supported by Mida.

<br><br>
<p align="center"> 
    <img src="images/featured-platforms.svg" alt="" width="594px">
</p>
<br><br>

## Installation
To get started just use the command below in your terminal.
```console
npm init mida
```

## Usage
### Account login
How to login into a Binance Spot account.
```javascript
const { Mida, } = require("@reiryoku/mida");

const myAccount = await Mida.login("Binance/Spot", {
    apiKey: "...",
    apiSecret: "...",
});
```
To get an `apiKey` and `apiSecret` you need to [create a Binance account](https://accounts.binance.com/en/register?ref=172142672).<br>

### Balance, equity and margin
How to get the account balance, equity and margin.
```javascript
console.log(await myAccount.getBalance());
console.log(await myAccount.getEquity());
console.log(await myAccount.getFreeMargin());
console.log(await myAccount.getUsedMargin());
```

### Orders, deals and positions
How top open a long position for Bitcoin against USDT.
```javascript
const { MidaOrderDirection, } = require("@reiryoku/mida");

const myOrder = await myAccount.placeOrder({
    symbol: "BTCUSDT",
    direction: MidaOrderDirection.BUY,
    volume: 1,
});

console.log(myOrder.id);
console.log(myOrder.executionPrice);
console.log(myOrder.positionId);
console.log(myOrder.trades);
```

How to open a short position for EUR against USD.
```javascript
const { MidaOrderDirection, } = require("@reiryoku/mida");

const myOrder = await myAccount.placeOrder({
    symbol: "EURUSD",
    direction: MidaOrderDirection.SELL,
    volume: 0.1,
});

console.log(myOrder.id);
console.log(myOrder.executionPrice);
console.log(myOrder.positionId);
console.log(myOrder.trades);
```

How to open a long position for Apple stocks with error handler.
```javascript
const {
    MidaOrderDirection,
    MidaOrderRejection,
} = require("@reiryoku/mida");

const myOrder = await myAccount.placeOrder({
    symbol: "#AAPL",
    direction: MidaOrderDirection.BUY,
    volume: 888,
});

if (myOrder.isRejected) {
    switch (myOrder.rejection) {
        case MidaOrderRejection.MARKET_CLOSED: {
            console.log("#AAPL market is closed!");

            break;
        }
        case MidaOrderRejection.NOT_ENOUGH_MONEY: {
            console.log("You don't have enough money in your account!");

            break;
        }
        case MidaOrderRejection.INVALID_SYMBOL: {
            console.log("Your account doesn't support trading Apple stocks!");

            break;
        }
    }
}
```

<details>
<summary>More examples</summary>

How to open a long position for GBP against USD with stop loss and take profit.
```javascript
const { MidaOrderDirection, } = require("@reiryoku/mida");

const symbol = "GBPUSD";
const lastBid = await myAccount.getSymbolBid(symbol);
const myOrder = await myAccount.placeOrder({
    symbol,
    direction: MidaOrderDirection.BUY,
    volume: 0.1,
    protection: {
        stopLoss: lastBid - 0.0010, // <= SL 10 pips
        takeProfit: lastBid + 0.0030, // <= TP 30 pips
    },
});
```

How to close an open position.
```javascript
const {
    MidaOrderDirection,
    MidaPositionDirection,
} = require("@reiryoku/mida");

const myPosition = await myAccount.getPositionById("...");

await myPosition.close();
// or
await myPosition.subtractVolume(myPosition.volume);
// or
await myAccount.placeOrder({
    positionId: myPosition.id,
    direction: myPosition.direction === MidaPositionDirection.LONG ? MidaOrderDirection.SELL : MidaOrderDirection.BUY,
    volume: myPosition.volume,
});
```

How to retrieve all open positions and pending orders.
```javascript
console.log(await myAccount.getOpenPositions());
console.log(await myAccount.getPendingOrders());
```

How to set take profit and stop loss for a position.
```javascript
await myPosition.changeProtection({
    takeProfit: 200,
    stopLoss: 100,
});
```

</details>

### Symbols and assets
How to retrieve all symbols available for your trading account.
```javascript
const symbols = await myAccount.getSymbols();

console.log(symbols);
```

How to retrieve a symbol.
```javascript
const symbol = await myAccount.getSymbol("#AAPL");

if (!symbol) {
    console.log("Apple stocks are not available for this account!");
}
else {
    console.log(symbol.digits);
    console.log(symbol.leverage);
    console.log(symbol.baseAsset);
    console.log(symbol.quoteAsset);
    console.log(await symbol.isMarketOpen());
}
```

How to get the price of a symbol.
```javascript
const symbol = await myAccount.getSymbol("BTCUSDT");
const price = await symbol.getBid();

console.log(`Bitcoin price is ${price} USDT`);

// or

console.log(await myAccount.getSymbolBid("BTCUSDT"));
```

### Ticks and candlesticks
How to listen the ticks of a symbol.
```javascript
const { MidaMarketWatcher, } = require("@reiryoku/mida");

const marketWatcher = new MidaMarketWatcher({ tradingAccount: myAccount, });

await marketWatcher.watch("BTCUSDT", { watchTicks: true, });

marketWatcher.on("tick", (event) => {
    const { tick, } = event.descriptor;

    console.log(`Bitcoin price is now ${tick.bid} USDT`);
});
```

How to get the candlesticks of a symbol (candlesticks and bars are generically called periods).
```javascript
const { MidaTimeframe, } = require("@reiryoku/mida");

const periods = await myAccount.getSymbolPeriods("EURUSD", MidaTimeframe.M30);
const lastPeriod = periods[periods.length - 1];

console.log("Last candlestick start time: " + lastPeriod.startTime);
console.log("Last candlestick OHLC: " + lastPeriod.ohlc);
console.log("Last candlestick close price: " + lastPeriod.close);
```

How to listen when candlesticks are closed.
```javascript
const {
    MidaMarketWatcher,
    MidaTimeframe,
} = require("@reiryoku/mida");

const marketWatcher = new MidaMarketWatcher({ tradingAccount: myAccount, });

await marketWatcher.watch("BTCUSDT", {
    watchPeriods: true,
    timeframes: [
        MidaTimeframe.M5,
        MidaTimeframe.H1,
    ],
});

marketWatcher.on("period-close", (event) => {
    const { period, } = event.descriptor;

    switch (period.timeframe) {
        case MidaTimeframe.M5: {
            console.log(`M5 candlestick closed at ${period.close}`);

            break;
        }
        case MidaTimeframe.H1: {
            console.log(`H1 candlestick closed at ${period.close}`);

            break;
        }
    }
});
```
The `on` method returns a unique ID that can be used to unsubscribing from the event listener.
```const uuid = marketWatcher.on("period-close", (event) => { ... });
marketWatcher.removeEventListener(uuid);
```

### Trading bots (expert advisors)
How to create a trading bot (or expert advisor).
```javascript
const {
    MidaExpertAdvisor,
    MidaTimeframe,
} = require("@reiryoku/mida");

class MyTradingStrategy extends MidaExpertAdvisor {
    constructor ({ tradingAccount, }) {
        super({
            name: "MyTradingStrategy",
            version: "1.0.0",
            tradingAccount,
        });
    }

    async configure () {
        // Every expert advisor has an integrated market watcher
        await this.watchTicks("BTCUSDT");
        await this.watchPeriods("BTCUSDT", MidaTimeframe.H1);
    }

    async onStart () {
        console.log("The trading bot has started...");
    }

    async onTick (tick) {
        // Implement your strategy
    }

    async onPeriodClose (period) {
        console.log(`H1 candlestick closed at ${period.open}`);
    }

    async onStop () {
        console.log("The trading bot has been interrupted...");
    }
}
```

How to execute a trading bot.
```javascript
const { Mida, } = require("@reiryoku/mida");
const { MyExpertAdvisor, } = require("./my-expert-advisor");

const myAccount = await Mida.login(/* ... */);
const myAdvisor = new MyExpertAdvisor({ tradingAccount: myAccount, });

await myAdvisor.start();
```

### Technical indicators
Install the plugin providing technical analysis indicators.
```javascript
const { Mida, } = require("@reiryoku/mida");

// Use the Mida Tulipan plugin
Mida.use(require("@reiryoku/mida-tulipan"));
```

How to calculate SMA (Simple Moving Average).
```javascript
const { Mida, MidaTimeframe, } = require("@reiryoku/mida");

// Get latest candlesticks on H1 timeframe
const candlesticks = await myAccount.getSymbolPeriods("EURUSD", MidaTimeframe.H1);
const closePrices = candlesticks.map((candlestick) => candlestick.close);

// Calculate RSI on close prices, pass values from oldest to newest
const sma = await Mida.createIndicator("SMA").calculate(closePrices);

// Values are from oldest to newest
console.log(sma);
```

How to calculate RSI (Relative Strength Index).
```javascript
const { Mida, MidaTimeframe, } = require("@reiryoku/mida");

// Get latest candlesticks on H1 timeframe
const candlesticks = await myAccount.getSymbolPeriods("BTCUSDT", MidaTimeframe.H1);
const closePrices = candlesticks.map((candlestick) => candlestick.close);

// Calculate RSI on close prices, pass values from oldest to newest
const rsi = await Mida.createIndicator("RSI").calculate(closePrices);

// Values are from oldest to newest
console.log(rsi);
```

## License and disclaimer
[LICENSE](./LICENSE)<br><br>
Trading in financial markets is highly speculative and carries a high level of risk.
It's possible to lose all your capital. This project may not be suitable for everyone,
you should ensure that you understand the risks involved. Mida and its contributors
are not responsible for any technical inconvenience that may lead to money loss, for example a stop loss not being set.

## Contributors
| Name         | Contribution          | GitHub                                          | Contact                   |
|--------------|-----------------------|-------------------------------------------------|---------------------------|
| Vasile Pește | Author and maintainer | [Vasile-Peste](https://github.com/Vasile-Peste) | vasile.peste@reiryoku.com |
