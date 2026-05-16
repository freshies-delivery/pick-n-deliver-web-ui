import {
  Component, Input, Output, EventEmitter,
  ChangeDetectionStrategy, signal, OnChanges, SimpleChanges
} from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-image-search',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  templateUrl: './image-search.component.html',
  styleUrl: './image-search.component.scss',
})
export class ImageSearchComponent implements OnChanges {
  @Input() initialQuery = '';
  @Input() currentUrl = '';
  @Output() imageSelected = new EventEmitter<string>();
  @Output() imageCleared  = new EventEmitter<void>();

  readonly urlInput = signal('');
  readonly preview  = signal('');
  readonly error    = signal(false);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentUrl']?.currentValue) {
      this.urlInput.set(this.currentUrl);
      this.preview.set(this.currentUrl);
    }
  }

  onUrlChange(val: string): void {
    this.urlInput.set(val);
    this.error.set(false);
    if (val.trim()) {
      this.preview.set(val.trim());
      this.imageSelected.emit(val.trim());
    } else {
      this.preview.set('');
      this.imageCleared.emit();
    }
  }

  onImgError(): void {
    this.error.set(true);
  }

  clear(): void {
    this.urlInput.set('');
    this.preview.set('');
    this.error.set(false);
    this.imageCleared.emit();
  }
}
