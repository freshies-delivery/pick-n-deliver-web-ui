import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

export interface StripStat {
  value: string | number;
  label: string;
  iconPath: string;
  iconBg: string;
  iconColor: string;
  valueColor?: string;
}

@Component({
  selector: 'app-stats-strip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './stats-strip.component.html',
  styleUrl: './stats-strip.component.scss'
})
export class StatsStripComponent {
  @Input() stats: StripStat[] = [];
}
