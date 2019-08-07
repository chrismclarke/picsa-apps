import { Injectable } from '@angular/core';
import { toJS } from 'mobx';
import { observable, action, computed } from 'mobx-angular';
import * as merge from 'deepmerge';

import {
  IBudget,
  IBudgetPeriodData,
  IBudgetCard,
  IBudgetActiveCell,
  IBudgetMeta,
  IBudgetCardDB,
  IBudgetCardWithValues,
  IBudgetValueScale,
  IBudgetValueCounters
} from '../models/budget-tool.models';
import { checkForBudgetUpgrades } from '../utils/budget.upgrade';
import { NEW_BUDGET_TEMPLATE, MONTHS } from './templates';
import CARDS from '../data/cards';
import { PicsaDbService, generateDBMeta } from '@picsa/services/core/';
import { IAppMeta } from '@picsa/models/db.models';
import { APP_VERSION } from '@picsa/environments/version';
import { ENVIRONMENT } from '@picsa/environments';
@Injectable({
  providedIn: 'root'
})
export class BudgetStore {
  @observable budgetCards: IBudgetCard[] = [];
  @observable activeBudget: IBudget;
  @observable activeCell: IBudgetActiveCell;
  @observable isEditorOpen = false;
  @observable savedBudgets: IBudget[];
  @observable valueCounters: IBudgetValueCounters;
  get activeBudgetValue() {
    return toJS(this.activeBudget);
  }
  // enterprises only have a single group which is used during card filtering
  get enterpriseGroup() {
    return this.activeBudget.meta.enterprise.groupings![0];
  }
  // get unique list of types in enterprise cards
  @computed get enterpriseTypeCards(): IBudgetCardDB[] {
    const enterpriseCards = this.budgetCards.filter(
      c => c.type === 'enterprise'
    );
    return this._createCardGroupCards(enterpriseCards);
  }

  // filter cards to match type (e.g. activities) and group (e.g. crops)
  @computed get groupTypeCards(): IBudgetCard[] {
    const type = this.activeCell.typeKey;
    const typeCards = this.budgetCards.filter(c => c.type === type);
    return typeCards.filter(c => c.groupings.includes(this.enterpriseGroup));
  }
  @computed get otherTypeCards(): IBudgetCard[] {
    const type = this.activeCell.typeKey;
    const typeCards = this.budgetCards.filter(c => c.type === type);
    return typeCards.filter(c => !c.groupings.includes(this.enterpriseGroup));
  }
  @computed get budgetPeriodLabels(): string[] {
    return this._generateLabels(this.activeBudget.meta);
  }
  @action setActiveBudget(budget: IBudget) {
    this.activeBudget = budget;
    console.log('active budget', toJS(this.activeBudget));
    this.valueCounters = this._generateValueCounters();
    console.log('value counters', toJS(this.valueCounters));
  }

  constructor(private db: PicsaDbService) {
    this.init();
  }

  /**************************************************************************
   *            Enterprise methods
   *
   ***************************************************************************/
  getfilteredEnterprises(grouping: string) {
    return this.budgetCards.filter(
      e => e.type === 'enterprise' && e.groupings.includes(grouping)
    );
  }
  /**************************************************************************
   *            Budget Values
   *
   ***************************************************************************/
  // merge current budget with added data, optionally can merge deep to include
  // nested properties
  patchBudget(patch: Partial<IBudget>, deepMerge = false) {
    console.log('patching', patch, deepMerge);
    const budget = deepMerge
      ? merge(this.activeBudget, patch)
      : { ...this.activeBudget, ...patch };
    this.setActiveBudget(budget);
    this.saveBudget();
  }
  // populate correct budget data based on editor data and current active cell
  saveEditor(data: IBudgetCardWithValues[]) {
    const d = this.activeBudget.data;
    const c = this.activeCell;
    d[c.periodIndex][c.typeKey] = data;
    this.patchBudget({ data: d });
  }
  @action()
  setActiveCell(cell: IBudgetActiveCell) {
    cell.cellData = this.activeBudgetValue.data[cell.periodIndex][cell.typeKey];
    this.activeCell = cell;
    // use small timeout to allow time for exit animations
    setTimeout(() => {
      this.toggleEditor();
    }, 200);
  }
  @action()
  toggleEditor() {
    this.isEditorOpen = !this.isEditorOpen;
  }
  @action()
  scaleValueCounters(scale: IBudgetValueScale) {
    const oldScale = this.activeBudget.meta.valueScale;
    const newScale = scale * oldScale;
    this.patchBudget({
      meta: { ...this.activeBudget.meta, valueScale: newScale }
    });
    this.valueCounters = this._generateValueCounters();
  }

  /**************************************************************************
   *            Budget Create/Save/Load
   *
   ***************************************************************************/

  createNewBudget() {
    const budget: IBudget = {
      ...NEW_BUDGET_TEMPLATE,
      ...generateDBMeta()
    };
    this.setActiveBudget(budget);
  }
  async saveBudget() {
    await this.db.setDoc(
      'budgetTool/${GROUP}/budgets',
      this.activeBudgetValue,
      true
    );
    await this.loadSavedBudgets();
  }
  async loadBudgetByKey(key: string) {
    if (!this.activeBudget || this.activeBudget._key !== key) {
      await this.loadSavedBudgets();
      const budget = this.savedBudgets.find(b => b._key === key);
      this.loadBudget(toJS(budget));
    }
  }
  async loadBudget(budget: IBudget) {
    console.log('loading budget', budget);
    budget = checkForBudgetUpgrades(budget);
    this.setActiveBudget(budget);
  }

