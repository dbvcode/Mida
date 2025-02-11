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

import { MidaTradingAccount } from "#accounts/MidaTradingAccount";
import { MidaDateUtilities } from "#dates/MidaDateUtilities";
import { MidaEvent } from "#events/MidaEvent";
import { MidaEventListener } from "#events/MidaEventListener";
import { MidaPeriod } from "#periods/MidaPeriod";
import { MidaTick } from "#ticks/MidaTick";
import { MidaEmitter } from "#utilities/emitters/MidaEmitter";
import { GenericObject } from "#utilities/GenericObject";
import { MidaUtilities } from "#utilities/MidaUtilities";
import { MidaMarketWatcherDirectives } from "#watchers/MidaMarketWatcherDirectives";
import { MidaMarketWatcherParameters } from "#watchers/MidaMarketWatcherParameters";
import { isA } from "@jest/expect-utils";

const { utcTimestamp, } = MidaDateUtilities;
const { mergeOptions, } = MidaUtilities;

export class MidaMarketWatcher {
    readonly #tradingAccount: MidaTradingAccount;
    #isActive: boolean;
    readonly #watchedSymbols: Map<string, MidaMarketWatcherDirectives>;
    readonly #lastClosedPeriods: Map<string, Map<number, MidaPeriod>>;
    readonly #emitter: MidaEmitter;
    #ticksListenerUuid?: string;
    #closedPeriodsTimeoutId?: NodeJS.Timer;
    #closedPeriodsIntervalId?: NodeJS.Timer;

    public constructor ({ tradingAccount, }: MidaMarketWatcherParameters) {
        this.#tradingAccount = tradingAccount;
        this.#isActive = true;
        this.#watchedSymbols = new Map();
        this.#lastClosedPeriods = new Map();
        this.#emitter = new MidaEmitter();

        this.#configureListeners();
    }

    public get tradingAccount (): MidaTradingAccount {
        return this.#tradingAccount;
    }

    public get isActive (): boolean {
        return this.#isActive;
    }

    public set isActive (isActive: boolean) {
        this.#isActive = isActive;
    }

    public get watchedSymbols (): string[] {
        return [ ...this.#watchedSymbols.keys(), ];
    }

    public getSymbolDirectives (symbol: string): MidaMarketWatcherDirectives | undefined {
        return this.#watchedSymbols.get(symbol);
    }

    public async watch (symbol: string, directives: MidaMarketWatcherDirectives): Promise<void> {
        const timeframes: number[] | undefined = directives.timeframes;

        if (Array.isArray(timeframes) && timeframes.length > 0) {
            directives.timeframes = [ ...new Set(timeframes), ];
        }

        await this.#configureSymbolDirectives(symbol, directives);
        this.#watchedSymbols.set(symbol, mergeOptions(this.#watchedSymbols.get(symbol) ?? {}, directives));
    }

    public async unwatch (symbol: string): Promise<void> {
        this.#watchedSymbols.delete(symbol);
    }

    async #configureSymbolDirectives (symbol: string, directives: MidaMarketWatcherDirectives): Promise<void> {
        const previousDirectives: MidaMarketWatcherDirectives | undefined = this.#watchedSymbols.get(symbol);

        if (directives.watchTicks && !previousDirectives?.watchTicks) {
            await this.#tradingAccount.watchSymbolTicks(symbol);
        }

        if (directives.watchPeriods && Array.isArray(directives.timeframes)) {
            for (const timeframe of directives.timeframes) {
                await this.#configureSymbolTimeframe(symbol, timeframe);
            }
        }
    }

    async #configureSymbolTimeframe (symbol: string, timeframe: number): Promise<void> {
        const periods: MidaPeriod[] = await this.#tradingAccount.getSymbolPeriods(symbol, timeframe);
        const lastPeriod: MidaPeriod = periods[periods.length - 1];

        if (!this.#lastClosedPeriods.get(symbol)) {
            this.#lastClosedPeriods.set(symbol, new Map());
        }

        this.#lastClosedPeriods.get(symbol)?.set(timeframe, lastPeriod);
    }

    public on (type: string): Promise<MidaEvent>;
    public on (type: string, listener: MidaEventListener): string;
    public on (type: string, listener?: MidaEventListener): Promise<MidaEvent> | string {
        if (!listener) {
            return this.#emitter.on(type);
        }

        return this.#emitter.on(type, listener);
    }

    public removeEventListener (uuid: string): void {
        this.#emitter.removeEventListener(uuid);
    }

    protected notifyListeners (type: string, descriptor?: GenericObject): void {
        if (this.isActive) {
            this.#emitter.notifyListeners(type, descriptor);
        }
    }

    async #checkNewClosedPeriods (): Promise<void> {
        if (!this.isActive) {
            return;
        }

        for (const symbol of this.watchedSymbols) {
            const directives: MidaMarketWatcherDirectives = this.#watchedSymbols.get(symbol) as MidaMarketWatcherDirectives;
            const timeframes: number[] | undefined = directives.timeframes;

            if (!directives.watchPeriods || !Array.isArray(timeframes) || timeframes.length < 1) {
                continue;
            }

            for (const timeframe of timeframes) {
                try {
                    await this.#checkClosedPeriod(symbol, timeframe);
                }
                catch {
                    // Silence is golden
                }
            }
        }
    }

    // Used to check if the last known symbol period has been closed
    // Must be called approximately with a 1 minute interval
    async #checkClosedPeriod (symbol: string, timeframe: number): Promise<void> {
        const lastLocalPeriod: MidaPeriod = this.#lastClosedPeriods.get(symbol)?.get(timeframe) as MidaPeriod;
        const lastLocalPeriodCloseTimestamp: number = lastLocalPeriod.endDate.timestamp;

        // Don't request the last period if the last known period has not ended yet
        if (utcTimestamp() < lastLocalPeriodCloseTimestamp + timeframe) {
            return;
        }

        const periods: MidaPeriod[] = await this.#tradingAccount.getSymbolPeriods(symbol, timeframe);
        const lastPeriod: MidaPeriod = periods[periods.length - 1];

        if (lastPeriod.endDate.timestamp > lastLocalPeriodCloseTimestamp) {
            this.#lastClosedPeriods.get(symbol)?.set(timeframe, lastPeriod);
            this.#onPeriodClose(lastPeriod);
        }
    }

    #onTick (tick: MidaTick): void {
        const directives: MidaMarketWatcherDirectives | undefined = this.#watchedSymbols.get(tick.symbol);

        if (directives?.watchTicks) {
            this.notifyListeners("tick", { tick, });
        }
    }

    #onPeriodClose (period: MidaPeriod): void {
        this.notifyListeners("period-close", { period, });
    }

    #configureListeners (): void {
        // <ticks>
        this.#ticksListenerUuid = this.#tradingAccount.on("tick", (event: MidaEvent): void => this.#onTick(event.descriptor.tick));
        // </ticks>

        // <periods>
        const actualDate: Date = new Date();
        const roundMinute: Date = new Date(actualDate);

        roundMinute.setSeconds(0);

        this.#closedPeriodsTimeoutId = setTimeout((): void => {
            this.#checkNewClosedPeriods();

            this.#closedPeriodsIntervalId = setInterval(() => this.#checkNewClosedPeriods(), 60000);
        }, roundMinute.valueOf() + 60000 - actualDate.valueOf() + 3000); // Invoke the function the next round minute plus 3s of margin
        // </periods>
    }
}
