import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BudgetToolActions } from '../store/budget-tool.actions';
import {
  IBudget,
  IBudgetCard,
  IBudgetDotValues,
  ICustomBudgetCard
} from '../models/budget-tool.models';
import { BUDGET_DATA } from '../data/budget.data';
import {
  StorageProvider,
  UserProvider,
  DBService,
  IDBEndpoint
} from '@picsa/core/services';

@Injectable({ providedIn: 'root' })
export class BudgetToolProvider {
  dotValues: IBudgetDotValues;
  constructor(
    public db: DBService,
    public userPrvdr: UserProvider,
    private actions: BudgetToolActions,
    private storagePrvdr: StorageProvider
  ) {
    this.init();
  }

  // automatically populate data from storage
  // if first load, populate storage with hardcoded data
  async init() {
    const budgetData = await this.storagePrvdr.storage.get('_budgetMeta');
    if (!budgetData) {
      await this.storagePrvdr.storage.set('_budgetMeta', BUDGET_DATA);
      this.init();
    } else {
      console.log('setting budget meta', BUDGET_DATA);
      this.actions.setBudgetMeta(BUDGET_DATA);
    }
  }

  /*
      The methods below are used to keep firebase data sync'd locally when internet available
      They are sinukar to firebase and storage provider methods, but included again
      to retain tool independent use, allow subcollection paths and custom data sort
  
      */

  // watch afs data endpoints and reflect changes to redux and localstorage
  // NOTE this is just for main card types and not custom (which is stored to user)
  async syncData() {
    for (const endpoint of Object.keys(BUDGET_DATA)) {
      const collection = this.db.getCollection(
        `budgetTool/meta/${endpoint}` as IDBEndpoint
      ) as Observable<ICustomBudgetCard[]>;
      collection.subscribe(data => {
        if (data && data.length > 0) {
          const orderedData = this._sortData(data);
          console.log('updating syncd budget meta', data);
          this.actions.patchBudgetMeta({ [endpoint]: orderedData });
        }
      });
    }
  }

  _sortData(collection: ICustomBudgetCard[]) {
    try {
      // want to first sort alphabetically
      collection = collection.sort((a, b) => {
        return a.name > b.name ? 1 : -1;
      });
      // then demote cards which are 'custom:true'
      collection = collection.sort((a, b) => {
        return !a.custom ? -1 : !b.custom ? 1 : -1;
      });
      return collection;
    } catch (error) {
      return collection;
    }
  }

  // instead of usual sync from db to local, this can be used to populate the main db from local
  // NOTE, THIS OVERRIDES EXISTING DATA ON MATCH, ONLY USE IF YOU KNOW WHAT YOU ARE DOING
  async populateDB() {
    for (const endpoint of Object.keys(BUDGET_DATA)) {
      const data: IBudgetCard[] = BUDGET_DATA[endpoint];
      data.forEach(datum => {
        const docId = datum.id;
        this.db.setDoc(`budgetTool/meta/${endpoint}/${docId}`, datum);
      });
    }
  }
}
