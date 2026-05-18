import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-spinner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './spinner.component.html',
  styleUrl: './spinner.component.scss',
  host: {
    '[class.sp-page]':    'variant === "page"',
    '[class.sp-overlay]': 'variant === "overlay"',
    '[class.sp-inline]':  'variant === "inline"',
    '[class.sp-xs]': 'size === "xs"',
    '[class.sp-sm]': 'size === "sm"',
    '[class.sp-md]': 'size === "md"',
    '[class.sp-lg]': 'size === "lg"',
    '[class.sp-xl]': 'size === "xl"',
  },
})
export class SpinnerComponent {
  @Input() size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() variant: 'inline' | 'page' | 'overlay' = 'page';
  @Input() label = '';
}
