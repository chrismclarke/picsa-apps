import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BudgetStore } from '../../store/budget.store';
import { Fade } from '@picsa/animations';

@Component({
  selector: 'budget-view',
  templateUrl: './budget-view.page.html',
  styleUrls: ['./budget-view.page.scss'],
  animations: [Fade()]
})
export class BudgetViewPage implements OnInit {
  loader: HTMLIonLoadingElement;

  constructor(private route: ActivatedRoute, private store: BudgetStore) {}

  ngOnInit() {
    this.loadBudget();
  }

  async loadBudget() {
    const budgetKey = this.route.snapshot.params.budgetKey;
    this.store.loadBudgetByKey(budgetKey);
  }
}
