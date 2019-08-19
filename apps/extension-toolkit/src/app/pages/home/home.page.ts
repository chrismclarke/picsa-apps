import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { ENVIRONMENT } from '@picsa/environments';
import { APP_VERSION } from '@picsa/environments/version';
import { UserStore } from '../../store/user.store';
import { IRegionLang } from '@picsa/models';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss']
})
export class HomePage implements OnInit {
  links: ILink[];
  name: string;
  version = APP_VERSION;
  subtitle: string = ENVIRONMENT.region.subtitle;
  columns: number;

  constructor(private router: Router, public store: UserStore) {
    this.links = [
      {
        ...LINK_DEFAULTS,
        name: 'Budget Tool',
        icon: 'picsa_budget-tool',
        url: '/budget'
      },

      {
        ...LINK_DEFAULTS,
        name: 'Climate Tool',
        icon: 'picsa_climate-tool',
        url: '/climate'
      },
      {
        ...LINK_DEFAULTS,
        name: 'Resources',
        icon: 'picsa_resources',
        url: '/resources'
      },
      {
        ...LINK_DEFAULTS,
        name: 'Discussions',
        icon: 'picsa_discussions',
        url: '/discussions'
      },
      {
        ...LINK_DEFAULTS,
        name: 'Data Collection',
        icon: 'picsa_data-collection',
        url: '/data/record'
      },
      {
        ...LINK_DEFAULTS,
        name: 'Settings',
        icon: 'picsa_settings',
        url: '/settings'
      }
    ];
  }

  setLanguage(lang: IRegionLang) {
    this.store.updateUser({ lang: lang.code });
  }
  linkClicked(link: ILink) {
    console.log('link clicked', link);
    this.router.navigate([link.url]);
  }

  ngOnInit() {
    this.columns = this._calculateColumns(window.innerWidth);
  }
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.columns = this._calculateColumns(event.target.innerWidth);
  }
  _calculateColumns(width: number) {
    return width < 425 ? 2 : width < 800 ? 3 : 6;
  }
}

const LINK_DEFAULTS: ILink = {
  cols: 1,
  rows: 1
};

interface ILink {
  name?: string;
  cols: number;
  rows: number;
  icon?: string;
  img?: string;
  url?: string;
}