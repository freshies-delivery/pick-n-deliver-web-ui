import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { getStatusConfig, StatusConfig } from '../../../shared/constants/status.constant';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="status-pill"
      [style.background]="cfg.bg"
      [style.color]="cfg.color"
      [style.border-color]="cfg.border">
      {{ cfg.label }}
    </span>
  `,
  styles: [`
    .status-pill {
      display: inline-block;
      font-size: 10px;
      padding: 2px 7px;
      border-radius: 100px;
      font-weight: 600;
      border: 1px solid;
      letter-spacing: 0.02em;
    }
  `]
})
export class StatusBadgeComponent {
  @Input() set status(v: string | undefined) { this.cfg = getStatusConfig(v); }
  cfg: StatusConfig = getStatusConfig(undefined);
}
