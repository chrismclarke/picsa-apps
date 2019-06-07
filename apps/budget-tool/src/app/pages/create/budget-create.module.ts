import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';

import { BudgetCreatePage } from './budget-create.page';
import { PicsaMaterialModule } from '../../material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MobxAngularModule } from 'mobx-angular';
import { BudgetToolComponentsModule } from '../../components/budget-tool.components';

const routes: Routes = [
  {
    path: '',
    component: BudgetCreatePage
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    PicsaMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    MobxAngularModule,
    BudgetToolComponentsModule
  ],
  declarations: [BudgetCreatePage]
})
export class BudgetCreatePageModule {}