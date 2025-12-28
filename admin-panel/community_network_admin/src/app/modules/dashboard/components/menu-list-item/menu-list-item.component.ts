import { Component, HostBinding, Input, OnInit } from '@angular/core';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { NavItem } from '../../models/nav-item.model';
import { ActivatedRoute, Router } from '@angular/router';
import { NavServiceService } from '../../services/nav-service.service';

@Component({
  selector: 'app-menu-list-item',
  templateUrl: './menu-list-item.component.html',
  styleUrls: ['./menu-list-item.component.scss'],
  animations: [
    trigger('indicatorRotate', [
      state('collapsed', style({ transform: 'rotate(0deg)' })),
      state('expanded', style({ transform: 'rotate(180deg)' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4,0.0,0.2,1)')
      ),
    ]),
  ],
})
export class MenuListItemComponent implements OnInit {
  expanded: boolean = false;
  @HostBinding('attr.aria-expanded') ariaExpanded = this.expanded;
  @Input() item!: NavItem;
  @Input() depth!: number;

  constructor(public router: Router, public navService: NavServiceService, private route: ActivatedRoute) {
    if (this.depth === undefined) {
      this.depth = 0;
    }
  }

  ngOnInit(): void {}

  onItemSelected(item: NavItem) {
    if (!item.children || !item.children.length) {
      this.router.navigate([item.route], { relativeTo: this.route });
      this.navService.closeNav();
    }
    if (item.children && item.children.length) {
      this.expanded = !this.expanded;
    }
  }
  isRouterActive(route:string | undefined) {
    return route ? this.router.isActive(route, true) : false
  }
}
