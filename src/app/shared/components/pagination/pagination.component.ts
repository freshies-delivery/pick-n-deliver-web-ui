import { Component, Input, Output, EventEmitter, computed, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss'
})
export class PaginationComponent {
  @Input() total = 0;
  @Input() pageSize = 10;
  @Input() currentPage = 1;
  @Output() pageChange = new EventEmitter<number>();

  get totalPages(): number { return Math.max(1, Math.ceil(this.total / this.pageSize)); }
  get startItem(): number { return this.total === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1; }
  get endItem(): number { return Math.min(this.currentPage * this.pageSize, this.total); }

  get visiblePages(): (number | '...')[] {
    const tp = this.totalPages;
    const cur = this.currentPage;
    if (tp <= 7) return Array.from({ length: tp }, (_, i) => i + 1);
    const pages: (number | '...')[] = [1];
    if (cur > 3) pages.push('...');
    for (let i = Math.max(2, cur - 1); i <= Math.min(tp - 1, cur + 1); i++) pages.push(i);
    if (cur < tp - 2) pages.push('...');
    pages.push(tp);
    return pages;
  }

  go(page: number | '...'): void {
    if (page === '...' || page === this.currentPage) return;
    this.pageChange.emit(page as number);
  }

  prev(): void { if (this.currentPage > 1) this.pageChange.emit(this.currentPage - 1); }
  next(): void { if (this.currentPage < this.totalPages) this.pageChange.emit(this.currentPage + 1); }
}
