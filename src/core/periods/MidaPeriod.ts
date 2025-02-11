/*
 * Copyright Reiryoku Technologies and its contributors, www.reiryoku.com, www.mida.org
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
*/

import { MidaDate } from "#dates/MidaDate";
import { MidaPeriodParameters } from "#periods/MidaPeriodParameters";
import { MidaQuotationPrice } from "#quotations/MidaQuotationPrice";
import { MidaTick } from "#ticks/MidaTick";
import { IMidaEquatable } from "#utilities/equatable/IMidaEquatable";
import { GenericObject } from "#utilities/GenericObject";

/** Represents a period (commonly named bar or candlestick) */
export class MidaPeriod implements IMidaEquatable {
    readonly #symbol: string;
    readonly #startDate: MidaDate;
    readonly #quotationPrice: MidaQuotationPrice;
    readonly #open: number;
    readonly #high: number;
    readonly #low: number;
    readonly #close: number;
    readonly #volume: number;
    readonly #timeframe: number;
    readonly #ticks?: MidaTick[];

    public constructor ({
        symbol,
        startDate,
        quotationPrice,
        open,
        high,
        low,
        close,
        volume,
        timeframe,
        ticks,
    }: MidaPeriodParameters) {
        this.#symbol = symbol;
        this.#startDate = startDate;
        this.#quotationPrice = quotationPrice;
        this.#open = open;
        this.#high = high;
        this.#low = low;
        this.#close = close;
        this.#volume = volume;
        this.#timeframe = timeframe;
        this.#ticks = ticks;
    }

    /** The period symbol */
    public get symbol (): string {
        return this.#symbol;
    }

    /** The period start date */
    public get startDate (): MidaDate {
        return this.#startDate;
    }

    /** The price represented by the period (bid or ask) */
    public get quotationPrice (): MidaQuotationPrice {
        return this.#quotationPrice;
    }

    /** The period open price */
    public get open (): number {
        return this.#open;
    }

    /** The period highest price */
    public get high (): number {
        return this.#high;
    }

    /** The period lowest price */
    public get low (): number {
        return this.#low;
    }

    /** The period close price */
    public get close (): number {
        return this.#close;
    }

    /** The period volume */
    public get volume (): number {
        return this.#volume;
    }

    /** The period timeframe (expressed in seconds) */
    public get timeframe (): number {
        return this.#timeframe;
    }

    /** The period ticks, usually ticks are not registered */
    public get ticks (): readonly MidaTick[] | undefined {
        return this.#ticks;
    }

    /** The period end date */
    public get endDate (): MidaDate {
        return this.#startDate.add(this.#timeframe * 1000);
    }

    /** The period momentum */
    public get momentum (): number {
        return this.#close / this.#open;
    }

    /** The period body */
    public get body (): number {
        return this.#close - this.#open;
    }

    /** The period absolute body */
    public get absBody (): number {
        return Math.abs(this.body);
    }

    /** The period lower shadow */
    public get lowerShadow (): number {
        return Math.min(this.#open, this.#close) - this.#low;
    }

    /** The period upper shadow */
    public get upperShadow (): number {
        return this.#high - Math.max(this.#open, this.#close);
    }

    /** The period OHLC (open, high, low, close) */
    public get ohlc (): number[] {
        return [
            this.#open,
            this.#high,
            this.#low,
            this.#close,
        ];
    }

    /** The period OHLCV (open, high, low, close, volume) */
    public get ohlcv (): number[] {
        return [ ...this.ohlc, this.#volume, ];
    }

    /** Indicates if the period is bearish (negative body) */
    public get isBearish (): boolean {
        return this.body < 0;
    }

    /** Indicates if the period is neutral (zero body) */
    public get isNeutral (): boolean {
        return this.body === 0;
    }

    /** Indicates if the period is bullish (positive body) */
    public get isBullish (): boolean {
        return this.body > 0;
    }

    /**
     * Used to verify if two periods are equal in terms of symbol, start time and timeframe
     * @param object
     */
    public equals (object: GenericObject): boolean {
        return (
            object instanceof MidaPeriod
            && this.symbol === object.symbol
            && this.startDate.timestamp === object.startDate.timestamp
            && this.timeframe === object.timeframe
        );
    }
}

// eslint-disable-next-line max-lines-per-function
export function composePeriods (
    ticks: MidaTick[],
    startTime: MidaDate,
    timeframe: number,
    quotationPrice: MidaQuotationPrice = MidaQuotationPrice.BID,
    limit: number = -1
): MidaPeriod[] {
    if (ticks.length < 1 || timeframe <= 0) {
        return [];
    }

    let periodStartTime: MidaDate = startTime;

    function getNextPeriodEndTime (): MidaDate {
        return new MidaDate(periodStartTime.timestamp + timeframe * 1000);
    }

    const periods: MidaPeriod[] = [];
    let periodTicks: MidaTick[] = [];
    let periodEndTime: MidaDate = getNextPeriodEndTime();

    function tryComposePeriod (): void {
        if (periodTicks.length < 1) {
            return;
        }

        periods.push(new MidaPeriod({
            symbol: ticks[0].symbol,
            startDate: periodStartTime,
            quotationPrice,
            open: periodTicks[0][quotationPrice],
            high: Math.max(...periodTicks.map((tick: MidaTick): number => tick[quotationPrice])),
            low: Math.min(...periodTicks.map((tick: MidaTick): number => tick[quotationPrice])),
            close: periodTicks[periodTicks.length - 1][quotationPrice],
            volume: periodTicks.length,
            timeframe,
            ticks: [ ...periodTicks, ],
        }));

        periodTicks = [];
    }

    for (const tick of ticks) {
        if (limit > -1 && periods.length === limit) {
            return periods;
        }

        if (tick.date < periodStartTime) {
            continue;
        }

        let periodHasEnded: boolean = false;

        while (tick.date > periodEndTime) {
            periodStartTime = new MidaDate(periodEndTime.timestamp);
            periodEndTime = getNextPeriodEndTime();

            if (!periodHasEnded) {
                periodHasEnded = true;
            }
        }

        if (periodHasEnded) {
            tryComposePeriod();
        }

        periodTicks.push(tick);
    }

    tryComposePeriod();

    return periods;
}