  private async loadSavedBudgets(): Promise<void> {
    const budgets = await this.db.getCollection<IBudget>(
      'budgetTool/${GROUP}/budgets'
    );
    this.savedBudgets = budgets.sort((a, b) =>
      b._modified > a._modified ? 1 : -1
    );
  }

  async deleteBudget(budget: IBudget) {
    await this.db.deleteDocs('budgetTool/${GROUP}/budgets', [budget._key]);
    this.loadSavedBudgets();
  }

  /**************************************************************************
   *            Initialisation
   *
   ***************************************************************************/
  async init() {
    this.loadSavedBudgets();
    await this.checkForUpdates();
    await this.preloadData();
  }

  // load the corresponding values into the budgetMeta observable
  @action()
  private async preloadData() {
    const endpoint = 'budgetTool/_all/cards';
    this.budgetCards = await this.db.getCollection<IBudgetCard>(endpoint);
  }
  // check for latest app version initialised. If this one is different then
  // attempt to reload any hardcoded data present in the app
  private async checkForUpdates() {
    const version = await this.db.getDoc<IAppMeta>('_appMeta', 'VERSION');
    const updateRequired = !version || version.value !== APP_VERSION.number;
    if (updateRequired) {
      await this.setHardcodedData();
      const update: IAppMeta = { _key: 'VERSION', value: APP_VERSION.number };
      this.db.setDoc('_appMeta', update);
    }
  }
  private async setHardcodedData() {
    const endpoint = 'budgetTool/_all/cards';
    const docs: IBudgetCardDB[] = CARDS.map(card => {
      return {
        ...card,
        // add doc metadata - this would be auto populated however want to keep
        // reference of app version date so can be overwritten by db if desired
        _created: new Date(APP_VERSION.date).toISOString(),
        _modified: new Date(APP_VERSION.date).toISOString(),
        _key: `${card.type}_${card.id}`
      };
    });
    await this.db.setDocs(endpoint, docs);
  }

  /**************************************************************************
   *            Calculation Methods
   *
   ***************************************************************************/

  private calculateBalance() {
    // total for current period
    // const data = this.store.activeBudget.data;
    // const totals = {};
    // let runningTotal = 0;
    // for (const key in data) {
    //   if (data.hasOwnProperty(key)) {
    //     const periodTotal = this._calculatePeriodTotal(data[key]);
    //     runningTotal = runningTotal + periodTotal;
    //     totals[key] = {
    //       period: periodTotal,
    //       running: runningTotal
    //     };
    //   }
    // }
    // this.balance = totals;
  }
  private _calculatePeriodTotal(period: IBudgetPeriodData) {
    // let balance = 0;
    // if (period) {
    //   const inputCards = Object.values(period.inputs);
    //   const inputsBalance = this._calculatePeriodCardTotals(inputCards);
    //   const outputCards = Object.values(period.outputs);
    //   const outputsBalance = this._calculatePeriodCardTotals(outputCards);
    //   balance = inputsBalance + outputsBalance;
    // }
    // return balance;
  }
  private _calculatePeriodCardTotals(cards: IBudgetCard[]) {
    console.log('TODO');
    // let total = 0;
    // if (cards && cards.length > 0) {
    //   cards.forEach(card => {
    //     if (card.quantity && card.cost) {
    //       const quantity = card.consumed
    //         ? card.quantity - card.consumed
    //         : card.quantity;
    //       total = total + quantity * card.cost;
    //     }
    //   });
    // }
    // return total;
  }

  /**************************************************************************
   *           Helper Methods
   *
   ***************************************************************************/

  // create list of labels depending on scale, total and start, e.g. ['week 1','week 2'] or ['Sep','Oct','Nov']
  private _generateLabels(meta: IBudgetMeta): string[] {
    const { lengthScale, lengthTotal, monthStart = 1 } = meta;
    // duplicate array so that can still slice up to 12 months from dec
    let base = [...MONTHS, ...MONTHS];
    if (lengthScale === 'weeks') {
      base = base.map((_, i) => `Week ${i + 1}`);
    }
    if (lengthScale === 'days') {
      base = base.map((_, i) => `Day ${i + 1}`);
    }
    const labels = base.slice(monthStart - 1, lengthTotal + monthStart - 1);
    return labels;
  }
  // group all enterprise cards and create new parent card that will be used to reveal group
  private _createCardGroupCards(cards: IBudgetCard[]): IBudgetCardDB[] {
    const allGroupings = cards.map(e => toJS(e.groupings));
    const mergedGroupings: string[] = [].concat.apply([], allGroupings);
    const uniqueGroups = [...new Set(mergedGroupings)].sort();
    const enterpriseTypeCards: IBudgetCardDB[] = uniqueGroups.map(group => {
      return {
        id: group,
        label: group,
        type: 'enterprise',
        imgType: 'svg',
        _key: `_group_${group}`,
        _created: new Date().toISOString(),
        _modified: new Date().toISOString()
      };
    });
    return enterpriseTypeCards;
  }
  // each currency has a base unit (e.g. MK 1000) which is used to generate
  // counter representations in orders of 10 (i.e. 100, 1000, 10000) and half values.
  // These can additionaly be scaled up or down by magnitudes of 10.
  private _generateValueCounters() {
    const scale = this.activeBudget.meta.valueScale;
    // use rounding to avoid annoying precious errors
    const b = Math.round(ENVIRONMENT.region.currencyBaseValue * scale);
    // return as arrays to ensure order retained if iterating over
    const counters: IBudgetValueCounters = [
      ['large', 'large-half', 'medium', 'medium-half', 'small', 'small-half'],
      [10 * b, 5 * b, b, b / 5, b / 10, b / 20]
    ];
    return counters;
  }
}
