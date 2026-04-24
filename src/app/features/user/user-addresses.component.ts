import { Component, computed, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { UserContextService } from '../../core/services/user-context.service';

@Component({
  selector: 'app-user-addresses',
  standalone: true,
  imports: [PageHeaderComponent],
  templateUrl: './user-addresses.component.html',
  styleUrl: './user-addresses.component.scss'
})
export class UserAddressesComponent {
  readonly userId = signal(0);
  readonly userLabel = computed(() => this.userContext.state.userName ?? `#${this.userId()}`);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly userContext: UserContextService
  ) {
    const id = Number(this.route.snapshot.paramMap.get('userId'));
    this.userId.set(id);
    this.userContext.setUser(id, this.userContext.state.userName);
  }
}

