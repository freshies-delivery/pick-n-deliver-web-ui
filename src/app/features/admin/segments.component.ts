import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { Segment, SegmentService } from './segment.service';

@Component({
  selector: 'app-segments',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent],
  templateUrl: './segments.component.html',
  styleUrl: './segments.component.scss'
})
export class SegmentsComponent implements OnInit {
  readonly loading = signal(true);
  readonly segments = signal<Segment[]>([]);

  constructor(private readonly segmentService: SegmentService) {}

  ngOnInit(): void {
    this.segmentService.list().subscribe({
      next: (segments) => {
        this.segments.set(segments);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
